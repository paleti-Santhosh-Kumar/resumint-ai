import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, Sparkles, LogOut } from "lucide-react";
import { Link, useRouter } from "../lib/router";
import { useUser } from "../lib/user";
import { hasAI } from "../lib/openrouter";
import MagneticButton from "./MagneticButton";
import AIConnection from "./AIConnection";

const LINKS = [
  { to: "/tools", label: "AI Tools" },
  { to: "/templates", label: "Templates" },
  { to: "/builder", label: "Builder" },
  { to: "/dashboard", label: "Dashboard" },
];

export default function Navbar() {
  const { path, navigate } = useRouter();
  const { session, logout } = useUser();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [aiPanel, setAiPanel] = useState(false);
  const [aiConnected, setAiConnected] = useState(hasAI());

  const signOut = () => { logout(); setOpen(false); navigate("/"); };

  // Re-check connection status on focus (key may have been added in another tab).
  useEffect(() => {
    const refresh = () => setAiConnected(hasAI());
    window.addEventListener("focus", refresh);
    window.addEventListener("storage", refresh);
    return () => {
      window.removeEventListener("focus", refresh);
      window.removeEventListener("storage", refresh);
    };
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 flex justify-center px-4 pt-3">
        <motion.nav
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className={[
            "flex w-full max-w-6xl items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-500 sm:px-5",
            scrolled ? "glass-strong ring-1 ring-white/10" : "border border-transparent",
          ].join(" ")}
        >
          <Link to="/" className="group flex items-center gap-2.5">
            <span className="relative grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500 shadow-lg shadow-brand-500/30">
              <Sparkles className="h-4.5 w-4.5 text-white" />
              <span className="absolute inset-0 rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500 blur-md opacity-50 transition group-hover:opacity-80" />
            </span>
            <span className="flex flex-col leading-none">
              <span className="font-display text-[15px] font-bold tracking-tight text-white">
                RESUMINT<span className="text-gradient"> AI</span>
              </span>
              <span className="text-[9px] font-medium uppercase tracking-[0.25em] text-slate-500">
                Career OS
              </span>
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className={[
                  "relative rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  path === l.to ? "text-white" : "text-slate-400 hover:text-white",
                ].join(" ")}
              >
                {path === l.to && (
                  <motion.span
                    layoutId="nav-pill"
                    className="absolute inset-0 -z-10 rounded-full bg-white/10 ring-1 ring-white/10"
                  />
                )}
                {l.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            <button
              onClick={() => setAiPanel(true)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition ${aiConnected ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" : "border-white/10 bg-white/5 text-slate-300 hover:text-white"}`}
              title="AI Connection"
            >
              <span className={`h-1.5 w-1.5 rounded-full ${aiConnected ? "bg-emerald-400" : "bg-amber-400"}`} />
              {aiConnected ? "AI Live" : "Connect AI"}
            </button>
            {session ? (
              <button onClick={() => navigate("/profile")} className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 py-1.5 pl-1.5 pr-3 text-xs font-medium text-white transition hover:border-brand-400/40 hover:bg-white/10" title="Your profile">
                {session.photo ? (
                  <img src={session.photo} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-brand-500 to-cyber-500 text-[11px] font-bold">{session.name.charAt(0).toUpperCase()}</span>
                )}
                <span className="max-w-[80px] truncate">{session.name.split(" ")[0]}</span>
              </button>
            ) : (
              <Link to="/auth" className="rounded-full px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white">
                Sign in
              </Link>
            )}
            <MagneticButton
              onClick={() => (window.location.hash = "/builder")}
              className="btn-glow rounded-full px-5 py-2.5 text-sm font-semibold text-white"
            >
              Launch App · Free
            </MagneticButton>
          </div>

          <button
            className="grid h-10 w-10 place-items-center rounded-xl bg-white/5 text-white md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </motion.nav>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 flex flex-col bg-ink-950/95 px-6 pb-10 pt-24 backdrop-blur-xl md:hidden"
          >
            {[
              ...LINKS,
              ...(session ? [{ to: "/profile", label: "Profile" }] : [{ to: "/auth", label: "Sign in" }]),
            ].map((l, i) => (
              <motion.div
                key={l.to}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block border-b border-white/5 py-4 font-display text-2xl font-semibold text-white"
                >
                  {l.label}
                </Link>
              </motion.div>
            ))}
            {session && (
              <button
                onClick={signOut}
                className="mt-4 flex items-center gap-2 text-base font-medium text-red-300"
              >
                <LogOut className="h-4 w-4" /> Sign out
              </button>
            )}
            <MagneticButton
              onClick={() => { setOpen(false); window.location.hash = "/builder"; }}
              className="btn-glow mt-6 rounded-full px-6 py-3.5 text-base font-semibold text-white"
            >
              Launch App · Free
            </MagneticButton>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {aiPanel && <AIConnection onClose={() => { setAiPanel(false); setAiConnected(hasAI()); }} />}
      </AnimatePresence>
    </>
  );
}
