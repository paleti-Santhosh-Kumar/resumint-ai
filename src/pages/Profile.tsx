import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Sparkles, FileText, LayoutGrid, Bot, Briefcase, Wand2, Gauge, Download,
  LogOut, UserCircle2, Mail, Calendar, MapPin, ShieldCheck, Clock, Cpu,
  TrendingUp, ChevronRight, Settings, ArrowRight,
} from "lucide-react";
import { Link, useRouter } from "../lib/router";
import { useStore } from "../lib/store";
import { useUser } from "../lib/user";
import { getAccount } from "../lib/accounts";
import { analyzeResume, resumeToText } from "../lib/ai";
import { hasAI } from "../lib/openrouter";
import { Reveal, GlassCard } from "../components/ui";
import { useToast } from "../components/Toast";
import ScoreRing from "../components/ScoreRing";

const QUICK = [
  { to: "/builder", icon: FileText, title: "Resume Builder", desc: "Edit & preview live", color: "#7c3aed" },
  { to: "/templates", icon: LayoutGrid, title: "Templates", desc: "1,200+ designs", color: "#ec4899" },
  { to: "/tools", icon: Bot, title: "AI Tools", desc: "31 engines", color: "#22d3ee" },
  { to: "/dashboard", icon: TrendingUp, title: "Dashboard", desc: "Stats & score", color: "#10b981" },
];

const TOOLS = [
  { to: "/tools", icon: Gauge, label: "ATS Scanner", color: "#22d3ee" },
  { to: "/tools", icon: Wand2, label: "Bullet Improver", color: "#7c3aed" },
  { to: "/tools", icon: Bot, label: "Cover Letter", color: "#ec4899" },
  { to: "/tools", icon: Sparkles, label: "Mock Interview", color: "#10b981" },
  { to: "/builder", icon: Download, label: "Export PDF", color: "#f59e0b" },
  { to: "/templates", icon: LayoutGrid, label: "Photo Templates", color: "#8b5cf6" },
];

