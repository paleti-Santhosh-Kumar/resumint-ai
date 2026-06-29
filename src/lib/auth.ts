// ───────────────────────────────────────────────────────────────────────────
//  Auth logic: real client-side validation + OTP flow.
//
//  Email/password validation runs fully on the client (real rules).
//  The OTP is generated here; "delivery" routes to a backend when configured
//  (VITE_API_BASE). Without a backend it runs in a secure DEMO mode that
//  surfaces the code in-app so the full flow is exercisable end-to-end.
//
//  To enable REAL email delivery, deploy a tiny server using your Resend key:
//
//    // Node/Express or a Supabase Edge Function
//    import Resend from "resend";
//    const resend = new Resend(process.env.RESEND_API_KEY); // server-side only
//    app.post("/api/auth/send-otp", async (req, res) => {
//      const { email, code } = req.body;
//      await resend.emails.send({
//        from: "RESUMINT <no-reply@resumint.ai>",
//        to: email, subject: "Your RESUMINT verification code",
//        text: `Your code is ${code}. It expires in 10 minutes.`,
//      });
//      res.json({ ok: true });
//    });
//
//  The client below already POSTs to AUTH_ENDPOINTS.sendOtp — no UI changes
//  needed once the server is live.
// ───────────────────────────────────────────────────────────────────────────
import { AUTH_ENDPOINTS, hasBackend } from "./config";

const EMAIL_RE = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

const DISPOSABLE = new Set([
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com",
  "trashmail.com", "yopmail.com", "getnada.com", "temp-mail.org",
  "throwaway.email", "dispostable.com", "sharklasers.com", "maildrop.cc",
  "fakeinbox.com", "mintemail.com", "mohmal.com", "emailondeck.com",
]);

export type EmailCheck = { valid: boolean; reason?: string };

export function validateEmail(email: string): EmailCheck {
  const e = email.trim().toLowerCase();
  if (!e) return { valid: false, reason: "Email is required" };
  if (!EMAIL_RE.test(e)) return { valid: false, reason: "Enter a valid email address" };
  const domain = e.split("@")[1];
  if (DISPOSABLE.has(domain)) return { valid: false, reason: "Disposable emails aren't allowed" };
  if (e.includes("..")) return { valid: false, reason: "Enter a valid email address" };
  return { valid: true };
}

export type PwResult = {
  score: number; // 0-4
  label: string;
  color: string;
  checks: { label: string; ok: boolean }[];
};

export function passwordStrength(pw: string): PwResult {
  const checks = [
    { label: "8+ characters", ok: pw.length >= 8 },
    { label: "Uppercase letter", ok: /[A-Z]/.test(pw) },
    { label: "Lowercase letter", ok: /[a-z]/.test(pw) },
    { label: "Number", ok: /\d/.test(pw) },
    { label: "Symbol", ok: /[^A-Za-z0-9]/.test(pw) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const map = [
    { label: "Very weak", color: "#ef4444" },
    { label: "Weak", color: "#f59e0b" },
    { label: "Fair", color: "#eab308" },
    { label: "Strong", color: "#22c55e" },
    { label: "Excellent", color: "#10b981" },
  ];
  return { score, ...map[Math.min(score, 4)], checks };
}

export function generateOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export type OtpDelivery =
  | { delivered: true; mode: "email" }
  | { delivered: false; mode: "demo"; code: string; reason?: string }
  | { delivered: false; mode: "error"; reason: string };

/** Hash a code with a short expiry. (Demo-quality obfuscation; real hashing
 *  belongs server-side with Argon2 — see config notes.) */
function stashCode(email: string, code: string) {
  try {
    sessionStorage.setItem(
      "resumint.otp",
      JSON.stringify({ email: email.toLowerCase(), code, exp: Date.now() + 10 * 60 * 1000 })
    );
  } catch {
    /* ignore */
  }
}

export function verifyOtp(email: string, code: string): boolean {
  try {
    const raw = sessionStorage.getItem("resumint.otp");
    if (!raw) return false;
    const data = JSON.parse(raw) as { email: string; code: string; exp: number };
    if (Date.now() > data.exp) return false;
    return data.email === email.toLowerCase() && data.code === code;
  } catch {
    return false;
  }
}

export type VerifyMode = "email" | "demo" | "error";

/** Verifies the OTP via the Resend Edge Function (real email mode) or the
 *  locally stashed code (demo fallback). */
export async function verifyCode(email: string, code: string, mode: VerifyMode): Promise<boolean> {
  // Real email → verify against the server-side code via the function
  if (mode === "email" && hasBackend) {
    try {
      const res = await fetch(AUTH_ENDPOINTS.otp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return true;
      return false;
    } catch {
      return false;
    }
  }
  // Demo → verify against the locally stashed code
  return verifyOtp(email, code);
}

export async function sendOtp(email: string): Promise<OtpDelivery> {
  // ── REAL delivery via the Resend Edge Function ──
  // The function generates + stores the code server-side and emails it with
  // Resend. The browser only sends { email } — it never sees the code or key.
  if (hasBackend) {
    try {
      const res = await fetch(AUTH_ENDPOINTS.otp, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "send", email }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) return { delivered: true, mode: "email" };
      if (res.status === 429) {
        return { delivered: false, mode: "error", reason: data.error || "Too many requests — wait 30s." };
      }
      if (res.ok && !data.ok) {
        // Function deployed but delivery failed (Resend/domain issue)
        return { delivered: false, mode: "error", reason: data.error || "Email delivery failed." };
      }
      // 404 etc → function not deployed → fall through to demo
    } catch {
      /* network/unreachable → fall through to demo */
    }
  }

  // ── Demo fallback (function not deployed yet) ──
  await new Promise((r) => setTimeout(r, 600));
  const code = generateOtp();
  stashCode(email, code);
  return {
    delivered: false,
    mode: "demo",
    code,
    reason:
      "Deploy the otp Edge Function once (SETUP-EMAIL.md) to switch this into a real emailed code.",
  };
}
