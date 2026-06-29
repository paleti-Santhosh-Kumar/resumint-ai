import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Mail, Lock, User, ArrowRight, ShieldCheck, KeyRound,
  Eye, EyeOff, Check, Loader2, AlertCircle, Inbox, ArrowLeft,
} from "lucide-react";
import { useRouter } from "../lib/router";
import { GlassCard, Reveal } from "../components/ui";
import { useToast } from "../components/Toast";
import {
  validateEmail, passwordStrength, sendOtp, verifyCode, type VerifyMode,
} from "../lib/auth";
import { hasBackend } from "../lib/config";
import { accountExists, verifyCredentials, createAccount, getReturnTo } from "../lib/accounts";
import { useUser } from "../lib/user";

type Phase = "form" | "otp" | "done";

export default function Auth() {
  const { navigate } = useRouter();
  const { toast } = useToast();
  const { session, login } = useUser();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [phase, setPhase] = useState<Phase>("form");

  // form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [emailErr, setEmailErr] = useState("");
  const [loading, setLoading] = useState(false);

  // otp state
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [demoCode, setDemoCode] = useState<string | null>(null);
  const [deliveryMode, setDeliveryMode] = useState<VerifyMode>("email");

  const pwRes = passwordStrength(pw);

  // Already signed in? Skip straight back to where they were (or dashboard).
  useEffect(() => {
    if (session) navigate(getReturnTo() ?? "/dashboard");
  }, [session, navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === "signup" && !name.trim()) { toast("Enter your name", "error"); return; }
    const emailCheck = validateEmail(email);
    if (!emailCheck.valid) { setEmailErr(emailCheck.reason ?? "Invalid email"); return; }
    setEmailErr("");
    if (pwRes.score < 3) { toast("Choose a stronger password", "error", "Use 8+ chars with letters, numbers & a symbol."); return; }

    // ── Credential checks (real auth) ──
    if (mode === "signup") {
      if (accountExists(email)) {
        toast("Account already exists", "info", "Sign in with your password instead.");
        setMode("signin");
        return;
      }
    } else {
      // Sign in: verify the password BEFORE sending a code.
      setLoading(true);
      const v = await verifyCredentials(email, pw);
      setLoading(false);
      if (!v.ok) { toast("Sign in failed", "error", v.error); return; }
    }

    setLoading(true);
    const delivery = await sendOtp(email);
    setLoading(false);

    setDeliveryMode(delivery.mode);
    if (delivery.mode === "demo") setDemoCode(delivery.code ?? null);
    if (delivery.mode === "error") { toast("Couldn't send code", "error", delivery.reason); return; }

    setPhase("otp");
    toast(
      "Verification code sent",
      "success",
      delivery.mode === "email" ? `Check your inbox at ${email}` : "Email delivery unavailable — demo code shown below"
    );
    if (delivery.mode === "demo" && delivery.reason) {
      toast("Fell back to demo mode", "info", delivery.reason);
    }
  };

  const verify = async () => {
    const code = otp.join("");
    if (code.length !== 6) { toast("Enter the 6-digit code", "error"); return; }
    setLoading(true);
    const ok = await verifyCode(email, code, deliveryMode);
    if (!ok) {
      setLoading(false);
      toast("Invalid or expired code", "error", "Try again or resend.");
      return;
    }

    // OTP verified → finalize the account + start a real session.
    if (mode === "signup") {
      const created = await createAccount(name, email, pw);
      if (!created.ok) {
        setLoading(false);
        toast("Couldn't create account", "error", created.error);
        setPhase("form");
        return;
      }
    }
    login(email, true);
    setLoading(false);
    setPhase("done");
    const back = getReturnTo();
    toast(mode === "signup" ? "Account created" : "Welcome back", "success", back ? "Continuing where you left off." : mode === "signup" ? "Your profile is ready." : "Signed in successfully.");
    setTimeout(() => navigate(back ?? "/dashboard"), 900);
  };

  const resend = async () => {
    setLoading(true);
    const delivery = await sendOtp(email);
    setLoading(false);
    setDeliveryMode(delivery.mode);
    if (delivery.mode === "demo") setDemoCode(delivery.code ?? null);
    else setDemoCode(null);
    toast(
      "New code sent",
      delivery.mode === "email" ? "success" : "info",
      delivery.mode === "email" ? `Check your inbox at ${email}` : delivery.reason
    );
  };

  const focusOtp = (i: number) => {
    const el = document.getElementById(`otp-${i}`) as HTMLInputElement | null;
    el?.focus();
  };

  return (
    <div className="relative z-10 grid min-h-screen lg:grid-cols-2">
      {/* left brand panel */}
      <div className="relative hidden flex-col justify-between overflow-hidden border-r border-white/10 p-12 lg:flex">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600/30 via-cyber-500/15 to-magenta-500/25" />
        <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
        <a href="#/" onClick={(e) => { e.preventDefault(); navigate("/"); }} className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500"><Sparkles className="h-4.5 w-4.5 text-white" /></span>
          <span className="font-display text-lg font-bold text-white">RESUMINT<span className="text-gradient"> AI</span></span>
        </a>
        <div>
          <Reveal>
            <h2 className="font-display text-4xl font-bold leading-tight text-white">Your AI Career<br />Operating System.</h2>
            <p className="mt-4 max-w-md text-slate-300">Join 2.4M+ professionals building smarter resumes, acing interviews, and landing dream roles — completely free.</p>
          </Reveal>
          <div className="mt-8 space-y-3">
            {["31 AI career engines", "10,000+ ATS-ready templates", "Live side-by-side editor", "Mock interviews & salary tools"].map((f) => (
              <div key={f} className="flex items-center gap-3 text-sm text-slate-200">
                <span className="grid h-5 w-5 place-items-center rounded-full bg-emerald-500/20"><Check className="h-3 w-3 text-emerald-400" /></span> {f}
              </div>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-400">
          <ShieldCheck className="h-4 w-4 text-emerald-400" /> PBKDF2 password hashing · OTP verification · stays signed in
        </div>
      </div>

      {/* right form */}
      <div className="flex items-center justify-center p-6 pt-28 sm:p-12">
        <div className="w-full max-w-md">
          <button onClick={() => navigate("/")} className="mb-4 flex items-center gap-1.5 text-xs text-slate-500 hover:text-white lg:hidden">
            <ArrowLeft className="h-3.5 w-3.5" /> Back home
          </button>

          <AnimatePresence mode="wait">
            {phase === "form" && (
              <motion.div key="form" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
                  {(["signup", "signin"] as const).map((m) => (
                    <button key={m} onClick={() => setMode(m)} className={`relative rounded-lg py-2.5 text-sm font-medium transition ${mode === m ? "text-white" : "text-slate-400"}`}>
                      {mode === m && <motion.span layoutId="auth-tab" className="absolute inset-0 -z-10 rounded-lg bg-gradient-to-r from-brand-500 to-brand-600" />}
                      {m === "signup" ? "Create account" : "Sign in"}
                    </button>
                  ))}
                </div>

                <GlassCard className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h1 className="font-display text-2xl font-bold text-white">{mode === "signup" ? "Start free, forever" : "Welcome back"}</h1>
                      <p className="mt-1 text-sm text-slate-400">{mode === "signup" ? "We'll verify your email with a one-time code." : "Sign in to your career OS."}</p>
                    </div>
                    {hasBackend && (
                      <span className="flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-medium text-emerald-300">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Resend OTP
                      </span>
                    )}
                  </div>

                  <form onSubmit={submit} className="space-y-3">
                    {mode === "signup" && (
                      <InputRow icon={User} type="text" placeholder="Full name" value={name} onChange={setName} />
                    )}
                    <div>
                      <InputRow icon={Mail} type="email" placeholder="you@email.com" value={email} onChange={(v) => { setEmail(v); setEmailErr(""); }} />
                      {emailErr && <p className="mt-1 flex items-center gap-1 text-[11px] text-red-400"><AlertCircle className="h-3 w-3" /> {emailErr}</p>}
                    </div>
                    <div className="relative">
                      <InputRow icon={Lock} type={showPw ? "text" : "password"} placeholder="Password" value={pw} onChange={setPw} />
                      <button type="button" onClick={() => setShowPw((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>

                    {mode === "signup" && pw.length > 0 && (
                      <div className="rounded-lg bg-white/[0.03] px-3 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-[11px] text-slate-400">Password strength</p>
                          <p className="text-[11px] font-semibold" style={{ color: pwRes.color }}>{pwRes.label}</p>
                        </div>
                        <div className="mt-1.5 flex gap-1">{[0, 1, 2, 3, 4].map((i) => (
                          <span key={i} className="h-1.5 flex-1 rounded-full transition" style={{ background: i < pwRes.score ? pwRes.color : "rgba(255,255,255,0.1)" }} />
                        ))}</div>
                        <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
                          {pwRes.checks.map((c) => (
                            <span key={c.label} className={`flex items-center gap-1 text-[10px] ${c.ok ? "text-emerald-400" : "text-slate-500"}`}>
                              <Check className="h-2.5 w-2.5" /> {c.label}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <button type="submit" disabled={loading}
                      className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60">
                      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      {mode === "signup" ? "Send verification code" : "Sign in"}
                      {!loading && <ArrowRight className="h-4 w-4" />}
                    </button>
                  </form>
                  <p className="mt-4 text-center text-[11px] text-slate-500">Passwords are PBKDF2-hashed with a per-user salt. We never store plaintext.</p>
                </GlassCard>
              </motion.div>
            )}

            {phase === "otp" && (
              <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }}>
                <GlassCard className="p-6 text-center">
                  <button onClick={() => setPhase("form")} className="mb-3 flex items-center gap-1 text-xs text-slate-500 hover:text-white">
                    <ArrowLeft className="h-3.5 w-3.5" /> Back
                  </button>
                  <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyber-500"><KeyRound className="h-6 w-6 text-white" /></span>
                  <h1 className="mt-4 font-display text-2xl font-bold text-white">Verify your email</h1>
                  <p className="mt-1 text-sm text-slate-400">Enter the 6-digit code we sent to<br /><span className="font-medium text-white">{email}</span></p>

                  {deliveryMode === "email" ? (
                    <p className="mt-3 text-[11px] leading-relaxed text-slate-500">
                      We emailed a 6-digit code via Resend. It can take up to a minute to arrive —
                      check your spam folder if needed.
                    </p>
                  ) : (
                    demoCode && (
                      <div className="mt-4 overflow-hidden rounded-2xl border border-brand-400/30 bg-brand-500/[0.07]">
                        <div className="border-b border-brand-400/20 px-4 py-2 text-center">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-brand-200">
                            <Inbox className="h-3 w-3" /> Test mode · code ready
                          </span>
                        </div>
                        <div className="px-4 py-3.5 text-center">
                          <p className="text-[11px] text-slate-400">Your verification code</p>
                          <p className="mt-1 font-mono text-3xl font-bold tracking-[0.4em] text-white">{demoCode}</p>
                          <button
                            onClick={() => setOtp(demoCode.split(""))}
                            className="mt-2 rounded-lg bg-white/10 px-3 py-1 text-[11px] font-medium text-white transition hover:bg-white/20"
                          >
                            Auto-fill code →
                          </button>
                          <p className="mx-auto mt-2 max-w-xs text-[10px] leading-snug text-slate-500">
                            Tip: deploy the <code className="text-slate-300">otp</code> Edge Function once (SETUP-EMAIL.md) to send real codes to your inbox.
                          </p>
                        </div>
                      </div>
                    )
                  )}

                  <div className="mt-6 flex justify-center gap-2">
                    {otp.map((d, i) => (
                      <input key={i} id={`otp-${i}`} value={d} inputMode="numeric" maxLength={1}
                        onChange={(e) => {
                          const v = e.target.value.replace(/\D/g, "").slice(-1);
                          setOtp((o) => o.map((x, k) => (k === i ? v : x)));
                          if (v && i < 5) focusOtp(i + 1);
                        }}
                        onKeyDown={(e) => { if (e.key === "Backspace" && !otp[i] && i > 0) focusOtp(i - 1); }}
                        className="h-12 w-10 rounded-xl border border-white/15 bg-white/5 text-center font-display text-xl font-bold text-white focus:border-brand-400/60 focus:outline-none" />
                    ))}
                  </div>

                  <button onClick={verify} disabled={loading} className="btn-glow mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-60">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Verify & continue {!loading && <ArrowRight className="h-4 w-4" />}
                  </button>
                  <button onClick={resend} disabled={loading} className="mt-3 text-xs text-slate-500 hover:text-white">Didn't get it? Resend code</button>
                </GlassCard>
              </motion.div>
            )}

            {phase === "done" && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                <GlassCard className="p-10 text-center">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-emerald-500/20">
                    <Check className="h-8 w-8 text-emerald-400" />
                  </motion.span>
                  <h1 className="mt-4 font-display text-2xl font-bold text-white">You're all set! 🎉</h1>
                  <p className="mt-2 text-sm text-slate-400">Taking you to your dashboard…</p>
                </GlassCard>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function InputRow({ icon: Icon, value, onChange, ...rest }: {
  icon: typeof Mail; value: string; onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value">) {
  return (
    <div className="relative">
      <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input {...rest} value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
    </div>
  );
}
