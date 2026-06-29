// ───────────────────────────────────────────────────────────────────────────
//  Central, PUBLIC-SAFE configuration.
//
//  SECURITY: No secret keys live here or anywhere in the client bundle.
//  A Vite single-file app is 100% client-side and publicly readable, so
//  embedding OPENAI_API_KEY / RESEND_API_KEY / DATABASE_URL / NEXTAUTH_SECRET
//  would expose them to every visitor. Instead, real delivery happens through
//  a backend you control. Point VITE_API_BASE at it and the same code paths
//  switch from demo → production automatically.
//
//  Create a .env (or set in your host) with:
//    VITE_API_BASE=https://your-backend.example.com
//    VITE_SUPABASE_URL=...        (publishable only — never the service key)
//    VITE_SUPABASE_ANON_KEY=...   (publishable only)
// ───────────────────────────────────────────────────────────────────────────

const env = (import.meta as unknown as { env?: Record<string, string | undefined> }).env ?? {};

// ── Publishable Supabase project URL (safe to embed). It points the OTP flow at
//    the Edge Functions (send-otp / verify-otp) that email a 6-digit code via
//    Resend. The Resend key lives ONLY in those functions, never here. Override
//    via env if you fork the project. (NEVER put the service-role key here.) ──
const DEFAULT_SUPABASE_URL = "https://vqtmkjtatjqcxsjjsapo.supabase.co";
const DEFAULT_SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZxdG1ranRhdGpxY3hzampzYXBvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI2MjQxNjIsImV4cCI6MjA5ODIwMDE2Mn0.pMkyB6uM-qHAWUa9ToKqKHeGNcJ-UzO3I7w8i75W2lY";

export const config = {
  apiBase: (env.VITE_API_BASE ?? "").replace(/\/$/, ""),
  supabaseUrl: env.VITE_SUPABASE_URL ?? DEFAULT_SUPABASE_URL,
  supabaseAnonKey: env.VITE_SUPABASE_ANON_KEY ?? DEFAULT_SUPABASE_ANON,
};

/** True when a real backend is configured — flips demo features to live. */
export const hasBackend = config.apiBase.length > 0 || config.supabaseUrl.length > 0;

/** Single combined endpoint (send + verify) on the Supabase Edge Function.
 *  The function reads { action: "send" | "verify" } from the body. */
const otpEndpoint = config.apiBase
  ? `${config.apiBase}/api/auth/otp`
  : config.supabaseUrl
    ? `${config.supabaseUrl}/functions/v1/otp`
    : "";

export const AUTH_ENDPOINTS = {
  otp: otpEndpoint,
  signup: `${config.apiBase}/api/auth/signup`,
  signin: `${config.apiBase}/api/auth/signin`,
  ai: `${config.apiBase}/api/ai`,
};
