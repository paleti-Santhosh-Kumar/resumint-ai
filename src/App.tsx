import { useEffect, type ComponentType } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Lock, ArrowRight, ShieldCheck } from "lucide-react";
import { RouterProvider, useRouter } from "./lib/router";
import { UserProvider, useUser } from "./lib/user";
import { StoreProvider } from "./lib/store";
import { ToastProvider } from "./components/Toast";
import { setReturnTo } from "./lib/accounts";
import Background from "./components/Background";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import ChatAssistant from "./components/ChatAssistant";
import Landing from "./pages/Landing";
import AITools from "./pages/AITools";
import Templates from "./pages/Templates";
import ResumeBuilder from "./pages/ResumeBuilder";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Auth from "./pages/Auth";

const ROUTES: Record<string, ComponentType> = {
  "/": Landing,
  "/tools": AITools,
  "/templates": Templates,
  "/builder": ResumeBuilder,
  "/dashboard": Dashboard,
  "/profile": Profile,
  "/auth": Auth,
};

// Routes that require a signed-in user (valid credentials) to access.
const PROTECTED = ["/tools", "/builder", "/dashboard", "/profile"];

function Shell() {
  const { path } = useRouter();
  const { session } = useUser();

  const isProtected = PROTECTED.includes(path);

  // ── Remember where the user was heading, so re-login returns them there.
  useEffect(() => {
    if (isProtected && !session) setReturnTo(path);
  }, [isProtected, session, path]);

  // ── Auth gate: protected routes need a valid login.
  const showGate = isProtected && !session;

  const Page = ROUTES[path] ?? Landing;
  const minimal = path === "/builder" || path === "/auth" || showGate;

  return (
    <div className="noise relative min-h-screen">
      <Background />
      {!minimal && <Navbar />}
      <AnimatePresence mode="wait">
        <motion.main
          key={showGate ? "gate" : path}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
        >
          {showGate ? <SignInGate /> : <Page />}
        </motion.main>
      </AnimatePresence>
      {!minimal && <Footer />}
      {!showGate && path !== "/builder" && <ChatAssistant />}
    </div>
  );
}

/** Shown when a logged-out user tries to access a protected area. */
function SignInGate() {
  const { navigate } = useRouter();
  return (
    <div className="relative z-10 flex min-h-[80vh] items-center justify-center px-6 pt-24 pb-16">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="glass-strong w-full max-w-md rounded-3xl p-8 text-center"
      >
        <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-brand-500 to-cyber-500 shadow-lg shadow-brand-500/30">
          <Lock className="h-7 w-7 text-white" />
        </span>
        <h1 className="mt-5 font-display text-2xl font-bold text-white">Sign in to continue</h1>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-slate-400">
          This area is for registered users. Sign in with your credentials to explore every AI tool, the resume builder, and your dashboard.
        </p>
        <button
          onClick={() => navigate("/auth")}
          className="btn-glow mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white"
        >
          Sign in or create account <ArrowRight className="h-4 w-4" />
        </button>
        <button onClick={() => navigate("/")} className="mt-3 text-xs text-slate-500 hover:text-white">
          Back to home
        </button>
        <div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-slate-500">
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> PBKDF2 hashed</span>
          <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Stays signed in</span>
        </div>
      </motion.div>
    </div>
  );
}

export default function App() {
  return (
    <RouterProvider>
      <UserProvider>
        <StoreProvider>
          <ToastProvider>
            <Shell />
          </ToastProvider>
        </StoreProvider>
      </UserProvider>
    </RouterProvider>
  );
}
