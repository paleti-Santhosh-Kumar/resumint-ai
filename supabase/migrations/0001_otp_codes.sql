-- ─────────────────────────────────────────────────────────────────────
--  OTP storage for the Resend email flow.
--  Run once in: Supabase Dashboard → SQL Editor → New query → Run.
-- ─────────────────────────────────────────────────────────────────────

-- Holds the 6-digit code for each email address (server-generated, emailed
-- via Resend from the Edge Function).
create table if not exists public.otp_codes (
  email       text primary key,
  code        text     not null,
  expires_at  timestamptz not null,
  attempts    int      not null default 0,
  created_at  timestamptz not null default now()
);

-- RLS ON with no policy = the public anon key CANNOT read codes.
-- The Edge Function uses the SERVICE ROLE key, which bypasses RLS, so only
-- the server ever touches these rows. Keeps codes private even from the browser.
alter table public.otp_codes enable row level security;
