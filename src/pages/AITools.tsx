import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Gauge, Wand2, Mail, Star, DollarSign, Sparkles, Loader2, Copy, Check,
  ScanLine, RefreshCw,
} from "lucide-react";
import AIConnection from "../components/AIConnection";
import { analyzeResume, estimateSalary, resumeToText } from "../lib/ai";
import { improveBullet, generateCoverLetter, starAnswer, atsAdvice } from "../lib/aiService";
import { hasAI } from "../lib/openrouter";
import { DEFAULT_RESUME } from "../lib/store";
import { AI_FEATURES } from "../data/content";
import { Reveal, SectionHeading, GlassCard, Spotlight } from "../components/ui";
import { useToast } from "../components/Toast";
import ScoreRing from "../components/ScoreRing";

const TOOLS = [
  { id: "ats", label: "ATS Analyzer", icon: Gauge },
  { id: "bullet", label: "Bullet Improver", icon: Wand2 },
  { id: "cover", label: "Cover Letter", icon: Mail },
  { id: "star", label: "STAR Answers", icon: Star },
  { id: "salary", label: "Salary Estimator", icon: DollarSign },
];

const SAMPLE_JD = `Senior Frontend Engineer
We seek a Senior Frontend Engineer to build delightful React applications with TypeScript.
You will own features end-to-end, optimize performance, and collaborate cross-functionally.
Required: React, TypeScript, GraphQL, accessibility, CI/CD, testing, system design.
Nice to have: Next.js, design systems, Web Performance.`;

export default function AITools() {
  const [active, setActive] = useState("ats");
  const { toast } = useToast();
  const [aiPanel, setAiPanel] = useState(false);
  const connected = hasAI();
  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32">
      <SectionHeading
        eyebrow="AI Workspace"
        title={<>Powerful tools. <span className="text-gradient">Zero friction.</span></>}
        subtitle="Live AI engines for resumes, interviews, cover letters, and salary — powered by your OpenRouter connection, with a built-in fallback engine."
      />

      {/* AI connection banner */}
      <Reveal>
        <div className="mx-auto mt-8 flex max-w-3xl flex-col items-center justify-between gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-3.5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className={`grid h-9 w-9 place-items-center rounded-xl ${connected ? "bg-emerald-500/15" : "bg-amber-500/15"}`}>
              <Sparkles className={`h-4.5 w-4.5 ${connected ? "text-emerald-400" : "text-amber-400"}`} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{connected ? "AI is live" : "Using built-in engine"}</p>
              <p className="text-xs text-slate-400">
                {connected ? "Every tool calls OpenRouter now." : "Connect your OpenRouter key for real AI on every tool."}
              </p>
            </div>
          </div>
          <button onClick={() => setAiPanel(true)} className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-medium text-white transition hover:bg-white/10">
            <Sparkles className="h-3.5 w-3.5" /> {connected ? "Manage AI" : "Connect AI"}
          </button>
        </div>
      </Reveal>
      <AnimatePresence>{aiPanel && <AIConnection onClose={() => setAiPanel(false)} />}</AnimatePresence>

      {/* tool tabs */}
      <Reveal>
        <div className="mt-10 flex flex-wrap justify-center gap-2">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={[
                "flex items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-medium transition",
                active === t.id
                  ? "border-brand-400/50 bg-brand-500/15 text-white"
                  : "border-white/10 bg-white/5 text-slate-400 hover:text-white",
              ].join(" ")}
            >
              <t.icon className="h-4 w-4" /> {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-10">
        {active === "ats" && <ATSAnalyzer />}
        {active === "bullet" && <BulletImprover />}
        {active === "cover" && <CoverLetter />}
        {active === "star" && <STARTool />}
        {active === "salary" && <SalaryTool />}
      </div>

      {/* full catalog */}
      <div className="mt-24">
        <SectionHeading eyebrow="Full catalog" title={<>The complete <span className="text-gradient">31-tool suite.</span></>} subtitle="Click any tool to launch it. Some run live here; the rest open the builder or relevant workflow." />
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {AI_FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={(i % 4) * 0.05}>
              <Spotlight>
                <GlassCard hover className="group h-full p-5">
                  <button onClick={() => launchTool(f.title)} className="block w-full text-left">
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500/20 to-cyber-500/20 ring-1 ring-white/10 transition group-hover:from-brand-500/40 group-hover:to-cyber-500/40">
                      <f.icon className="h-5 w-5 text-brand-200" />
                    </span>
                    <h3 className="mt-3 text-sm font-semibold text-white">{f.title}</h3>
                    <p className="mt-1 text-[12.5px] leading-relaxed text-slate-400">{f.desc}</p>
                  </button>
                </GlassCard>
              </Spotlight>
            </Reveal>
          ))}
        </div>
      </div>
    </div>
  );

  function launchTool(title: string) {
    const t = title.toLowerCase();
    let tool: string | null = null;
    if (/ats|score|keyword|match|optimizer|tailor|analyz|improv/.test(t)) tool = "ats";
    else if (/rewrite|writer|achievement|grammar|branding/.test(t)) tool = "bullet";
    else if (/cover|email/.test(t)) tool = "cover";
    else if (/star|interview|mock|speech|recruiter/.test(t)) tool = "star";
    else if (/salary|pay/.test(t)) tool = "salary";
    if (tool) {
      setActive(tool);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      toast(`${title}`, "success", "Opens in the Resume Builder.");
      window.location.hash = "/builder";
    }
  }
}

