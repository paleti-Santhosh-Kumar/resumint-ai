import { useRef, useState } from "react";
import { motion, useMotionValue } from "framer-motion";
import {
  ArrowRight, Check, Sparkles, ChevronDown, ShieldCheck, Zap,
} from "lucide-react";
import { Link } from "../lib/router";
import { DEFAULT_RESUME } from "../lib/store";
import {
  AI_FEATURES, TEMPLATES, STATS, TRUST, STEPS, FAQS, SECURITY,
  SECURE_IMPORTS, EXPORTS,
} from "../data/content";
import ParticleField from "../components/ParticleField";
import MagneticButton from "../components/MagneticButton";
import ResumePreview from "../components/ResumePreview";
import ScoreRing from "../components/ScoreRing";
import { Reveal, SectionHeading, GlassCard, Spotlight, Pill, staggerParent, staggerChild } from "../components/ui";

export default function Landing() {
  return (
    <div className="relative">
      <Hero />
      <Marquee />
      <Stats />
      <Features />
      <BuilderShowcase />
      <TemplatesShowcase />
      <ATSVisual />
      <HowItWorks />
      <SecuritySection />
      <DeveloperCredit />
      <FAQ />
      <FinalCTA />
    </div>
  );
}

/* ───────────────────────── HERO (command-center) ───────────────────────── */
function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(50);
  const my = useMotionValue(40);

  const onMove = (e: React.MouseEvent) => {
    const r = ref.current?.getBoundingClientRect();
    if (!r) return;
    mx.set(((e.clientX - r.left) / r.width) * 100);
    my.set(((e.clientY - r.top) / r.height) * 100);
  };

  const bento = [
    { label: "ATS Score", value: "96", unit: "/100", accent: "#22d3ee", wide: false, ring: true },
    { label: "AI Rewrites", value: "31", unit: " engines", accent: "#7c3aed", wide: false },
    { label: "Templates", value: "1.2K+", unit: "", accent: "#ec4899", wide: false },
    { label: "Mock Interview", value: "9.2", unit: "/10", accent: "#10b981", wide: false },
  ];

  return (
    <section
      ref={ref}
      onMouseMove={onMove}
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pb-24 pt-36 text-center"
    >
      <ParticleField className="absolute inset-0 h-full w-full opacity-60" accent="#8b5cff" />

      {/* cursor-reactive spotlight */}
      <div
        className="pointer-events-none absolute inset-0 z-0 transition-opacity"
        style={{
          background: `radial-gradient(600px circle at ${mx.get()}% ${my.get()}%, rgba(139,92,255,0.14), transparent 55%)`,
        }}
      />

      <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-slate-300 backdrop-blur">
            <span className="flex h-2 w-2"><span className="h-2 w-2 animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="h-2 w-2 rounded-full bg-emerald-400" /></span>
            Introducing the AI Career Operating System
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 font-display text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-[5.4rem]"
        >
          Your career,<br />
          <span className="text-gradient">on autopilot.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 max-w-2xl text-lg leading-relaxed text-slate-400"
        >
          Build recruiter-ready resumes, beat the ATS, ace interviews, and track every application — all powered by AI. One intelligent platform, <span className="text-white">completely free.</span>
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
          className="mt-9 flex flex-col items-center gap-3 sm:flex-row"
        >
          <MagneticButton onClick={() => (window.location.hash = "/builder")} className="btn-glow group flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white">
            Build my resume — Free
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </MagneticButton>
          <Link to="/templates" className="group flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-7 py-4 text-base font-medium text-white backdrop-blur transition hover:border-white/30">
            <Sparkles className="h-4 w-4" /> Browse 1,200+ templates
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.8, delay: 0.4 }}
          className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-slate-500"
        >
          {["No credit card", "No watermarks", "ATS-tested", "Real account profiles"].map((t) => (
            <span key={t} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-emerald-400" /> {t}</span>
          ))}
        </motion.div>

        {/* bento stat grid */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mt-14 grid w-full max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4"
        >
          {bento.map((c) => (
            <motion.div key={c.label} whileHover={{ y: -4 }} className="glass card-hover rounded-2xl p-4">
              <div className="flex items-center justify-between">
                {c.ring ? (
                  <ScoreRing value={96} size={44} stroke={5} color={c.accent} />
                ) : (
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${c.accent}22` }}>
                    <Sparkles className="h-4 w-4" style={{ color: c.accent }} />
                  </span>
                )}
                <span className="h-1.5 w-1.5 rounded-full" style={{ background: c.accent }} />
              </div>
              <p className="mt-3 font-display text-2xl font-bold text-white">{c.value}<span className="text-sm text-slate-500">{c.unit}</span></p>
              <p className="text-[11px] text-slate-400">{c.label}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2">
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 1.8, repeat: Infinity }} className="flex flex-col items-center gap-1 text-slate-500">
          <span className="text-[10px] uppercase tracking-[0.2em]">Scroll</span>
          <ChevronDown className="h-4 w-4" />
        </motion.div>
      </div>
    </section>
  );
}

/* ───────────────────────── MARQUEE ───────────────────────── */
function Marquee() {
  const row = [...TRUST, ...TRUST];
  return (
    <section className="relative z-10 border-y border-white/5 bg-white/[0.02] py-8">
      <p className="mb-5 text-center text-xs uppercase tracking-[0.25em] text-slate-500">
        Trusted by talent hired at world-class companies
      </p>
      <div className="relative overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
        <div className="marquee-track gap-12">
          {row.map((name, i) => (
            <span key={i} className="whitespace-nowrap font-display text-xl font-semibold text-slate-600 transition hover:text-white">
              {name}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────────────────── STATS ───────────────────────── */
function Stats() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-20">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-3xl border border-white/10 bg-white/5 md:grid-cols-4">
        {STATS.map((s, i) => (
          <Reveal key={s.label} delay={i * 0.08}>
            <div className="bg-ink-950/40 p-8 text-center transition hover:bg-white/[0.03]">
              <p className="font-display text-4xl font-bold text-gradient sm:text-5xl">{s.value}</p>
              <p className="mt-2 text-sm text-slate-400">{s.label}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── FEATURES ───────────────────────── */
function Features() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="31 AI engines"
        title={<>One career OS. <span className="text-gradient">Every AI tool</span> you need.</>}
        subtitle="From writing and rewriting to scoring, tailoring, interviewing, and branding — RESUMINT replaces a dozen subscriptions with a single, intelligent platform."
      />
      <motion.div
        variants={staggerParent} initial="hidden" whileInView="show" viewport={{ once: true, margin: "-60px" }}
        className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {AI_FEATURES.map((f) => (
          <motion.div key={f.title} variants={staggerChild}>
            <Spotlight className="h-full">
              <GlassCard hover className="group h-full p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-cyber-500/20 ring-1 ring-white/10 transition group-hover:from-brand-500/40 group-hover:to-cyber-500/40">
                    <f.icon className="h-5 w-5 text-brand-200" />
                  </span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wide text-slate-400">{f.tag}</span>
                </div>
                <h3 className="text-[15px] font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-slate-400">{f.desc}</p>
              </GlassCard>
            </Spotlight>
          </motion.div>
        ))}
      </motion.div>
      <Reveal className="mt-10 text-center">
        <Link to="/tools" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-brand-400/50">
          Try every AI tool free <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── BUILDER SHOWCASE ───────────────────────── */
function BuilderShowcase() {
  const features = ["Side-by-side live preview", "Real-time ATS scoring", "Drag, reorder & custom sections", "Undo · Redo · Autosave", "Version history", "10,000+ templates", "Color, font & icon library", "QR code & signature"];
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="grid items-center gap-14 lg:grid-cols-2">
        <div>
          <SectionHeading
            center={false}
            eyebrow="Resume Builder"
            title={<>Edit on the left.<br /><span className="text-gradient">Watch it perfect itself</span> on the right.</>}
            subtitle="A buttery side-by-side editor with real-time preview. Every keystroke is scored, every bullet can be rewritten by AI, and your work autosaves continuously."
          />
          <div className="mt-8 grid grid-cols-2 gap-3">
            {features.map((f, i) => (
              <Reveal key={f} delay={i * 0.04}>
                <div className="flex items-center gap-2.5 rounded-xl border border-white/5 bg-white/[0.03] px-3 py-2.5">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-emerald-500/15"><Check className="h-3 w-3 text-emerald-400" /></span>
                  <span className="text-[13px] text-slate-300">{f}</span>
                </div>
              </Reveal>
            ))}
          </div>
          <Reveal delay={0.2}>
            <MagneticButton onClick={() => (window.location.hash = "/builder")} className="btn-glow mt-8 flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-semibold text-white">
              Open the Builder <ArrowRight className="h-4 w-4" />
            </MagneticButton>
          </Reveal>
        </div>

        <Reveal delay={0.1}>
          <div className="relative">
            <div className="absolute -inset-4 -z-10 rounded-3xl bg-gradient-to-tr from-brand-500/20 to-cyber-500/20 blur-2xl" />
            <GlassCard className="overflow-hidden p-4">
              <div className="mb-3 flex items-center gap-2 border-b border-white/5 pb-3">
                <Pill className="border-brand-400/30 bg-brand-500/10 text-brand-200"><Sparkles className="h-3 w-3" /> Editor</Pill>
                <Pill>Preview</Pill>
                <span className="ml-auto flex items-center gap-1 text-[10px] text-emerald-400"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Autosaved</span>
              </div>
              <div className="grid grid-cols-[1fr_1.05fr] gap-3">
                <div className="space-y-2 rounded-2xl bg-white/[0.03] p-3">
                  {["Senior Product Engineer", "Nebula Labs", "Led rebuild of onboarding", "Activation +38%"].map((t, i) => (
                    <div key={i} className={`shimmer-line rounded-lg ${i === 0 ? "h-7" : "h-4"} bg-white/[0.06]`}>
                      <span className="px-2 py-1 text-[10px] text-slate-300">{t}</span>
                    </div>
                  ))}
                  <div className="flex items-center gap-1 rounded-lg bg-brand-500/15 px-2 py-1.5 text-[10px] font-medium text-brand-200">
                    <Sparkles className="h-3 w-3" /> AI: add a metric
                  </div>
                </div>
                <ResumePreview data={DEFAULT_RESUME} template="creative" accent="#ec4899" font="Poppins" />
              </div>
            </GlassCard>
          </div>
        </Reveal>
      </div>

      {/* import / export strip */}
      <Reveal>
        <div className="mt-12 grid gap-4 sm:grid-cols-2">
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold text-white">Import from anywhere</h4>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {SECURE_IMPORTS.map((s) => <Pill key={s}>{s}</Pill>)}
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <h4 className="text-sm font-semibold text-white">Export everywhere</h4>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {EXPORTS.map((s) => <Pill key={s} className="border-cyber-400/20 bg-cyber-500/10 text-cyber-300">{s}</Pill>)}
            </div>
          </GlassCard>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── TEMPLATES ───────────────────────── */
function TemplatesShowcase() {
  const picks = TEMPLATES.filter((t) => ["aurora", "creative", "onyx", "minimal"].includes(t.id));
  const AVATAR =
    "data:image/svg+xml," +
    encodeURIComponent(`<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23a78bfa'/><stop offset='1' stop-color='%2322d3ee'/></linearGradient></defs><rect width='120' height='120' fill='url(%23g)'/><circle cx='60' cy='48' r='22' fill='rgba(255,255,255,0.92)'/><path d='M22 116c0-22 17-36 38-36s38 14 38 36z' fill='rgba(255,255,255,0.92)'/></svg>`);
  const sampleData = (t: (typeof picks)[number]) =>
    t.photo ? { ...DEFAULT_RESUME, basics: { ...DEFAULT_RESUME.basics, photo: AVATAR } } : DEFAULT_RESUME;
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <SectionHeading
        eyebrow="10,000+ templates"
        title={<>Designs that get <span className="text-gradient">past the bots</span> & wow humans.</>}
        subtitle="1,200+ templates — with or without a profile photo. Modern, executive, creative, ATS-safe, developer & designer — plus an AI generator that builds one from a prompt."
      />
      <div className="mt-14 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {picks.map((t, i) => (
          <Reveal key={t.id} delay={i * 0.08}>
            <Spotlight>
              <GlassCard hover className="group overflow-hidden">
                <div className="relative overflow-hidden rounded-t-3xl bg-white/[0.02] p-3">
                  <div className="transition duration-500 group-hover:scale-[1.03]">
                    <ResumePreview data={sampleData(t)} template={t.id} accent={t.accent} font="Inter" width={420} showPhoto={!!t.photo} />
                  </div>
                  <div className="absolute left-3 top-3 flex gap-1.5">
                    <span className="rounded-full bg-ink-950/80 px-2 py-0.5 text-[9px] font-medium text-white backdrop-blur">{t.category}</span>
                    {t.photo && <span className="rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold text-slate-700">📷</span>}
                  </div>
                </div>
                <div className="flex items-center justify-between px-4 py-3">
                  <span className="text-sm font-medium text-white">{t.name}</span>
                  <ArrowRight className="h-4 w-4 -translate-x-1 text-slate-500 opacity-0 transition group-hover:translate-x-0 group-hover:opacity-100" />
                </div>
              </GlassCard>
            </Spotlight>
          </Reveal>
        ))}
      </div>
      <Reveal className="mt-10 text-center">
        <Link to="/templates" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:border-brand-400/50">
          Browse all templates <ArrowRight className="h-4 w-4" />
        </Link>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── ATS VISUAL ───────────────────────── */
function ATSVisual() {
  const rows = [
    { label: "Keyword Match", v: 92, c: "#8b5cff" },
    { label: "Action Verbs", v: 88, c: "#22d3ee" },
    { label: "Quantified Impact", v: 76, c: "#f472b6" },
    { label: "ATS Formatting", v: 98, c: "#10b981" },
  ];
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <GlassCard className="overflow-hidden">
        <div className="grid items-center gap-10 p-8 md:grid-cols-[auto_1fr] md:p-12">
          <Reveal>
            <div className="flex flex-col items-center">
              <ScoreRing value={96} size={180} stroke={12} color="#22d3ee" sublabel="ATS Score" />
              <span className="mt-3 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">Grade A+ · Recruiter-ready</span>
            </div>
          </Reveal>
          <div>
            <SectionHeading
              center={false}
              eyebrow="Beat the bots"
              title={<>Know your <span className="text-gradient">ATS score</span> before you apply.</>}
              subtitle="93% of resumes are rejected before a human sees them. Our engine analyzes keyword density, impact, formatting, and readability — then shows the exact fixes."
            />
            <div className="mt-7 space-y-4">
              {rows.map((r, i) => (
                <Reveal key={r.label} delay={i * 0.08}>
                  <div>
                    <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-300">{r.label}</span><span className="font-semibold text-white">{r.v}%</span></div>
                    <div className="h-2 overflow-hidden rounded-full bg-white/10">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${r.v}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: 0.2 + i * 0.1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: r.c }} />
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>
    </section>
  );
}

/* ───────────────────────── HOW IT WORKS ───────────────────────── */
function HowItWorks() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <SectionHeading eyebrow="How it works" title={<>From blank page to <span className="text-gradient">signed offer</span> in 3 steps.</>} />
      <div className="mt-14 grid gap-6 md:grid-cols-3">
        {STEPS.map((s, i) => (
          <Reveal key={s.title} delay={i * 0.1}>
            <GlassCard hover className="relative h-full p-7">
              <span className="absolute right-6 top-5 font-display text-6xl font-bold text-white/5">0{i + 1}</span>
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyber-500 shadow-lg shadow-brand-500/30">
                <s.icon className="h-6 w-6 text-white" />
              </span>
              <h3 className="mt-5 text-lg font-semibold text-white">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-400">{s.desc}</p>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── SECURITY ───────────────────────── */
function SecuritySection() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <SectionHeading
          center={false}
          eyebrow="Enterprise-grade security"
          title={<>Your career data, <span className="text-gradient">protected like a vault.</span></>}
          subtitle="Bank-grade encryption, MFA, rate limiting, RBAC, and a zero-knowledge default. Your content is yours — always."
        />
        <div className="grid gap-4 sm:grid-cols-2">
          {SECURITY.map((s, i) => (
            <Reveal key={s.title} delay={i * 0.08}>
              <GlassCard hover className="h-full p-5">
                <s.icon className="h-6 w-6 text-brand-300" />
                <h3 className="mt-3 text-sm font-semibold text-white">{s.title}</h3>
                <p className="mt-1 text-[13px] leading-relaxed text-slate-400">{s.desc}</p>
              </GlassCard>
            </Reveal>
          ))}
        </div>
      </div>
      <Reveal>
        <div className="mt-8 flex flex-wrap items-center gap-2">
          {["RBAC", "JWT / Auth", "Argon2 hashing", "CSRF protection", "HTTP-only cookies", "TOTP & OTP", "Audit logs", "CSP / CORS", "DDoS shield", "Encrypted storage"].map((b) => (
            <span key={b} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> {b}
            </span>
          ))}
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── DEVELOPER CREDIT ───────────────────────── */
function DeveloperCredit() {
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-24 text-center">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2rem] border border-white/10 p-10 sm:p-14">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600/20 via-cyber-500/10 to-magenta-500/20" />
          <div className="absolute inset-0 -z-10 grid-bg opacity-30" />
          <motion.span
            initial={{ scale: 0, rotate: -20 }}
            whileInView={{ scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ type: "spring", stiffness: 200, damping: 14 }}
            className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-cyber-500 shadow-xl shadow-brand-500/40"
          >
            <span className="font-display text-3xl font-extrabold text-white">S</span>
          </motion.span>
          <p className="mt-6 text-xs font-semibold uppercase tracking-[0.3em] text-brand-200">Crafted with care by</p>
          <h2 className="mt-3 font-display text-4xl font-bold text-white sm:text-5xl">Santhosh</h2>
          <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate-300">
            Designer & developer of RESUMINT AI — an intelligent career operating system built to help millions land their next role, free for everyone.
          </p>
          <div className="mt-7 flex items-center justify-center gap-2">
            <MagneticButton onClick={() => (window.location.hash = "/builder")} className="btn-glow flex items-center gap-2 rounded-full px-6 py-3 text-sm font-semibold text-white">
              <Sparkles className="h-4 w-4" /> Start building — free
            </MagneticButton>
          </div>
        </div>
      </Reveal>
    </section>
  );
}

/* ───────────────────────── FAQ ───────────────────────── */
function FAQ() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <section className="relative z-10 mx-auto max-w-3xl px-6 py-24">
      <SectionHeading eyebrow="FAQ" title={<>Questions, <span className="text-gradient">answered.</span></>} />
      <div className="mt-12 space-y-3">
        {FAQS.map((f, i) => (
          <Reveal key={f.q} delay={i * 0.04}>
            <GlassCard className="overflow-hidden">
              <button onClick={() => setOpen(open === i ? null : i)} className="flex w-full items-center justify-between gap-4 p-5 text-left">
                <span className="text-[15px] font-medium text-white">{f.q}</span>
                <ChevronDown className={`h-5 w-5 shrink-0 text-slate-400 transition ${open === i ? "rotate-180" : ""}`} />
              </button>
              <motion.div initial={false} animate={{ height: open === i ? "auto" : 0, opacity: open === i ? 1 : 0 }} transition={{ duration: 0.3 }} className="overflow-hidden">
                <p className="px-5 pb-5 text-sm leading-relaxed text-slate-400">{f.a}</p>
              </motion.div>
            </GlassCard>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/* ───────────────────────── FINAL CTA ───────────────────────── */
function FinalCTA() {
  return (
    <section className="relative z-10 mx-auto max-w-7xl px-6 py-24">
      <Reveal>
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 p-12 text-center sm:p-20">
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-brand-600/30 via-cyber-500/20 to-magenta-500/30" />
          <div className="absolute inset-0 -z-10 grid-bg opacity-40" />
          <Zap className="mx-auto h-10 w-10 text-amber-300" />
          <h2 className="mt-5 font-display text-4xl font-bold leading-tight text-white sm:text-5xl">
            Your next role is closer<br /> than you think.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-lg text-slate-300">
            Join 2.4M+ professionals building smarter careers. Every feature, every template — completely free.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <MagneticButton onClick={() => (window.location.hash = "/builder")} className="btn-glow flex items-center gap-2 rounded-full px-8 py-4 text-base font-semibold text-white">
              Start building — it's free <ArrowRight className="h-4 w-4" />
            </MagneticButton>
            <Link to="/dashboard" className="rounded-full border border-white/20 bg-white/10 px-7 py-4 text-base font-medium text-white backdrop-blur transition hover:bg-white/15">
              View dashboard
            </Link>
          </div>
        </div>
      </Reveal>
    </section>
  );
}
