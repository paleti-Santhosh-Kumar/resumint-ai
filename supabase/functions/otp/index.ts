// ───────────────────────────────────────────────────────────────────────────
//  Supabase Edge Function:  otp   (SEND + VERIFY in one function)
//  Path: supabase/functions/otp/index.ts   (Deno runtime)
//
//  One function does both jobs, selected by { action } in the request body:
//    { "action": "send",  "email": "x@y.com" }            → generates code, emails via Resend
//    { "action": "verify", "email": "x@y.com", "code": "123456" } → checks + single-use delete
//
//  The 6-digit code is generated SERVER-SIDE, stored in otp_codes, and emailed
//  via Resend. The RESEND_API_KEY lives ONLY here. The browser never sees it.
//
//  ── Deploy WITHOUT the CLI (Dashboard path) ──────────────────────────────
//  1. Supabase Dashboard → Edge Functions → "Deploy a new Function"
//     Name: otp  → paste this whole file → Deploy
//  2. Project Settings → Edge Functions → Secrets, add:
//        RESEND_API_KEY = re_F5rYu5RP_AYU9N2oSRDkqcmbbwHrerkDs
//        MAIL_FROM      = RESUMINT AI <onboarding@resend.dev>   (or your verified domain)
//  3. Run the SQL migration (supabase/migrations/0001_otp_codes.sql) once.
//
//  Auto-injected by Supabase (no setup): SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
// ───────────────────────────────────────────────────────────────────────────
// @ts-nocheck (Deno — not part of the Vite build)
import { Resend } from "https://esm.sh/resend@3.5.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY") ?? "");
const FROM = Deno.env.get("MAIL_FROM") ?? "RESUMINT AI <onboarding@resend.dev>";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Content-Type": "application/json",
};
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: cors });
const admin = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` };

function emailHtml(code: string) {
  return `
  <div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:auto;background:#0a0c16;color:#e8eaf2;padding:40px;border-radius:16px">
    <div style="text-align:center;margin-bottom:24px">
      <span style="display:inline-block;padding:8px 14px;border-radius:10px;background:linear-gradient(120deg,#7c3aed,#06b6d4);color:#fff;font-weight:700;letter-spacing:.5px">RESUMINT AI</span>
    </div>
    <h1 style="font-size:22px;margin:0 0 8px;text-align:center">Your verification code</h1>
    <p style="color:#9aa0b5;line-height:1.6;text-align:center">Enter this 6-digit code to continue. It expires in 10 minutes.</p>
    <div style="margin:28px 0;text-align:center">
      <span style="display:inline-block;font-size:40px;letter-spacing:14px;font-weight:800;color:#fff;background:#11131f;padding:20px 32px;border-radius:14px;border:1px solid #2a2d3f">${code}</span>
    </div>
    <p style="color:#5a5a6e;font-size:12px;text-align:center;margin:0">If you didn't request this, you can safely ignore this email.</p>
  </div>`;
}

// ── SEND ──
async function send(email: string) {
  // Rate limit: 1 code / email / 30s
  const sel = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}&select=created_at`, { headers: admin });
  const rows = await sel.json();
  if (rows?.[0] && Date.now() - new Date(rows[0].created_at).getTime() < 30_000) {
    return json({ ok: false, error: "Too many requests — please wait 30 seconds." }, 429);
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();
  const dbRes = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?on_conflict=email`, {
    method: "POST",
    headers: { ...admin, "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" },
    body: JSON.stringify({ email, code, expires_at, attempts: 0 }),
  });
  if (!dbRes.ok) return json({ ok: false, error: "Could not store code — did you run the SQL migration?" }, 500);

  const { error } = await resend.emails.send({
    from: FROM, to: email,
    subject: `Your RESUMINT verification code: ${code}`,
    html: emailHtml(code),
    text: `Your RESUMINT verification code is ${code}. It expires in 10 minutes.`,
  });
  if (error) return json({ ok: false, error: error.message }, 502);
  return json({ ok: true });
}

// ── VERIFY ──
async function verify(email: string, code: string) {
  const sel = await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}&select=code,expires_at,attempts`, { headers: admin });
  const rows = await sel.json();
  const row = rows?.[0];
  if (!row) return json({ ok: false, error: "No code found — request a new one." });
  if (Date.now() > new Date(row.expires_at).getTime()) return json({ ok: false, error: "Code expired — request a new one." });
  if (row.attempts >= 5) return json({ ok: false, error: "Too many attempts — request a new code." });

  if (row.code !== code) {
    await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}`, {
      method: "PATCH", headers: { ...admin, "Content-Type": "application/json", Prefer: "return=minimal" },
      body: JSON.stringify({ attempts: row.attempts + 1 }),
    });
    return json({ ok: false, error: "Invalid code" });
  }

  await fetch(`${SUPABASE_URL}/rest/v1/otp_codes?email=eq.${encodeURIComponent(email)}`, { method: "DELETE", headers: admin });
  return json({ ok: true, email });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ ok: false, error: "Method Not Allowed" }, 405);
  try {
    const { action, email, code } = await req.json();
    const e = String(email || "").toLowerCase();
    if (!e || !EMAIL_RE.test(e)) return json({ ok: false, error: "Invalid email address" }, 400);
    if (action === "send") return await send(e);
    if (action === "verify") {
      const c = String(code || "").trim();
      if (!/^\d{6}$/.test(c)) return json({ ok: false, error: "Invalid code" }, 400);
      return await verify(e, c);
    }
    return json({ ok: false, error: "Unknown action" }, 400);
  } catch (e) {
    return json({ ok: false, error: String(e) }, 500);
  }
});