function useCopy() {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard?.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return { copied, copy };
}

function Thinking({ show }: { show: boolean }) {
  if (!show) return null;
  return (
    <div className="flex items-center gap-2 text-sm text-brand-200">
      <Loader2 className="h-4 w-4 animate-spin" /> AI is thinking…
    </div>
  );
}

/* ───────────── ATS Analyzer ───────────── */
function ATSAnalyzer() {
  const [resume, setResume] = useState(() => resumeToText(DEFAULT_RESUME));
  const [jd, setJd] = useState(SAMPLE_JD);
  const [report, setReport] = useState<ReturnType<typeof analyzeResume> | null>(null);
  const [loading, setLoading] = useState(false);
  const [advice, setAdvice] = useState("");
  const [adviceLoading, setAdviceLoading] = useState(false);

  const run = () => {
    setLoading(true);
    setReport(null);
    setAdvice("");
    setTimeout(() => {
      setReport(analyzeResume(resume, jd));
      setLoading(false);
    }, 700);
  };

  const getAdvice = async () => {
    if (!report) return;
    setAdviceLoading(true);
    setAdvice("");
    const role = jd.split("\n")[0] || "";
    const out = await atsAdvice(report, role);
    setAdvice(out);
    setAdviceLoading(false);
  };

  return (
    <GlassCard className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Your resume text</label>
          <textarea value={resume} onChange={(e) => setResume(e.target.value)} rows={7}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-[13px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-300">Target job description</label>
          <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={5}
            className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-[13px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
        </div>
        <button onClick={run} disabled={loading}
          className="btn-glow flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ScanLine className="h-4 w-4" />} Run ATS Scan
        </button>
      </div>

      <div className="rounded-2xl bg-white/[0.02] p-5">
        {!report && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Gauge className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm">Run a scan to see your live ATS score, keyword gaps, and tailored suggestions.</p>
          </div>
        )}
        {loading && <Thinking show />}
        {report && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            <div className="flex items-center gap-4">
              <ScoreRing value={report.score} size={108} color="#22d3ee" sublabel="ATS" />
              <div>
                <p className="font-display text-2xl font-bold text-white">Grade {report.grade}</p>
                <p className="text-sm text-slate-400">{report.verdict}</p>
                <p className="mt-1 text-xs text-slate-500">{report.wordCount} words analyzed</p>
              </div>
            </div>
            <div className="space-y-2">
              {report.checks.map((c) => (
                <div key={c.label}>
                  <div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{c.label}</span><span className="text-slate-400">{c.score}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-cyber-400" style={{ width: `${c.score}%` }} />
                  </div>
                  <p className="mt-0.5 text-[10px] text-slate-500">{c.note}</p>
                </div>
              ))}
            </div>
            {report.missing.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-magenta-300">Missing keywords</p>
                <div className="flex flex-wrap gap-1.5">
                  {report.missing.map((k) => <span key={k} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300 ring-1 ring-red-500/20">{k}</span>)}
                </div>
              </div>
            )}
            <div className="rounded-xl bg-brand-500/10 p-3">
              <p className="mb-1 text-xs font-semibold text-brand-200">Top suggestion</p>
              <p className="text-[12.5px] text-slate-300">{report.suggestions[0]}</p>
            </div>

            <button onClick={getAdvice} disabled={adviceLoading}
              className="flex items-center gap-1.5 rounded-xl border border-brand-400/40 bg-brand-500/15 px-4 py-2.5 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-60">
              {adviceLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {adviceLoading ? "AI is analyzing…" : "Get AI optimization plan"}
            </button>
            {(advice || adviceLoading) && (
              <div className="rounded-xl border border-brand-400/20 bg-gradient-to-br from-brand-500/10 to-cyber-500/5 p-3">
                <p className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-brand-200"><Sparkles className="h-3.5 w-3.5" /> {hasAI() ? "AI recommendations" : "Recommendations"}</p>
                <pre className="whitespace-pre-wrap break-words font-sans text-[12.5px] leading-relaxed text-slate-200">{advice || "Analyzing your scan…"}</pre>
              </div>
            )}
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}

/* ───────────── Bullet Improver ───────────── */
function BulletImprover() {
  const samples = [
    "responsible for managing the frontend team",
    "worked on making the website faster",
    "helped with the new feature launch",
  ];
  const [out, setOut] = useState<{ i: number; text: string }[]>([]);
  const [loading, setLoading] = useState<number | null>(null);

  const improve = async (text: string, i: number) => {
    setLoading(i);
    setOut((o) => o.filter((x) => x.i !== i));
    const improved = await improveBullet(text, "Senior Engineer");
    setOut((o) => [...o.filter((x) => x.i !== i), { i, text: improved }]);
    setLoading(null);
  };

  return (
    <GlassCard className="p-6">
      <p className="text-sm text-slate-400">Paste a weak bullet or improve a sample. AI injects power verbs and quantified impact.</p>
      <div className="mt-5 space-y-3">
        {samples.map((s, i) => {
          const result = out.find((o) => o.i === i);
          return (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
              <p className="text-[13px] text-slate-400 line-through decoration-slate-600">{s}</p>
              {loading === i && <Thinking show />}
              {result && (
                <motion.p initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="mt-2 flex items-start gap-2 text-[14px] font-medium text-white">
                  <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-brand-300" /> {result.text}
                </motion.p>
              )}
              <button onClick={() => improve(s, i)} disabled={loading !== null}
                className="mt-3 flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-3 py-1.5 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-50">
                <Wand2 className="h-3.5 w-3.5" /> AI Improve {result ? "again" : ""}
              </button>
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}

/* ───────────── Cover Letter ───────────── */
function CoverLetter() {
  const { copied, copy } = useCopy();
  const [role, setRole] = useState("Senior Frontend Engineer");
  const [company, setCompany] = useState("Vercel");
  const [name, setName] = useState(DEFAULT_RESUME.basics.name);
  const [letter, setLetter] = useState("");
  const [loading, setLoading] = useState(false);

  const gen = async () => {
    setLoading(true);
    setLetter("");
    const text = await generateCoverLetter(role, company, name, DEFAULT_RESUME.skills.map((s) => s.name));
    setLetter(text);
    setLoading(false);
  };

  return (
    <GlassCard className="grid gap-6 p-6 lg:grid-cols-[0.8fr_1.2fr]">
      <div className="space-y-3">
        {[
          { l: "Role", v: role, set: setRole },
          { l: "Company", v: company, set: setCompany },
          { l: "Your name", v: name, set: setName },
        ].map((f) => (
          <div key={f.l}>
            <label className="mb-1 block text-xs font-medium text-slate-400">{f.l}</label>
            <input value={f.v} onChange={(e) => f.set(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-brand-400/60 focus:outline-none" />
          </div>
        ))}
        <button onClick={gen} disabled={loading}
          className="btn-glow flex w-full items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />} Generate Cover Letter
        </button>
      </div>
      <div className="relative rounded-2xl bg-white/[0.02] p-5">
        {loading && <Thinking show />}
        {!letter && !loading && (
          <div className="flex h-full flex-col items-center justify-center text-center text-slate-500">
            <Mail className="h-10 w-10 text-slate-600" />
            <p className="mt-3 text-sm">Your tailored, recruiter-ready letter will appear here.</p>
          </div>
        )}
        {letter && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button onClick={() => copy(letter)} className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            <pre className="whitespace-pre-wrap font-sans text-[13.5px] leading-relaxed text-slate-200">{letter}</pre>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}

/* ───────────── STAR ───────────── */
function STARTool() {
  const { copied, copy } = useCopy();
  const [q, setQ] = useState("Tell me about a time you led a project under pressure.");
  const [ans, setAns] = useState("");
  const [loading, setLoading] = useState(false);
  const gen = async () => {
    setLoading(true); setAns("");
    setAns(await starAnswer(q));
    setLoading(false);
  };
  return (
    <GlassCard className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-3">
        <label className="block text-xs font-medium text-slate-400">Interview question</label>
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-white focus:border-brand-400/60 focus:outline-none" />
        <button onClick={gen} disabled={loading}
          className="btn-glow flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Star className="h-4 w-4" />} Generate STAR Answer
        </button>
        <p className="text-xs text-slate-500">Structured for Situation · Task · Action · Result — proven to score highest in behavioral rounds.</p>
      </div>
      <div className="relative rounded-2xl bg-white/[0.02] p-5">
        {loading && <Thinking show />}
        {!ans && !loading && <div className="flex h-full items-center justify-center text-slate-500"><Star className="h-10 w-10 text-slate-600" /></div>}
        {ans && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <button onClick={() => copy(ans)} className="absolute right-4 top-4 flex items-center gap-1 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white">
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />} {copied ? "Copied" : "Copy"}
            </button>
            <pre className="whitespace-pre-wrap font-sans text-[13px] leading-relaxed text-slate-200">{ans}</pre>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}

/* ───────────── Salary Estimator ───────────── */
function SalaryTool() {
  const [role, setRole] = useState("Senior Frontend Engineer");
  const [loc, setLoc] = useState("San Francisco, CA");
  const [res, setRes] = useState<ReturnType<typeof estimateSalary> | null>(null);
  const [loading, setLoading] = useState(false);
  const est = () => {
    setLoading(true); setRes(null);
    setTimeout(() => { setRes(estimateSalary(role, loc)); setLoading(false); }, 600);
  };
  const fmt = (n: number) => `${res?.currency}${(n / 1000).toFixed(0)}k`;
  return (
    <GlassCard className="grid gap-6 p-6 lg:grid-cols-2">
      <div className="space-y-3">
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Role / title</label>
          <input value={role} onChange={(e) => setRole(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-brand-400/60 focus:outline-none" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium text-slate-400">Location</label>
          <input value={loc} onChange={(e) => setLoc(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-brand-400/60 focus:outline-none" />
        </div>
        <button onClick={est} disabled={loading}
          className="btn-glow flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />} Estimate Salary
        </button>
      </div>
      <div className="rounded-2xl bg-white/[0.02] p-6">
        {loading && <Thinking show />}
        {!res && !loading && <div className="flex h-full items-center justify-center text-slate-500"><DollarSign className="h-10 w-10 text-slate-600" /></div>}
        {res && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-xs uppercase tracking-wide text-slate-500">Estimated total compensation</p>
            <p className="mt-1 font-display text-4xl font-bold text-gradient">{fmt(res.mid)}<span className="text-base text-slate-500">/yr</span></p>
            <div className="mt-5">
              <div className="relative h-3 overflow-hidden rounded-full bg-gradient-to-r from-emerald-500/40 via-amber-500/40 to-red-500/40">
                <div className="absolute left-1/2 top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-brand-500 shadow-lg" />
              </div>
              <div className="mt-2 flex justify-between text-xs text-slate-400">
                <span>Low {fmt(res.low)}</span><span className="font-semibold text-white">Mid {fmt(res.mid)}</span><span>High {fmt(res.high)}</span>
              </div>
            </div>
            <p className="mt-5 rounded-xl bg-brand-500/10 p-3 text-[12.5px] text-slate-300">
              💡 Aim for the mid-to-high band. Anchor on impact metrics from your resume and comparable offers to negotiate confidently.
            </p>
          </motion.div>
        )}
      </div>
    </GlassCard>
  );
}


