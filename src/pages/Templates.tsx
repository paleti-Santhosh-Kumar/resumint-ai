import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, Search, Sparkles, ArrowRight, ImageIcon, Loader2 } from "lucide-react";
import { useRouter } from "../lib/router";
import { useStore, DEFAULT_RESUME } from "../lib/store";
import {
  ALL_TEMPLATES, TEMPLATES, TEMPLATE_CATEGORIES, PHOTO_TABS, type Template,
} from "../data/content";
import ResumePreview from "../components/ResumePreview";
import { Reveal, SectionHeading, GlassCard, Spotlight } from "../components/ui";

const PAGE = 9; // full previews per page (keeps the gallery fast)

// A sample avatar so photo templates show their layout in the gallery.
const SAMPLE_PHOTO =
  "data:image/svg+xml," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%23a78bfa'/><stop offset='1' stop-color='%2322d3ee'/></linearGradient></defs><rect width='160' height='160' fill='url(%23g)'/><circle cx='80' cy='64' r='28' fill='rgba(255,255,255,0.92)'/><path d='M30 150c0-28 22-46 50-46s50 18 50 46z' fill='rgba(255,255,255,0.92)'/></svg>`
  );

const sampleData = (t: Template) =>
  t.photo ? { ...DEFAULT_RESUME, basics: { ...DEFAULT_RESUME.basics, photo: SAMPLE_PHOTO } } : DEFAULT_RESUME;

type PhotoMode = (typeof PHOTO_TABS)[number]["id"];

