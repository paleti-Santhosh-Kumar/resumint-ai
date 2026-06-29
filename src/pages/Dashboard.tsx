import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BarChart3, Briefcase, CalendarDays, Target, Settings,
  TrendingUp, Sparkles, Award, FileText, Zap, Check, LogOut, UserCircle2,
  RefreshCw, Save, Trash2, AlertTriangle, X, MapPin, Calendar, ImageIcon,
  BriefcaseBusiness,
} from "lucide-react";
import { Link, useRouter } from "../lib/router";
import { useStore } from "../lib/store";
import { analyzeResume, resumeToText } from "../lib/ai";
import { getAccount, type UserAccount } from "../lib/accounts";
import { useUser } from "../lib/user";
import { Reveal, GlassCard } from "../components/ui";
import { useToast } from "../components/Toast";
import ScoreRing from "../components/ScoreRing";

const NAV = [
  { icon: LayoutDashboard, label: "Dashboard", active: true },
  { icon: BarChart3, label: "Analytics" },
  { icon: Briefcase, label: "Applications" },
  { icon: CalendarDays, label: "Interviews" },
  { icon: Target, label: "Career Goals" },
  { icon: Award, label: "Achievements" },
  { icon: Settings, label: "Settings" },
];

export default function Dashboard() {
  const { data, savedAt, clearAll } = useStore();
  const { session, logout, updateProfile } = useUser();
  const { navigate } = useRouter();
  const { toast } = useToast();
  const [menuOpen, setMenuOpen] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  const acct: UserAccount | undefined = session ? getAccount(session.email) : undefined;

  const stats = useMemo(() => {
    const b = data.basics;
    const text = resumeToText(data);
    const wordCount = text.split(/\s+/).filter(Boolean).length;
    const score = analyzeResume(text, `${b.title} ${data.skills.map((s) => s.name).join(" ")}`).score;

    // Profile completeness — based on actually-filled fields.
    const checks = [
      !!b.name, !!b.title, !!b.email, !!b.phone, !!b.location,
      b.summary.length > 40, !!b.photo,
      data.experience.length >= 1, data.education.length >= 1,
      data.skills.length >= 3, data.projects.length >= 1,
    ];
    const completeness = Math.round((checks.filter(Boolean).length / checks.length) * 100);
    return {
      score,
      wordCount,
      completeness,
      experience: data.experience.length,
      education: data.education.length,
      skills: data.skills.length,
      projects: data.projects.length,
      bullets: data.experience.reduce((n, e) => n + e.bullets.length, 0),
    };
  }, [data]);

  const firstName = (session?.name || data.basics.name || "there").split(" ")[0];

  const refresh = () => {
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      toast("Dashboard refreshed", "success", "Stats recalculated from your resume.");
    }, 700);
  };

  const doClear = () => {
    clearAll();
    logout();
    setConfirmClear(false);
    toast("All data cleared", "success", "Signed out and reset to defaults.");
  };

  const signOut = () => {
    logout();
    toast("Signed out", "info", "Come back soon.");
    navigate("/");
  };

  const onAvatar = (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast("Choose an image", "error"); return; }
    if (file.size > 4_000_000) { toast("Image too large (max 4MB)", "error"); return; }
    const r = new FileReader();
    r.onload = () => { updateProfile({ photo: String(r.result) }); toast("Profile photo updated", "success"); };
    r.readAsDataURL(file);
  };

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-4 pb-24 pt-28 sm:px-6">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        {/* sidebar */}
        <aside className="hidden lg:block">
          <div className="sticky top-28 space-y-1">
            {NAV.map((n) => (
              <button key={n.label} onClick={() => (n.active ? null : toast(`${n.label}`, "info", "Section loaded."))}
                className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition ${n.active ? "bg-white/10 text-white" : "text-slate-400 hover:bg-white/5 hover:text-white"}`}>
                <n.icon className="h-4 w-4" /> {n.label}
              </button>
            ))}
          </div>
        </aside>

        {/* main */}
        <main className="min-w-0">
          {/* header */}
          <Reveal>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {session?.photo ? (
                  <img src={session.photo} alt="" className="h-12 w-12 rounded-full object-cover ring-2 ring-brand-500/40" />
                ) : (
                  <span className="grid h-12 w-12 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 font-display text-base font-bold text-white">
                    {firstName.charAt(0).toUpperCase()}
                  </span>
                )}
                <div>
                  <p className="text-sm text-slate-400">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</p>
                  <h1 className="mt-0.5 font-display text-2xl font-bold text-white sm:text-3xl">Welcome back, {firstName} 👋</h1>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={refresh} title="Refresh" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white">
                  <RefreshCw className={`h-4 w-4 ${spinning ? "animate-spin" : ""}`} />
                </button>
                <div className="relative">
                  <button onClick={() => setMenuOpen((v) => !v)} title="Settings" className="grid h-10 w-10 place-items-center rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:text-white">
                    <Settings className="h-4 w-4" />
                  </button>
                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
                        className="absolute right-0 top-full z-30 mt-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-ink-900/95 p-1.5 shadow-2xl backdrop-blur">
                        <MenuRow icon={RefreshCw} label="Refresh dashboard" onClick={() => { setMenuOpen(false); refresh(); }} />
                        <MenuRow icon={Save} label={savedAt ? `Saved · ${new Date(savedAt).toLocaleTimeString()}` : "All changes saved"} onClick={() => { setMenuOpen(false); toast("Autosave active", "success"); }} />
                        <div className="my-1 h-px bg-white/10" />
                        <MenuRow icon={Trash2} label="Clear all data" danger onClick={() => { setMenuOpen(false); setConfirmClear(true); }} />
                        <MenuRow icon={LogOut} label="Sign out" danger onClick={() => { setMenuOpen(false); signOut(); }} />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <button onClick={() => navigate("/builder")} className="btn-glow flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold text-white">
                  <Sparkles className="h-4 w-4" /> Build Resume
                </button>
              </div>
            </div>
          </Reveal>

          {/* not signed in nudge */}
          {!session && (
            <Reveal>
              <div className="mt-6 flex flex-col items-center justify-between gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/[0.07] px-5 py-4 sm:flex-row">
                <div className="flex items-center gap-3">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-500/15"><UserCircle2 className="h-5 w-5 text-amber-400" /></span>
                  <div>
                    <p className="text-sm font-semibold text-white">You're browsing as a guest</p>
                    <p className="text-xs text-slate-400">Create a free account to save your resume to a personal profile and access it from anywhere.</p>
                  </div>
                </div>
                <button onClick={() => navigate("/auth")} className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15">Sign up free</button>
              </div>
            </Reveal>
          )}

          {/* stat cards — all real, derived from the resume */}
          <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard label="ATS Score" value={`${stats.score}`} suffix="/100" trend={stats.score >= 80 ? "Recruiter-ready" : "Optimize more"} icon={TrendingUp} color="#22d3ee" big />
            <StatCard label="Profile Complete" value={`${stats.completeness}`} suffix="%" trend={stats.completeness === 100 ? "Complete" : "Add more"} icon={Target} color="#7c3aed" />
            <StatCard label="Experience" value={`${stats.experience}`} trend={`${stats.bullets} bullets`} icon={Briefcase} color="#ec4899" />
            <StatCard label="Skills" value={`${stats.skills}`} trend={`${stats.wordCount} words`} icon={Zap} color="#10b981" />
          </div>

          {/* charts row */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.4fr_1fr]">
            <Reveal>
              <GlassCard className="p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-semibold text-white">Resume Health</h3>
                    <p className="text-xs text-slate-500">Live analysis of your current resume</p>
                  </div>
                  <span className="flex items-center gap-1 rounded-full bg-white/5 px-2.5 py-1 text-xs text-slate-400"><FileText className="h-3 w-3" /> {stats.wordCount} words</span>
                </div>
                <Bars
                  rows={[
                    { label: "ATS Score", v: stats.score, c: "#22d3ee" },
                    { label: "Profile Complete", v: stats.completeness, c: "#7c3aed" },
                    { label: "Content Density", v: Math.min(100, Math.round((stats.wordCount / 600) * 100)), c: "#ec4899" },
                    { label: "Detail Richness", v: Math.min(100, (stats.bullets + stats.projects + stats.skills) * 6), c: "#10b981" },
                  ]}
                />
              </GlassCard>
            </Reveal>

            <Reveal delay={0.1}>
              <GlassCard className="flex flex-col items-center p-6">
                <h3 className="self-start text-sm font-semibold text-white">Current ATS Score</h3>
                <div className="my-4"><ScoreRing value={stats.score} size={150} stroke={11} color="#22d3ee" sublabel="ATS" /></div>
                <div className="grid w-full grid-cols-3 gap-2 text-center">
                  <Mini label="Experience" value={stats.experience} />
                  <Mini label="Education" value={stats.education} />
                  <Mini label="Projects" value={stats.projects} />
                </div>
              </GlassCard>
            </Reveal>
          </div>

          {/* profile + next steps */}
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            <Reveal>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Your Profile</h3>
                <div className="flex items-center gap-4">
                  <div className="relative">
                    {session?.photo ? (
                      <img src={session.photo} alt="" className="h-16 w-16 rounded-2xl object-cover" />
                    ) : (
                      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyber-500 font-display text-xl font-bold text-white">{firstName.charAt(0).toUpperCase()}</span>
                    )}
                    {session && (
                      <label className="absolute -bottom-1 -right-1 grid h-7 w-7 cursor-pointer place-items-center rounded-full border border-white/10 bg-ink-900 text-slate-300 hover:text-white" title="Change photo">
                        <ImageIcon className="h-3.5 w-3.5" />
                        <input type="file" accept="image/*" className="hidden" onChange={(e) => onAvatar(e.target.files?.[0])} />
                      </label>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg font-bold text-white">{session?.name ?? "Guest"}</p>
                    <p className="truncate text-sm text-slate-400">{session?.email ?? "Not signed in"}</p>
                    <div className="mt-1 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                      {session && acct && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" /> Joined {new Date(acct.createdAt).toLocaleDateString()}</span>}
                      {data.basics.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {data.basics.location}</span>}
                    </div>
                  </div>
                </div>
                {session ? (
                  <div className="mt-5 grid grid-cols-2 gap-2">
                    <Link to="/builder" className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-white hover:bg-white/10"><FileText className="h-3.5 w-3.5" /> Edit Resume</Link>
                    <button onClick={signOut} className="flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 py-2.5 text-xs font-medium text-slate-300 hover:bg-white/10"><LogOut className="h-3.5 w-3.5" /> Sign out</button>
                  </div>
                ) : (
                  <button onClick={() => navigate("/auth")} className="btn-glow mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white">
                    <UserCircle2 className="h-4 w-4" /> Create your profile
                  </button>
                )}
              </GlassCard>
            </Reveal>

            <Reveal delay={0.1}>
              <GlassCard className="p-6">
                <h3 className="mb-4 text-sm font-semibold text-white">Next steps</h3>
                <div className="space-y-2.5">
                  {[
                    { done: stats.completeness >= 60, label: "Complete your resume profile", to: "/builder" },
                    { done: stats.score >= 80, label: "Reach an ATS score of 80+", to: "/builder" },
                    { done: false, label: "Run a mock interview", to: "/tools" },
                    { done: stats.experience >= 2, label: "Add 2+ experience entries", to: "/builder" },
                    { done: false, label: "Generate a cover letter", to: "/tools" },
                  ].map((s, i) => (
                    <Link key={i} to={s.to} className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${s.done ? "border-emerald-500/20 bg-emerald-500/[0.06]" : "border-white/10 bg-white/[0.03] hover:bg-white/[0.06]"}`}>
                      <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full ${s.done ? "bg-emerald-500/20" : "bg-white/5"}`}>
                        {s.done ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <span className="h-2 w-2 rounded-full bg-slate-500" />}
                      </span>
                      <span className={`text-[13px] ${s.done ? "text-slate-400 line-through" : "text-slate-200"}`}>{s.label}</span>
                    </Link>
                  ))}
                </div>
              </GlassCard>
            </Reveal>
          </div>

          {/* empty-state sections (no fake data) */}
          <div className="mt-6 grid gap-6 lg:grid-cols-3">
            <EmptyCard icon={BriefcaseBusiness} title="Applications" desc="Track every job you apply to. Add your first application to start." cta="Open job tools" to="/tools" />
            <EmptyCard icon={CalendarDays} title="Interviews" desc="Scheduled interviews will appear here with prep and reminders." cta="Practice now" to="/tools" />
            <EmptyCard icon={Zap} title="Recent activity" desc="Your AI actions and edits will show up here in real time." cta="Explore AI" to="/tools" />
          </div>
        </main>
      </div>

      {/* clear data confirm */}
      <AnimatePresence>
        {confirmClear && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setConfirmClear(false)}
            className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6 backdrop-blur-sm">
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()} transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="glass-strong relative w-full max-w-md rounded-3xl p-6 text-center">
              <button onClick={() => setConfirmClear(false)} className="absolute right-5 top-5 text-slate-400 hover:text-white"><X className="h-5 w-5" /></button>
              <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-red-500/15"><AlertTriangle className="h-7 w-7 text-red-400" /></span>
              <h3 className="mt-4 font-display text-xl font-bold text-white">Clear all data?</h3>
              <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
                This permanently removes your resume content, settings, and signs you out. This action can't be undone.
              </p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setConfirmClear(false)} className="flex-1 rounded-xl border border-white/10 bg-white/5 py-3 text-sm font-medium text-slate-200 hover:bg-white/10">Cancel</button>
                <button onClick={doClear} className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-red-500/90 py-3 text-sm font-semibold text-white hover:bg-red-500"><Trash2 className="h-4 w-4" /> Clear everything</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuRow({ icon: Icon, label, onClick, danger }: { icon: typeof Zap; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px] transition hover:bg-white/10 ${danger ? "text-red-300" : "text-slate-200"}`}>
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}

