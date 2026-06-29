import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { ResumeData } from "./ai";
import { useUser } from "./user";
import { storageKeyFor, loadScoped, saveScoped, type Persisted } from "./accounts";

export const DEFAULT_RESUME: ResumeData = {
  basics: {
    name: "Avery Mitchell",
    title: "Senior Product Engineer",
    email: "avery.mitchell@email.com",
    phone: "+1 (415) 555-0192",
    location: "San Francisco, CA",
    website: "avery.dev",
    linkedin: "linkedin.com/in/averym",
    github: "github.com/averym",
    summary:
      "Senior Product Engineer with 7+ years building delightful, high-scale consumer products. I turn ambiguous problems into shipped outcomes and have led teams that improved activation by 38% and cut latency by half.",
    photo: "",
  },
  experience: [
    {
      role: "Senior Product Engineer",
      company: "Nebula Labs",
      start: "2021",
      end: "Present",
      bullets: [
        "Led the rebuild of the onboarding flow, increasing activation by 38% and reducing time-to-value by 4 days.",
        "Architected a real-time collaboration engine handling 50k concurrent users with sub-100ms latency.",
        "Mentored 5 engineers and established the design-system that cut feature delivery time by 30%.",
      ],
    },
    {
      role: "Full-Stack Engineer",
      company: "Lumen Commerce",
      start: "2018",
      end: "2021",
      bullets: [
        "Shipped a payments platform processing $12M ARR with 99.98% uptime.",
        "Reduced API p95 latency by 52% through caching and query optimization.",
      ],
    },
  ],
  education: [
    { degree: "B.S. Computer Science", school: "University of California, Berkeley", start: "2014", end: "2018" },
  ],
  skills: [
    { name: "TypeScript", level: 95 },
    { name: "React", level: 94 },
    { name: "Node.js", level: 88 },
    { name: "System Design", level: 85 },
    { name: "GraphQL", level: 80 },
    { name: "AWS", level: 78 },
  ],
  projects: [
    { name: "Orbit UI", description: "Open-source component library with 4.2k GitHub stars.", link: "github.com/averym/orbit" },
    { name: "Pulse Analytics", description: "Real-time dashboard processing 1M events/min.", link: "pulse.avery.dev" },
  ],
};

type StoreValue = {
  data: ResumeData;
  template: string;
  accent: string;
  font: string;
  setTemplate: (t: string) => void;
  setAccent: (a: string) => void;
  setFont: (f: string) => void;
  update: (updater: (prev: ResumeData) => ResumeData) => void;
  replace: (next: ResumeData) => void;
  reset: () => void;
  clearAll: () => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  savedAt: number | null;
};

const StoreContext = createContext<StoreValue | null>(null);

const DEFAULTS: Persisted = { data: DEFAULT_RESUME, template: "aurora", accent: "#7c3aed", font: "Inter" };

export function StoreProvider({ children }: { children: ReactNode }) {
  const { session } = useUser();
  const scope = session?.email ?? null; // null = anonymous/guest
  const storageKey = storageKeyFor(scope);

  const initial = useRef<Persisted>(loadScoped(storageKey) ?? DEFAULTS);
  const [data, setData] = useState<ResumeData>(initial.current.data);
  const [template, setTemplate] = useState(initial.current.template);
  const [accent, setAccent] = useState(initial.current.accent);
  const [font, setFont] = useState(initial.current.font);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const past = useRef<ResumeData[]>([]);
  const future = useRef<ResumeData[]>([]);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  // When the signed-in user changes (login/logout), load that user's resume.
  const scopeRef = useRef(scope);
  useEffect(() => {
    if (scopeRef.current === scope) return;
    scopeRef.current = scope;
    const key = storageKeyFor(scope);
    const loaded = loadScoped(key) ?? DEFAULTS;
    setData(loaded.data);
    setTemplate(loaded.template);
    setAccent(loaded.accent);
    setFont(loaded.font);
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [scope]);

  const update = useCallback((updater: (prev: ResumeData) => ResumeData) => {
    setData((prev) => {
      const next = updater(prev);
      past.current.push(prev);
      if (past.current.length > 60) past.current.shift();
      future.current = [];
      setCanUndo(true);
      setCanRedo(false);
      return next;
    });
  }, []);

  const replace = useCallback((next: ResumeData) => update(() => next), [update]);

  const reset = useCallback(() => update(() => DEFAULT_RESUME), [update]);

  /** Clears the current user's resume + session (scope-aware). */
  const clearAll = useCallback(() => {
    try { localStorage.removeItem(storageKey); } catch { /* ignore */ }
    ["resumint.session", "resumint.otp"].forEach((k) => {
      try { localStorage.removeItem(k); } catch { /* ignore */ }
      try { sessionStorage.removeItem(k); } catch { /* ignore */ }
    });
    setData(DEFAULT_RESUME);
    setTemplate("aurora");
    setAccent("#7c3aed");
    setFont("Inter");
    past.current = [];
    future.current = [];
    setCanUndo(false);
    setCanRedo(false);
  }, [storageKey]);

  const undo = useCallback(() => {
    setData((prev) => {
      const last = past.current.pop();
      if (!last) return prev;
      future.current.push(prev);
      setCanUndo(past.current.length > 0);
      setCanRedo(true);
      return last;
    });
  }, []);

  const redo = useCallback(() => {
    setData((prev) => {
      const next = future.current.pop();
      if (!next) return prev;
      past.current.push(prev);
      setCanUndo(true);
      setCanRedo(future.current.length > 0);
      return next;
    });
  }, []);

  // Autosave (debounced) to the current user's namespace
  useEffect(() => {
    const id = setTimeout(() => {
      saveScoped(storageKey, { data, template, accent, font });
      setSavedAt(Date.now());
    }, 500);
    return () => clearTimeout(id);
  }, [data, template, accent, font, storageKey]);

  return (
    <StoreContext.Provider
      value={{
        data, template, accent, font, setTemplate, setAccent, setFont,
        update, replace, reset, clearAll, undo, redo, canUndo, canRedo, savedAt,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