export default function Profile() {
  const { session, logout } = useUser();
  const { data } = useStore();
  const { navigate } = useRouter();
  const { toast } = useToast();

  const score = useMemo(
    () => analyzeResume(resumeToText(data), `${data.basics.title} ${data.skills.map((s) => s.name).join(" ")}`).score,
    [data]
  );
  const acct = session ? getAccount(session.email) : undefined;
  const firstName = (session?.name || "User").split(" ")[0];
  const aiOn = hasAI();

  const signOut = () => { logout(); toast("Signed out", "info", "See you soon."); navigate("/"); };

  return (
    <div className="relative z-10 mx-auto max-w-5xl px-6 pb-24 pt-32">
      <Reveal>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Link to="/dashboard" className="hover:text-white">Home</Link>
          <ChevronRight className="h-3 w-3" />
          <span className="text-slate-300">Profile</span>
        </div>
      </Reveal>

      {/* header card */}
      <Reveal delay={0.05}>
        <GlassCard glow className="relative mt-4 overflow-hidden p-6 sm:p-8">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-brand-500/20 blur-3xl" />
          <div className="absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-cyber-500/20 blur-3xl" />
          <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
            {session?.photo ? (
              <img src={session.photo} alt="" className="h-24 w-24 rounded-3xl object-cover ring-2 ring-brand-500/40" />
            ) : (
              <span className="grid h-24 w-24 place-items-center rounded-3xl bg-gradient-to-br from-brand-500 to-cyber-500 font-display text-4xl font-bold text-white">
                {firstName.charAt(0).toUpperCase()}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-3xl font-bold text-white">{session?.name ?? "Guest User"}</h1>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-400">
                {session?.email && <span className="flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" /> {session.email}</span>}
                {data.basics.location && <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {data.basics.location}</span>}
                {acct && <span className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5" /> Joined {new Date(acct.createdAt).toLocaleDateString()}</span>}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <StatusBadge ok={!!session} label={session ? "Account Verified" : "Guest"} icon={ShieldCheck} />
                <StatusBadge ok={aiOn} label={aiOn ? "AI Connected" : "Local Engine"} icon={Cpu} />
                <StatusBadge ok={!!session} label={session ? "Always signed in" : "Sign in to save"} icon={Clock} />
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-1 rounded-2xl bg-white/[0.03] px-6 py-4">
              <ScoreRing value={score} size={84} stroke={8} color="#22d3ee" sublabel="ATS" />
            </div>
          </div>
        </GlassCard>
      </Reveal>

      {/* quick navigation */}
      <Reveal delay={0.1}>
        <h2 className="mb-3 mt-10 px-1 font-display text-lg font-semibold text-white">Quick access</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {QUICK.map((q, i) => (
            <motion.div key={q.title} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12 + i * 0.05 }}>
              <Link to={q.to} className="block">
                <GlassCard hover className="group h-full p-5">
                  <span className="grid h-11 w-11 place-items-center rounded-xl" style={{ background: `${q.color}22` }}>
                    <q.icon className="h-5 w-5" style={{ color: q.color }} />
                  </span>
                  <p className="mt-3 text-sm font-semibold text-white">{q.title}</p>
                  <p className="text-[11px] text-slate-500">{q.desc}</p>
                  <span className="mt-2 flex items-center gap-1 text-[11px] font-medium text-brand-300 opacity-0 transition group-hover:opacity-100">
                    Open <ArrowRightSmall />
                  </span>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      </Reveal>

      {/* tools grid */}
      <Reveal delay={0.15}>
        <h2 className="mb-3 mt-10 px-1 font-display text-lg font-semibold text-white">Jump into a tool</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {TOOLS.map((t) => (
            <Link key={t.label} to={t.to} className="block">
              <GlassCard hover className="group flex items-center gap-3 p-4">
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl" style={{ background: `${t.color}22` }}>
                  <t.icon className="h-5 w-5" style={{ color: t.color }} />
                </span>
                <span className="text-[13px] font-medium text-white">{t.label}</span>
                <ChevronRight className="ml-auto h-4 w-4 text-slate-600 transition group-hover:translate-x-0.5 group-hover:text-white" />
              </GlassCard>
            </Link>
          ))}
        </div>
      </Reveal>

      {/* account actions */}
      <Reveal delay={0.2}>
        <h2 className="mb-3 mt-10 px-1 font-display text-lg font-semibold text-white">Account</h2>
        <GlassCard className="divide-y divide-white/5 p-2">
          <ActionRow icon={Briefcase} label="Your resume" sub={`${data.experience.length} jobs · ${data.skills.length} skills`} to="/builder" />
          <ActionRow icon={Settings} label="Resume settings & AI" sub="Templates, fonts, OpenRouter key" onClick={() => navigate("/builder")} />
          <ActionRow icon={UserCircle2} label="Dashboard" sub="Stats, score & activity" to="/dashboard" />
          <ActionRow icon={LogOut} label="Sign out" sub="End your session" danger onClick={signOut} />
        </GlassCard>
      </Reveal>
    </div>
  );
}

function ArrowRightSmall() {
  return <ArrowRight className="h-3 w-3" />;
}

function StatusBadge({ ok, label, icon: Icon }: { ok: boolean; label: string; icon: typeof ShieldCheck }) {
  return (
    <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium ${ok ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-400"}`}>
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

function ActionRow({
  icon: Icon, label, sub, to, onClick, danger,
}: {
  icon: typeof Briefcase; label: string; sub: string; to?: string; onClick?: () => void; danger?: boolean;
}) {
  const content = (
    <div className={`flex items-center gap-3 rounded-xl px-3 py-3 transition hover:bg-white/[0.04] ${danger ? "text-red-300" : "text-white"}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${danger ? "bg-red-500/10" : "bg-white/5"}`}>
        <Icon className={`h-4 w-4 ${danger ? "text-red-400" : "text-slate-300"}`} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{label}</p>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-slate-600" />
    </div>
  );
  if (to) return <Link to={to}>{content}</Link>;
  return <button onClick={onClick} className="block w-full text-left">{content}</button>;
}
