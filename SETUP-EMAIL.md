# 📧 Real Resend OTP — one function, no CLI needed

This app sends a **pure 6-digit code via Resend**. One Edge Function does both
the sending and the verifying.

> **Why a function is required (not optional):** Resend is a server-only API.
> Every request to `api.resend.com` carries an `Authorization` header that
> triggers a browser CORS preflight, which Resend doesn't answer — so a direct
> call from the browser is **blocked**. The key also can't live in the frontend.
> Therefore the email must originate from a server. This is the only step.

## Turn it on (≈3 minutes, no CLI)

**1. Run the SQL once** — Supabase Dashboard → **SQL Editor** → New query →
paste the contents of `supabase/migrations/0001_otp_codes.sql` → **Run**.

**2. Deploy the function** — Dashboard → **Edge Functions → "Deploy a new
Function"** → name it **`otp`** → paste the entire contents of
`supabase/functions/otp/index.ts` → **Deploy**.

**3. Add your Resend key** — Dashboard → **Project Settings → Edge Functions →
Secrets** → add:
```
RESEND_API_KEY  =  re_F5rYu5RP_AYU9N2oSRDkqcmbbwHrerkDs
MAIL_FROM       =  RESUMINT AI <onboarding@resend.dev>
```
*(Use your own verified domain for production sending.)*

Done. The app already calls `https://vqtmkjtatjqcxsjjsapo.supabase.co/functions/v1/otp`
with `{ action: "send" | "verify", email, code }`. Signups now email a real code.

## What runs where
| Step | Where | What |
|------|-------|------|
| Enter email | Browser | validates format + blocks disposable domains |
| **send** | Edge Function | generates 6-digit code, stores it, emails via **Resend** |
| Enter code | Browser | 6 OTP boxes |
| **verify** | Edge Function | checks code/expiry/attempts, single-use delete |

## Until you deploy the function
The app runs in **Preview / Test mode**: it generates a code locally and shows it
on screen (so the full sign-up → verify → dashboard flow is testable). The moment
the function is live, that box disappears and the code goes to the inbox instead.

## Resend "from" domain
Resend requires a verified sender domain. `onboarding@resend.dev` only delivers to
your Resend account's email for testing. Verify your own domain in the Resend
dashboard for production.

## (CLI alternative)
```bash
supabase functions deploy otp --no-verify-jwt
supabase secrets set RESEND_API_KEY=re_F5rYu5RP_AYU9N2oSRDkqcmbbwHrerkDs
supabase secrets set MAIL_FROM="RESUMINT AI <onboarding@resend.dev>"
```
