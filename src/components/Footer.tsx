import { Sparkles, Globe, Mail, MessageCircle, Rss } from "lucide-react";
import { Link, useRouter } from "../lib/router";
import { useToast } from "./Toast";

const COLS: { title: string; links: { label: string; to?: string }[] }[] = [
  {
    title: "Product",
    links: [
      { label: "AI Resume Builder", to: "/builder" },
      { label: "ATS Scanner", to: "/tools" },
      { label: "Cover Letters", to: "/tools" },
      { label: "Portfolio Sites", to: "/dashboard" },
      { label: "Mock Interviews", to: "/tools" },
    ],
  },
  {
    title: "AI Tools",
    links: [
      { label: "Resume Writer", to: "/tools" },
      { label: "Skill Gap Analysis", to: "/tools" },
      { label: "Salary Estimator", to: "/tools" },
      { label: "Career Roadmap", to: "/dashboard" },
      { label: "LinkedIn Optimizer", to: "/tools" },
    ],
  },
  {
    title: "Templates",
    links: [
      { label: "Modern", to: "/templates" },
      { label: "Executive", to: "/templates" },
      { label: "Creative", to: "/templates" },
      { label: "Developer", to: "/templates" },
      { label: "ATS-Safe", to: "/templates" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Sign in", to: "/auth" },
      { label: "Create account", to: "/auth" },
      { label: "Dashboard", to: "/dashboard" },
      { label: "Templates", to: "/templates" },
      { label: "Security", to: "/" },
    ],
  },
];

export default function Footer() {
  return (
    <footer className="relative z-10 mt-24 border-t border-white/5 bg-ink-950/60">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
          <div>
            <Link to="/" className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500 shadow-lg shadow-brand-500/30">
                <Sparkles className="h-4.5 w-4.5 text-white" />
              </span>
              <span className="font-display text-lg font-bold tracking-tight text-white">
                RESUMINT<span className="text-gradient"> AI</span>
              </span>
            </Link>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-slate-400">
              The intelligent AI Career Operating System. Every tool you need to land your next role — free, forever.
            </p>
            <div className="mt-5 flex gap-3">
              {[Globe, Mail, MessageCircle, Rss].map((Icon, i) => (
                <a
                  key={i}
                  href="#/"
                  onClick={(e) => e.preventDefault()}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-slate-400 transition hover:border-brand-400/50 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{col.title}</h4>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <FooterLink label={l.label} to={l.to} />
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 text-sm text-slate-500 sm:flex-row">
          <div className="flex flex-col items-center gap-1 sm:items-start">
            <p>© {new Date().getFullYear()} RESUMINT AI. Crafted for ambitious careers.</p>
            <p className="text-[13px]">
              Developed by{" "}
              <span className="font-semibold text-gradient">Santhosh</span>
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-3 py-1.5 text-emerald-300">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            100% Free · No paywalls · No credit card
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterLink({ label, to }: { label: string; to?: string }) {
  const { navigate } = useRouter();
  const { toast } = useToast();
  return (
    <button
      onClick={() => {
        if (to) navigate(to);
        else toast(label, "info", "Coming soon.");
      }}
      className="text-sm text-slate-400 transition hover:text-white"
    >
      {label}
    </button>
  );
}