function StatCard({ label, value, suffix, trend, icon: Icon, color, big }: { label: string; value: string; suffix?: string; trend: string; icon: typeof Zap; color: string; big?: boolean }) {
  return (
    <GlassCard hover className="relative overflow-hidden p-5">
      <div className="absolute -right-6 -top-6 h-20 w-20 rounded-full opacity-20 blur-2xl" style={{ background: color }} />
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${color}22` }}><Icon className="h-4 w-4" style={{ color }} /></span>
      </div>
      <p className={`mt-3 font-display font-bold text-white ${big ? "text-4xl" : "text-3xl"}`}>{value}<span className="text-base text-slate-500">{suffix}</span></p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-[11px] font-medium" style={{ color }}>{trend}</p>
    </GlassCard>
  );
}

function Mini({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-white/[0.03] py-2">
      <p className="font-display text-lg font-bold text-white">{value}</p>
      <p className="text-[10px] text-slate-500">{label}</p>
    </div>
  );
}

function Bars({ rows }: { rows: { label: string; v: number; c: string }[] }) {
  return (
    <div className="space-y-4">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1.5 flex justify-between text-sm"><span className="text-slate-300">{r.label}</span><span className="font-semibold text-white">{Math.min(100, r.v)}%</span></div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div initial={{ width: 0 }} whileInView={{ width: `${Math.min(100, r.v)}%` }} viewport={{ once: true }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }} className="h-full rounded-full" style={{ background: r.c }} />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyCard({ icon: Icon, title, desc, cta, to }: { icon: typeof Zap; title: string; desc: string; cta: string; to: string }) {
  return (
    <Reveal>
      <GlassCard hover className="flex h-full flex-col items-center p-6 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/5 text-slate-400"><Icon className="h-6 w-6" /></span>
        <h3 className="mt-3 text-sm font-semibold text-white">{title}</h3>
        <p className="mt-1 flex-1 text-xs leading-relaxed text-slate-500">{desc}</p>
        <Link to={to} className="mt-3 flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-white transition hover:bg-white/10">
          {cta}
        </Link>
      </GlassCard>
    </Reveal>
  );
}
