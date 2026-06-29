import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, Undo2, Redo2, RotateCcw, Sparkles, Plus, Trash2, ChevronUp, ChevronDown,
  Gauge, Check, X, Wand2, Save, Palette, Upload, FileText, FileType, FileJson,
  FileDown, Image as ImageIcon, Printer, Share2, QrCode, Lock, Link2, Loader2,
  Download, FileCode, ClipboardPaste, CheckCircle2, MousePointerClick,
  Import as ImportIcon, ArrowUpFromLine as ExportIcon,
} from "lucide-react";
import { Link } from "../lib/router";
import { useStore, DEFAULT_RESUME as DEFAULT } from "../lib/store";
import { analyzeResume, resumeToText } from "../lib/ai";
import { improveBullet, generateSummary } from "../lib/aiService";
import { hasAI } from "../lib/openrouter";
import { TEMPLATES, getTemplateMeta } from "../data/content";
import {
  exportPDF, exportDOCX, exportPNG, exportJPEG, exportHTML, exportMarkdown,
  exportTXT, exportJSON, printResume, copyShareLink,
} from "../lib/exporters";
import { extractText, parseResume, type ImportResult } from "../lib/importer";
import { useToast } from "../components/Toast";
import ResumePreview from "../components/ResumePreview";
import ScoreRing from "../components/ScoreRing";

const FONTS = ["Inter", "Sora", "Poppins", "Georgia", "Merriweather", "JetBrains Mono"];
const ACCENTS = ["#7c3aed", "#06b6d4", "#ec4899", "#10b981", "#f59e0b", "#ef4444", "#2563eb", "#0f172a"];

const SAMPLE_RESUME_TEXT = `Jordan Avery
Senior Product Engineer
San Francisco, CA | jordan.avery@email.com | +1 (415) 555-0173 | linkedin.com/in/jordanavery | github.com/jordanavery

SUMMARY
Senior Product Engineer with 8 years building delightful, high-scale consumer products.

EXPERIENCE
Senior Product Engineer | Nebula Labs
Jan 2021 - Present
• Led the rebuild of the onboarding flow, increasing activation by 38%.
• Architected a real-time collaboration engine handling 50k concurrent users.
• Mentored 5 engineers and established the design system used company-wide.

Full-Stack Engineer — Lumen Commerce
2018 - 2021
• Shipped a payments platform processing $12M ARR with 99.98% uptime.
• Reduced API p95 latency by 52% through caching and query optimization.

EDUCATION
B.S. Computer Science, UC Berkeley
2014 - 2018

SKILLS
TypeScript, React, Node.js, GraphQL, AWS, System Design, PostgreSQL`;