export default function Templates() {
  const [mode, setMode] = useState<PhotoMode>("all");
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [visible, setVisible] = useState(PAGE);
  const { setTemplate, setAccent, setFont } = useStore();
  const { navigate } = useRouter();

  const counts = useMemo(() => {
    const photo = ALL_TEMPLATES.filter((t) => t.photo).length;
    const noPhoto = ALL_TEMPLATES.length - photo;
    return { all: ALL_TEMPLATES.length, photo, "no-photo": noPhoto };
  }, []);

  const list = useMemo(() => {
    const ql = q.toLowerCase();
    return ALL_TEMPLATES.filter((t) => {
      const byMode =
        mode === "all" ? true : mode === "photo" ? !!t.photo : !t.photo;
      const byCat = cat === "All" || t.category === cat;
      const byQ = !ql || t.name.toLowerCase().includes(ql) || t.category.toLowerCase().includes(ql);
      return byMode && byCat && byQ;
    });
  }, [mode, cat, q]);

  const shown = list.slice(0, visible);

  // Reset pagination whenever the filter changes.
  const changeMode = (m: PhotoMode) => { setMode(m); setVisible(PAGE); };
  const changeCat = (c: string) => { setCat(c); setVisible(PAGE); };

  const use = (t: Template) => {
    setTemplate(t.id);
    setAccent(t.accent);
    setFont(t.font ?? "Inter");
    navigate("/builder");
  };

  return (
    <div className="relative z-10 mx-auto max-w-7xl px-6 pb-24 pt-32">
      <SectionHeading
        eyebrow={`${ALL_TEMPLATES.length.toLocaleString()}+ templates`}
        title={<>Find your <span className="text-gradient">signature look.</span></>}
        subtitle={`Browse ${ALL_TEMPLATES.length.toLocaleString()}+ ATS-ready templates. Pick with or without a profile photo, preview live, and use it in one click.`}
      />

      {/* Photo division tabs */}
      <Reveal>
        <div className="mt-9 flex flex-wrap items-center justify-center gap-2">
          {PHOTO_TABS.map((tab) => {
            const count = counts[tab.id];
            const active = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => changeMode(tab.id)}
                className={`relative flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-semibold transition ${
                  active ? "border-brand-400/50 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                {active && <motion.span layoutId="photo-tab" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-brand-500/25 to-cyber-500/25" />}
                {tab.id === "photo" ? <ImageIcon className="h-4 w-4" /> : tab.id === "no-photo" ? <span className="h-4 w-4 rounded-full border-2 border-current" /> : <Sparkles className="h-4 w-4" />}
                {tab.label}
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${active ? "bg-white/15 text-white" : "bg-white/5 text-slate-500"}`}>{count.toLocaleString()}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Style + search row */}
      <Reveal>
        <div className="mt-5 flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex flex-wrap justify-center gap-2">
            {TEMPLATE_CATEGORIES.map((c) => (
              <button key={c} onClick={() => changeCat(c)}
                className={`rounded-full border px-3 py-1.5 text-xs font-medium transition ${cat === c ? "border-brand-400/50 bg-brand-500/15 text-white" : "border-white/10 bg-white/5 text-slate-400 hover:text-white"}`}>
                {c}
              </button>
            ))}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input value={q} onChange={(e) => { setQ(e.target.value); setVisible(PAGE); }} placeholder="Search templates…"
              className="w-full rounded-full border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-brand-400/60 focus:outline-none" />
          </div>
        </div>
      </Reveal>

      {/* AI generator banner */}
      <Reveal>
        <GlassCard className="mt-7 flex flex-col items-center justify-between gap-4 p-5 sm:flex-row">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-cyber-500"><Sparkles className="h-5 w-5 text-white" /></span>
            <div>
              <p className="text-sm font-semibold text-white">AI Template Generator</p>
              <p className="text-xs text-slate-400">Describe your vibe and get a custom design in seconds.</p>
            </div>
          </div>
          <button onClick={() => navigate("/tools")} className="flex items-center gap-1.5 rounded-full bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10">
            Try it <ArrowRight className="h-4 w-4" />
          </button>
        </GlassCard>
      </Reveal>

      {/* Grid */}
      <div className="mt-8 flex items-center justify-between px-1 text-xs text-slate-500">
        <span>Showing <span className="font-semibold text-slate-300">{shown.length}</span> of <span className="font-semibold text-slate-300">{list.length.toLocaleString()}</span></span>
        {mode !== "all" && <span className="rounded-full bg-white/5 px-2.5 py-1">{mode === "photo" ? "With profile photo" : "No profile photo"}</span>}
      </div>

      <motion.div layout className="mt-3 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {shown.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Spotlight>
                <GlassCard hover className="group overflow-hidden">
                  <div className="relative overflow-hidden rounded-t-3xl p-3" style={{ background: t.dark ? "#0b0d16" : undefined }}>
                    <div className="pointer-events-none transition duration-500 group-hover:scale-[1.03]">
                      <ResumePreview data={sampleData(t)} template={t.id} accent={t.accent} font={t.font ?? "Inter"} width={440} showPhoto={!!t.photo} />
                    </div>
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      {t.popular && <span className="rounded-full bg-gradient-to-r from-brand-500 to-cyber-500 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">Popular</span>}
                      {t.photo && <span className="flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-700"><ImageIcon className="h-2.5 w-2.5" /> Photo</span>}
                    </div>
                  </div>
                  <div className="flex items-center justify-between px-4 py-3.5">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{t.name}</p>
                      <p className="text-[11px] text-slate-500">{t.category}{t.dark ? " · Dark" : ""}{t.font ? ` · ${t.font}` : ""}</p>
                    </div>
                    <button onClick={() => use(t)} className="flex shrink-0 items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-brand-500/30">
                      <Check className="h-3.5 w-3.5" /> Use
                    </button>
                  </div>
                </GlassCard>
              </Spotlight>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Load more */}
      {visible < list.length && (
        <div className="mt-10 flex flex-col items-center gap-3">
          <button
            onClick={() => setVisible((v) => v + PAGE)}
            className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            <Loader2 className="h-4 w-4" /> Load more templates
          </button>
          <span className="text-xs text-slate-500">{list.length - visible} remaining</span>
        </div>
      )}

      {list.length === 0 && (
        <div className="mt-16 text-center text-slate-500">
          <Search className="mx-auto h-8 w-8 text-slate-600" />
          <p className="mt-3 text-sm">No templates match your filters. Try a different search.</p>
        </div>
      )}

      {/* Featured curated strip */}
      <div className="mt-16">
        <h3 className="mb-4 text-center font-display text-lg font-semibold text-white">Featured designs</h3>
        <div className="flex flex-wrap justify-center gap-2">
          {TEMPLATES.filter((t) => t.popular).map((t) => (
            <button key={t.id} onClick={() => use(t)}
              className="rounded-full border border-white/10 bg-white/5 px-3.5 py-1.5 text-xs font-medium text-slate-300 transition hover:border-brand-400/40 hover:text-white">
              {t.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