export default function ResumeBuilder() {
  const s = useStore();
  const { toast } = useToast();
  const [showATS, setShowATS] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const previewRef = useRef<HTMLDivElement>(null);

  const getPaper = (): HTMLElement | null => previewRef.current?.querySelector(".resume-paper") as HTMLElement | null;

  const meta = getTemplateMeta(s.template);
  const showPhoto = !!meta?.photo; // "Without Photo" templates hide the photo

  // Inline edit on the preview: deep-set a path in the resume data.
  const onEdit = (path: (string | number)[], value: string) => {
    s.update((d) => {
      const next = JSON.parse(JSON.stringify(d)) as typeof d;
      let cur: Record<string, unknown> = next as unknown as Record<string, unknown>;
      for (let i = 0; i < path.length - 1; i++) cur = cur[path[i] as string] as Record<string, unknown>;
      cur[path[path.length - 1] as string] = value;
      return next;
    });
  };

  const handleImported = (res: ImportResult) => {
    if (!res.ok) {
      toast("Import failed", "error", res.warning);
      return false;
    }
    if (res.data) {
      s.replace(res.data);
      toast("Resume imported", "success", "Structured into editable sections — ready to redesign.");
      return true;
    }
    if (res.raw) {
      const parsed = parseResume(res.raw);
      s.replace(parsed);
      const bits = [
        parsed.basics.name && parsed.basics.name !== DEFAULT.basics.name ? parsed.basics.name.split(" ")[0] : "",
        parsed.experience.length ? `${parsed.experience.length} jobs` : "",
        parsed.education.length ? `${parsed.education.length} edu` : "",
        parsed.skills.length ? `${parsed.skills.length} skills` : "",
      ].filter(Boolean);
      toast(
        "Resume imported",
        "success",
        bits.length ? `Detected: ${bits.join(" · ")}` : "Loaded — review the editor."
      );
      return true;
    }
    return false;
  };

  const doExport = async (fn: () => void | Promise<void>, label: string) => {
    try {
      await fn();
      toast(`${label} ready`, "success", "Check your downloads.");
    } catch (e) {
      if ((e as Error)?.message === "PRINT_FALLBACK") {
        toast(`${label} via Print`, "info", "Use “Save as PDF” in the print dialog.");
      } else {
        toast("Export failed", "error", "Please try again.");
      }
    }
  };

  const onShare = async () => {
    const link = await copyShareLink(s.data.basics.name);
    setShareLink(link);
    toast("Share link copied", "success", link);
    setExportOpen(false);
  };

  const onProtect = () => {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const link = `https://resumint.ai/p/${btoa(s.data.basics.name || "resume").slice(0, 8).toLowerCase()}?pin=${pin}`;
    setShareLink(link);
    setExportOpen(false);
    toast("Protected link created", "info", `Access PIN: ${pin}`);
  };

  return (
    <div className="relative z-10 min-h-screen">
      {/* top toolbar */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-ink-950/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-300 transition hover:text-white">
            <ArrowLeft className="h-4 w-4" /> <span className="hidden sm:inline">Home</span>
          </Link>
          <div className="h-5 w-px bg-white/10" />
          <span className="font-display text-sm font-semibold text-white">Resume Builder</span>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-[11px] text-emerald-300">
            <Save className="h-3 w-3" /> Autosaved
          </span>

          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ToolBtn onClick={s.undo} disabled={!s.canUndo} title="Undo"><Undo2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={s.redo} disabled={!s.canRedo} title="Redo"><Redo2 className="h-4 w-4" /></ToolBtn>
            <ToolBtn onClick={s.reset} title="Reset to sample"><RotateCcw className="h-4 w-4" /></ToolBtn>
            <div className="h-5 w-px bg-white/10" />

            <button onClick={() => setImportOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
              <ImportIcon className="h-4 w-4" /> <span className="hidden sm:inline">Import</span>
            </button>

            <select
              value={TEMPLATES.some((t) => t.id === s.template) ? s.template : "__current__"}
              onChange={(e) => { if (e.target.value !== "__current__") s.setTemplate(e.target.value); }}
              title="Template"
              className="max-w-[140px] truncate rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white focus:outline-none"
            >
              {meta && !TEMPLATES.some((t) => t.id === meta.id) && (
                <option value="__current__" className="bg-ink-900">{meta.name}</option>
              )}
              {TEMPLATES.map((t) => <option key={t.id} value={t.id} className="bg-ink-900">{t.name}</option>)}
            </select>
            <button onClick={() => (window.location.hash = "/templates")} title="Browse all templates"
              className="hidden items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs font-medium text-white transition hover:bg-white/10 sm:flex">
              <Palette className="h-3.5 w-3.5" /> Browse
            </button>
            <select value={s.font} onChange={(e) => s.setFont(e.target.value)} title="Font"
              className="rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-xs text-white focus:outline-none">
              {FONTS.map((f) => <option key={f} value={f} className="bg-ink-900">{f}</option>)}
            </select>
            <div className="hidden items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2 py-1.5 md:flex">
              {ACCENTS.map((c) => (
                <button key={c} onClick={() => s.setAccent(c)} title={c}
                  className={`h-5 w-5 rounded-full ring-2 ring-offset-1 ring-offset-ink-950 transition ${s.accent === c ? "ring-white" : "ring-transparent"}`}
                  style={{ background: c }} />
              ))}
            </div>

            <button onClick={() => setExportOpen(true)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-white transition hover:bg-white/10">
              <ExportIcon className="h-4 w-4" /> Export
            </button>
            <button onClick={() => setShowATS(true)} className="btn-glow flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold text-white">
              <Gauge className="h-4 w-4" /> ATS Scan
            </button>
          </div>
        </div>
      </header>

      {/* workspace */}
      <main className="mx-auto grid max-w-[1600px] gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] lg:p-6">
        <div className="space-y-4 lg:max-h-[calc(100vh-128px)] lg:overflow-y-auto lg:pr-2 no-scrollbar">
          <Editor />
        </div>
        <div className="lg:sticky lg:top-[88px] lg:h-[calc(100vh-128px)]">
          <div className="flex h-full flex-col rounded-3xl border border-white/10 bg-white/[0.02] p-3">
            <div className="mb-2 flex items-center justify-between gap-2 px-2">
              <span className="flex items-center gap-1.5 text-xs text-slate-400"><Palette className="h-3.5 w-3.5" /> {meta?.name ?? "Live Preview"}</span>
              <span className="flex items-center gap-1.5 rounded-full bg-brand-500/15 px-2 py-0.5 text-[10px] font-medium text-brand-200">
                <MousePointerClick className="h-3 w-3" /> Click any text to edit
              </span>
            </div>
            <div id="resume-print" ref={previewRef} className="flex-1 overflow-auto rounded-2xl bg-ink-900/40 p-2">
              <ResumePreview data={s.data} template={s.template} accent={s.accent} font={s.font} showPhoto={showPhoto} editable onEdit={onEdit} />
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>{showATS && <ATSPanel onClose={() => setShowATS(false)} />}</AnimatePresence>
      <AnimatePresence>{exportOpen && <ExportModal onClose={() => setExportOpen(false)} getPaper={getPaper} onExport={doExport} onShare={onShare} onProtect={onProtect} onQR={() => { setExportOpen(false); setQrOpen(true); }} />}</AnimatePresence>
      <AnimatePresence>{importOpen && <ImportModal onClose={() => setImportOpen(false)} onImported={handleImported} />}</AnimatePresence>
      <AnimatePresence>{qrOpen && <QRModal link={shareLink} onClose={() => setQrOpen(false)} />}</AnimatePresence>
    </div>
  );
}

function ToolBtn({ children, onClick, disabled, title }: { children: React.ReactNode; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button onClick={onClick} disabled={disabled} title={title}
      className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-300 transition hover:text-white disabled:cursor-not-allowed disabled:opacity-30">
      {children}
    </button>
  );
}

/* ───────────── Editor ───────────── */
function Editor() {
  const s = useStore();
  const { toast } = useToast();
  const [sumBusy, setSumBusy] = useState<"" | "gen" | "imp">("");
  const setBasic = (k: keyof typeof s.data.basics, v: string) =>
    s.update((d) => ({ ...d, basics: { ...d.basics, [k]: v } }));

  const genSummary = async () => {
    setSumBusy("gen");
    const years = (() => {
      const first = s.data.experience[s.data.experience.length - 1]?.start;
      const n = first ? parseInt(first, 10) : 0;
      return n > 1990 && n < new Date().getFullYear() ? new Date().getFullYear() - n : 5;
    })();
    const out = await generateSummary(s.data.basics.title, years, s.data.skills.map((x) => x.name));
    setBasic("summary", out);
    setSumBusy("");
    toast("Summary generated", "success", hasAI() ? "Written by AI" : "Built locally");
  };
  const improveSummary = async () => {
    setSumBusy("imp");
    const out = await improveBullet(s.data.basics.summary, s.data.basics.title);
    setBasic("summary", out);
    setSumBusy("");
    toast("Summary improved", "success", hasAI() ? "Rewritten by AI" : "Built locally");
  };

  return (
    <>
      <Card title="Personal Info" defaultOpen>
        {/* Profile photo */}
        <div className="mb-3 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-white/5 ring-1 ring-white/10">
            {s.data.basics.photo ? (
              <img src={s.data.basics.photo} alt="Profile" className="h-full w-full object-cover" />
            ) : (
              <span className="grid h-full w-full place-items-center text-slate-500"><ImageIcon className="h-5 w-5" /></span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-medium text-white">Profile photo</p>
            <p className="text-[11px] text-slate-500">
              {s.data.basics.photo ? "Added — shows on photo templates" : "Optional — appears on photo-enabled templates"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label className="cursor-pointer rounded-lg bg-white/5 px-2.5 py-1.5 text-[11px] font-medium text-white transition hover:bg-white/10">
              {s.data.basics.photo ? "Change" : "Upload"}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                if (!f.type.startsWith("image/")) { toast("Choose an image", "error"); return; }
                if (f.size > 4_000_000) { toast("Image too large (max 4MB)", "error"); return; }
                const r = new FileReader();
                r.onload = () => { setBasic("photo", String(r.result)); toast("Photo added", "success"); };
                r.readAsDataURL(f);
              }} />
            </label>
            {s.data.basics.photo && (
              <button onClick={() => { setBasic("photo", ""); toast("Photo removed", "info"); }} className="grid h-7 w-7 place-items-center rounded-lg text-red-400/70 hover:bg-red-500/10 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Full name" value={s.data.basics.name} onChange={(v) => setBasic("name", v)} className="col-span-2" />
          <Field label="Title" value={s.data.basics.title} onChange={(v) => setBasic("title", v)} className="col-span-2" />
          <Field label="Email" value={s.data.basics.email} onChange={(v) => setBasic("email", v)} />
          <Field label="Phone" value={s.data.basics.phone} onChange={(v) => setBasic("phone", v)} />
          <Field label="Location" value={s.data.basics.location} onChange={(v) => setBasic("location", v)} />
          <Field label="Website" value={s.data.basics.website} onChange={(v) => setBasic("website", v)} />
          <Field label="LinkedIn" value={s.data.basics.linkedin} onChange={(v) => setBasic("linkedin", v)} />
          <Field label="GitHub" value={s.data.basics.github} onChange={(v) => setBasic("github", v)} />
        </div>
      </Card>

      <Card title="Professional Summary" actions={
        <AIButton label="Generate" icon={Sparkles} loading={sumBusy === "gen"} onClick={genSummary} />
      }>
        <textarea value={s.data.basics.summary} onChange={(e) => setBasic("summary", e.target.value)} rows={4}
          className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-[13px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
        <div className="mt-2 flex gap-2">
          <AIButton label="AI Improve" icon={Wand2} loading={sumBusy === "imp"} onClick={improveSummary} />
        </div>
      </Card>

      <ExperienceEditor />
      <EducationEditor />
      <SkillsEditor />
      <ProjectsEditor />
    </>
  );
}

function ExperienceEditor() {
  const s = useStore();
  const { toast } = useToast();
  const [busy, setBusy] = useState<string | null>(null);
  const setExp = (i: number, patch: Partial<typeof s.data.experience[number]>) =>
    s.update((d) => { const e = [...d.experience]; e[i] = { ...e[i], ...patch }; return { ...d, experience: e }; });
  const move = (i: number, dir: -1 | 1) =>
    s.update((d) => { const e = [...d.experience]; const j = i + dir; if (j < 0 || j >= e.length) return d; [e[i], e[j]] = [e[j], e[i]]; return { ...d, experience: e }; });
  const add = () => s.update((d) => ({ ...d, experience: [...d.experience, { role: "New Role", company: "Company", start: "2023", end: "Present", bullets: ["Describe an achievement with a metric."] }] }));
  const del = (i: number) => s.update((d) => ({ ...d, experience: d.experience.filter((_, k) => k !== i) }));

  const improveOne = async (i: number, k: number, role: string, bullets: string[]) => {
    const id = `${i}-${k}`;
    setBusy(id);
    const improved = await improveBullet(bullets[k], role);
    setExp(i, { bullets: bullets.map((x, m) => (m === k ? improved : x)) });
    setBusy(null);
    toast("Bullet improved", "success", hasAI() ? "Rewritten by AI" : "Built locally");
  };

  return (
    <Card title="Experience" defaultOpen actions={
      <button onClick={add} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
        <Plus className="h-3.5 w-3.5" /> Add
      </button>
    }>
      <div className="space-y-3">
        {s.data.experience.map((exp, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex items-center gap-1">
              <span className="mr-auto text-xs font-semibold text-slate-400">{exp.role || "Untitled"}</span>
              <button onClick={() => move(i, -1)} disabled={i === 0} className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronUp className="h-3.5 w-3.5" /></button>
              <button onClick={() => move(i, 1)} disabled={i === s.data.experience.length - 1} className="rounded p-1 text-slate-400 hover:text-white disabled:opacity-30"><ChevronDown className="h-3.5 w-3.5" /></button>
              <button onClick={() => del(i)} className="rounded p-1 text-red-400/70 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Role" value={exp.role} onChange={(v) => setExp(i, { role: v })} />
              <Field label="Company" value={exp.company} onChange={(v) => setExp(i, { company: v })} />
              <Field label="Start" value={exp.start} onChange={(v) => setExp(i, { start: v })} />
              <Field label="End" value={exp.end} onChange={(v) => setExp(i, { end: v })} />
            </div>
            <div className="mt-2 space-y-1.5">
              {exp.bullets.map((b, k) => (
                <div key={k} className="flex items-start gap-1.5">
                  <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-brand-400" />
                  <textarea value={b} onChange={(e) => { const bullets = [...exp.bullets]; bullets[k] = e.target.value; setExp(i, { bullets }); }} rows={1}
                    className="min-h-[34px] flex-1 resize-none rounded-lg border border-white/10 bg-white/5 p-2 text-[12px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
                  <button onClick={() => improveOne(i, k, exp.role, exp.bullets)} disabled={busy === `${i}-${k}`} title="AI improve" className="mt-1 rounded p-1.5 text-brand-300 hover:bg-brand-500/15 disabled:opacity-50">
                    {busy === `${i}-${k}` ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                  </button>
                  <button onClick={() => setExp(i, { bullets: exp.bullets.filter((_, m) => m !== k) })} className="mt-1 rounded p-1.5 text-red-400/60 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              ))}
              <button onClick={() => setExp(i, { bullets: [...exp.bullets, "New achievement…"] })} className="flex items-center gap-1 text-[11px] text-brand-300 hover:text-brand-200"><Plus className="h-3 w-3" /> Add bullet</button>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function EducationEditor() {
  const s = useStore();
  const setEdu = (i: number, patch: Partial<typeof s.data.education[number]>) =>
    s.update((d) => { const e = [...d.education]; e[i] = { ...e[i], ...patch }; return { ...d, education: e }; });
  const add = () => s.update((d) => ({ ...d, education: [...d.education, { degree: "Degree", school: "School", start: "2018", end: "2022" }] }));
  const del = (i: number) => s.update((d) => ({ ...d, education: d.education.filter((_, k) => k !== i) }));
  return (
    <Card title="Education" actions={<button onClick={add} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Add</button>}>
      <div className="space-y-3">
        {s.data.education.map((ed, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex justify-between"><span className="text-xs text-slate-400">{ed.school}</span><button onClick={() => del(i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Degree" value={ed.degree} onChange={(v) => setEdu(i, { degree: v })} />
              <Field label="School" value={ed.school} onChange={(v) => setEdu(i, { school: v })} />
              <Field label="Start" value={ed.start} onChange={(v) => setEdu(i, { start: v })} />
              <Field label="End" value={ed.end} onChange={(v) => setEdu(i, { end: v })} />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

function SkillsEditor() {
  const s = useStore();
  const setSkill = (i: number, patch: Partial<typeof s.data.skills[number]>) =>
    s.update((d) => { const sk = [...d.skills]; sk[i] = { ...sk[i], ...patch }; return { ...d, skills: sk }; });
  const add = () => s.update((d) => ({ ...d, skills: [...d.skills, { name: "New Skill", level: 80 }] }));
  const del = (i: number) => s.update((d) => ({ ...d, skills: d.skills.filter((_, k) => k !== i) }));
  return (
    <Card title="Skills" actions={<button onClick={add} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Add</button>}>
      <div className="grid grid-cols-2 gap-2">
        {s.data.skills.map((sk, i) => (
          <div key={i} className="rounded-xl border border-white/10 bg-white/[0.03] p-2.5">
            <div className="flex items-center gap-1">
              <input value={sk.name} onChange={(e) => setSkill(i, { name: e.target.value })} className="flex-1 rounded-md bg-transparent text-[13px] text-white focus:outline-none" />
              <button onClick={() => del(i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
            </div>
            <input type="range" min={20} max={100} value={sk.level} onChange={(e) => setSkill(i, { level: parseInt(e.target.value, 10) })} className="mt-1.5 w-full accent-brand-500" />
          </div>
        ))}
      </div>
    </Card>
  );
}

function ProjectsEditor() {
  const s = useStore();
  const setProj = (i: number, patch: Partial<typeof s.data.projects[number]>) =>
    s.update((d) => { const p = [...d.projects]; p[i] = { ...p[i], ...patch }; return { ...d, projects: p }; });
  const add = () => s.update((d) => ({ ...d, projects: [...d.projects, { name: "Project", description: "What it does.", link: "" }] }));
  const del = (i: number) => s.update((d) => ({ ...d, projects: d.projects.filter((_, k) => k !== i) }));
  return (
    <Card title="Projects" actions={<button onClick={add} className="flex items-center gap-1.5 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/10"><Plus className="h-3.5 w-3.5" /> Add</button>}>
      <div className="space-y-3">
        {s.data.projects.map((p, i) => (
          <div key={i} className="rounded-2xl border border-white/10 bg-white/[0.03] p-3">
            <div className="mb-2 flex justify-between"><span className="text-xs text-slate-400">{p.name}</span><button onClick={() => del(i)} className="text-red-400/60 hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button></div>
            <div className="grid grid-cols-2 gap-2">
              <Field label="Name" value={p.name} onChange={(v) => setProj(i, { name: v })} />
              <Field label="Link" value={p.link} onChange={(v) => setProj(i, { link: v })} />
              <Field label="Description" value={p.description} onChange={(v) => setProj(i, { description: v })} className="col-span-2" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

/* ───────────── Reusable bits ───────────── */
function Card({ title, children, defaultOpen = false, actions }: { title: string; children: React.ReactNode; defaultOpen?: boolean; actions?: React.ReactNode }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02]">
      <div className="flex items-center gap-2 px-4 py-3">
        <button onClick={() => setOpen((v) => !v)} className="flex flex-1 items-center gap-2 text-left">
          <ChevronDown className={`h-4 w-4 text-slate-400 transition ${open ? "" : "-rotate-90"}`} />
          <span className="text-sm font-semibold text-white">{title}</span>
        </button>
        {actions}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="px-4 pb-4">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({ label, value, onChange, className }: { label: string; value: string; onChange: (v: string) => void; className?: string }) {
  return (
    <label className={`block ${className ?? ""}`}>
      <span className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-slate-500">{label}</span>
      <input value={value} onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[13px] text-slate-100 focus:border-brand-400/60 focus:outline-none" />
    </label>
  );
}

function AIButton({ label, icon: Icon, onClick, loading }: { label: string; icon: typeof Sparkles; onClick: () => void; loading?: boolean }) {
  return (
    <button onClick={onClick} disabled={loading} className="flex items-center gap-1.5 rounded-lg bg-brand-500/15 px-2.5 py-1.5 text-xs font-semibold text-brand-200 transition hover:bg-brand-500/25 disabled:opacity-60">
      {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon className="h-3.5 w-3.5" />} {loading ? "Thinking…" : label}
    </button>
  );
}

/* ───────────── Export Modal ───────────── */
function ExportModal({ onClose, getPaper, onExport, onShare, onProtect, onQR }: {
  onClose: () => void;
  getPaper: () => HTMLElement | null;
  onExport: (fn: () => void | Promise<void>, label: string) => void;
  onShare: () => void;
  onProtect: () => void;
  onQR: () => void;
}) {
  const s = useStore();
  const name = s.data.basics.name;

  const formats = [
    { icon: FileDown, label: "PDF", desc: "ATS-safe vector PDF", color: "#ef4444", run: () => exportPDF(s.data, name) },
    { icon: FileType, label: "DOCX", desc: "Editable Word document", color: "#2563eb", run: () => exportDOCX(s.data, name) },
    { icon: FileCode, label: "HTML", desc: "Standalone web page", color: "#f59e0b", run: () => exportHTML(s.data, name) },
    { icon: FileText, label: "Markdown", desc: "For GitHub & docs", color: "#10b981", run: () => exportMarkdown(s.data, name) },
    { icon: FileText, label: "TXT", desc: "Plain text", color: "#64748b", run: () => exportTXT(s.data, name) },
    { icon: FileJson, label: "JSON", desc: "Structured data", color: "#8b5cf6", run: () => exportJSON(s.data, name) },
    { icon: ImageIcon, label: "PNG", desc: "High-res image", color: "#ec4899", run: () => { const el = getPaper(); return el ? exportPNG(el, name) : Promise.reject(); } },
    { icon: ImageIcon, label: "JPEG", desc: "Compressed image", color: "#06b6d4", run: () => { const el = getPaper(); return el ? exportJPEG(el, name) : Promise.reject(); } },
  ];
  const actions = [
    { icon: Printer, label: "Print", desc: "Save via browser", run: () => printResume() },
    { icon: Share2, label: "Share Link", desc: "Copy public URL", run: onShare },
    { icon: QrCode, label: "QR Code", desc: "Scan-ready code", run: onQR },
    { icon: Lock, label: "Protected", desc: "PIN-protected link", run: onProtect },
  ];

  return (
    <Modal onClose={onClose} title="Export & Share" subtitle="Download in any format or share instantly." icon={ExportIcon}>
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">File formats</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {formats.map((f) => (
          <button key={f.label} onClick={() => onExport(f.run, `${f.label} file`)}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-brand-400/40 hover:bg-white/[0.06]">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${f.color}22` }}>
              <f.icon className="h-4.5 w-4.5" style={{ color: f.color }} />
            </span>
            <div>
              <p className="text-sm font-semibold text-white">{f.label}</p>
              <p className="text-[10px] text-slate-500">{f.desc}</p>
            </div>
            <span className="mt-auto flex items-center gap-1 text-[10px] font-medium text-brand-300 opacity-0 transition group-hover:opacity-100">Download <Download className="h-3 w-3" /></span>
          </button>
        ))}
      </div>

      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Share & print</p>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {actions.map((a) => (
          <button key={a.label} onClick={a.run}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-white/10 bg-white/[0.03] p-3 text-left transition hover:border-brand-400/40 hover:bg-white/[0.06]">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-500/15"><a.icon className="h-4.5 w-4.5 text-brand-200" /></span>
            <div><p className="text-sm font-semibold text-white">{a.label}</p><p className="text-[10px] text-slate-500">{a.desc}</p></div>
          </button>
        ))}
      </div>
    </Modal>
  );
}

/* ───────────── Import Modal ───────────── */
const CONNECTORS = [
  { id: "linkedin", label: "LinkedIn", emoji: "in", color: "#0a66c2" },
  { id: "github", label: "GitHub", emoji: "GH", color: "#fff" },
  { id: "drive", label: "Google Drive", emoji: "📁", color: "#22c55e" },
  { id: "dropbox", label: "Dropbox", emoji: "📦", color: "#0061ff" },
  { id: "onedrive", label: "OneDrive", emoji: "☁️", color: "#0078d4" },
  { id: "europass", label: "Europass", emoji: "🇪🇺", color: "#0b5fb0" },
];

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: (r: ImportResult) => boolean }) {
  const s = useStore();
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [pasting, setPasting] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [busy, setBusy] = useState(false);

  const handleFile = async (file?: File) => {
    if (!file) return;
    setBusy(true);
    const res = await extractText(file);
    setBusy(false);
    onImported(res);
    if (res.ok) onClose();
  };

  const handlePaste = () => {
    if (!pasteText.trim()) { toast("Paste some content first", "error"); return; }
    onImported({ ok: true, raw: pasteText });
    onClose();
  };

  const handleConnector = (label: string) => {
    toast(`Connecting to ${label}…`, "info", "OAuth flow runs through a secure backend in production.");
    setBusy(true);
    // Demo: simulate fetching a profile then load sample data parsed as if imported
    setTimeout(() => {
      setBusy(false);
      onImported({ ok: true, data: s.data });
      toast(`${label} profile imported`, "success", "Loaded into the editor.");
      onClose();
    }, 1100);
  };

  return (
    <Modal onClose={onClose} title="Import Resume" subtitle="Upload a file, paste text, or connect a source." icon={ImportIcon}>
      {/* dropzone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        onClick={() => fileRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-brand-400 bg-brand-500/10" : "border-white/15 bg-white/[0.02] hover:border-white/30"}`}
      >
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-500/15"><Upload className="h-6 w-6 text-brand-200" /></span>
        <p className="mt-3 text-sm font-semibold text-white">Drop your resume here or click to browse</p>
        <p className="mt-1 text-xs text-slate-500">PDF · DOCX · TXT · MD · RTF · JSON</p>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.doc,.txt,.md,.rtf,.json" className="hidden" onChange={(e) => handleFile(e.target.files?.[0])} />
        {busy && <p className="mt-3 flex items-center gap-2 text-xs text-brand-200"><Loader2 className="h-3.5 w-3.5 animate-spin" /> Parsing…</p>}
      </div>

      {/* connectors */}
      <p className="mb-2 mt-5 text-[11px] font-semibold uppercase tracking-wide text-slate-500">Connect a source</p>
      <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-6">
        {CONNECTORS.map((c) => (
          <button key={c.id} onClick={() => handleConnector(c.label)} disabled={busy}
            className="flex flex-col items-center gap-1.5 rounded-2xl border border-white/10 bg-white/[0.03] p-3 transition hover:border-brand-400/40 hover:bg-white/[0.06] disabled:opacity-50">
            <span className="grid h-9 w-9 place-items-center rounded-xl text-sm font-bold" style={{ background: `${c.color}22`, color: c.color }}>{c.emoji}</span>
            <span className="text-[10px] text-slate-400">{c.label}</span>
          </button>
        ))}
      </div>

      {/* paste */}
      <div className="mt-5">
        <button onClick={() => setPasting((v) => !v)} className="flex items-center gap-1.5 text-xs font-medium text-brand-300 hover:text-brand-200">
          <ClipboardPaste className="h-3.5 w-3.5" /> {pasting ? "Hide paste box" : "Or paste resume text"}
        </button>
        {pasting && (
          <div className="mt-2">
            <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} placeholder="Paste your resume text here…"
              className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-[13px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
            <div className="mt-2 flex gap-2">
              <button onClick={handlePaste} className="btn-glow flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white">
                <CheckCircle2 className="h-3.5 w-3.5" /> Parse & Import
              </button>
              <button onClick={() => setPasteText(SAMPLE_RESUME_TEXT)} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10">
                Try a sample
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-5 flex items-center gap-1.5 rounded-xl bg-cyber-500/10 p-3 text-[11px] text-cyber-200">
        <Lock className="h-3.5 w-3.5" /> Files are parsed locally in your browser. Nothing is uploaded unless you publish.
      </p>
    </Modal>
  );
}

/* ───────────── QR Modal ───────────── */
function QRModal({ link, onClose }: { link: string; onClose: () => void }) {
  const { toast } = useToast();
  const data = link || "https://resumint.ai/r/resume";
  const qr = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&margin=8&data=${encodeURIComponent(data)}`;
  const copy = async () => {
    try { await navigator.clipboard.writeText(data); toast("Link copied", "success"); } catch { /* */ }
  };
  return (
    <Modal onClose={onClose} title="Resume QR Code" subtitle="Scan to open your live resume." icon={QrCode}>
      <div className="flex flex-col items-center">
        <div className="rounded-2xl bg-white p-3 shadow-lg">
          <img src={qr} alt="QR code" width={260} height={260} className="h-[260px] w-[260px]" />
        </div>
        <p className="mt-4 max-w-xs break-all text-center text-xs text-slate-400">{data}</p>
        <div className="mt-4 flex gap-2">
          <a href={qr} download="resumint-qr.png" className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium text-white hover:bg-white/10">
            <Download className="h-3.5 w-3.5" /> Download QR
          </a>
          <button onClick={copy} className="btn-glow flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold text-white">
            <Link2 className="h-3.5 w-3.5" /> Copy link
          </button>
        </div>
      </div>
    </Modal>
  );
}

/* ───────────── Generic Modal ───────────── */
function Modal({ children, onClose, title, subtitle, icon: Icon }: {
  children: React.ReactNode; onClose: () => void; title: string; subtitle?: string; icon: typeof X;
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 backdrop-blur-sm sm:items-center sm:p-6">
      <motion.div initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={(e) => e.stopPropagation()}
        transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong max-h-[92vh] w-full max-w-2xl overflow-auto rounded-t-3xl p-6 sm:rounded-3xl">
        <div className="mb-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500"><Icon className="h-5 w-5 text-white" /></span>
            <div>
              <h3 className="font-display text-lg font-bold text-white">{title}</h3>
              {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </motion.div>
    </motion.div>
  );
}

/* ───────────── ATS Panel ───────────── */
function ATSPanel({ onClose }: { onClose: () => void }) {
  const s = useStore();
  const { toast } = useToast();
  const [jd, setJd] = useState("Senior Frontend Engineer — React, TypeScript, GraphQL, system design, performance.");
  const [report, setReport] = useState<ReturnType<typeof analyzeResume> | null>(null);
  const [loading, setLoading] = useState(false);

  const run = () => {
    setLoading(true); setReport(null);
    setTimeout(() => { setReport(analyzeResume(resumeToText(s.data), jd)); setLoading(false); }, 700);
  };
  const applyFix = () => {
    if (!report) return;
    s.update((d) => {
      const skills = [...d.skills];
      report.missing.slice(0, 4).forEach((k) => { if (!skills.some((x) => x.name.toLowerCase() === k)) skills.push({ name: k.charAt(0).toUpperCase() + k.slice(1), level: 78 }); });
      return { ...d, skills };
    });
    toast("Keywords added", "success", `${report.missing.length} missing keywords inserted into Skills.`);
    run();
  };

  return (
    <Modal onClose={onClose} title="Live ATS Scanner" subtitle="Analyze your resume against any job description." icon={Gauge}>
      <textarea value={jd} onChange={(e) => setJd(e.target.value)} rows={2} placeholder="Paste the target job description…"
        className="w-full resize-none rounded-xl border border-white/10 bg-white/5 p-3 text-[13px] text-slate-200 focus:border-brand-400/60 focus:outline-none" />
      <div className="mt-3 flex gap-2">
        <button onClick={run} disabled={loading} className="btn-glow flex flex-1 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-60">
          {loading ? "Scanning…" : "Run ATS Scan"} {!loading && <Sparkles className="h-4 w-4" />}
        </button>
        {report && report.missing.length > 0 && (
          <button onClick={applyFix} className="flex items-center gap-1.5 rounded-xl border border-brand-400/40 bg-brand-500/15 px-4 py-3 text-sm font-semibold text-brand-200 hover:bg-brand-500/25">
            <Wand2 className="h-4 w-4" /> Auto-fix
          </button>
        )}
      </div>
      {report && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-5">
          <div className="flex items-center gap-4 rounded-2xl bg-white/[0.03] p-4">
            <ScoreRing value={report.score} size={96} color="#22d3ee" sublabel="ATS" />
            <div>
              <p className="font-display text-2xl font-bold text-white">Grade {report.grade}</p>
              <p className="text-sm text-slate-400">{report.verdict}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {report.checks.map((c) => (
              <div key={c.label} className="rounded-xl bg-white/[0.03] p-3">
                <div className="flex justify-between text-xs"><span className="text-slate-300">{c.label}</span><span className="font-semibold text-white">{c.score}%</span></div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-cyber-400" style={{ width: `${c.score}%` }} /></div>
                <p className="mt-0.5 text-[10px] text-slate-500">{c.note}</p>
              </div>
            ))}
          </div>
          {report.missing.length > 0 && (
            <div className="mt-4">
              <p className="mb-1.5 text-xs font-semibold text-magenta-300">Missing keywords</p>
              <div className="flex flex-wrap gap-1.5">{report.missing.map((k) => <span key={k} className="rounded-full bg-red-500/10 px-2 py-0.5 text-[11px] text-red-300 ring-1 ring-red-500/20">{k}</span>)}</div>
            </div>
          )}
          <div className="mt-4 rounded-xl bg-emerald-500/10 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-emerald-300"><Check className="h-3.5 w-3.5" /> {report.suggestions[0]}</p>
          </div>
        </motion.div>
      )}
    </Modal>
  );
}
