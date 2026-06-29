import { useLayoutEffect, useRef, useState } from "react";
import type { ResumeData } from "../lib/ai";

const FONT_STACK: Record<string, string> = {
  Inter: '"Inter", system-ui, sans-serif',
  Sora: '"Sora", system-ui, sans-serif',
  Poppins: '"Poppins", system-ui, sans-serif',
  Georgia: 'Georgia, "Times New Roman", serif',
  Merriweather: 'Georgia, "Times New Roman", serif',
  "JetBrains Mono": '"JetBrains Mono", ui-monospace, monospace',
};

type Layout = "band" | "clean" | "classic" | "sidebar" | "dark";
type Path = (string | number)[];

const TEMPLATE_LAYOUT: Record<string, Layout> = {
  aurora: "band", emerald: "band", corporate: "band", cobalt: "band", pulse: "band", mosaic: "band",
  minimal: "clean", soft: "clean", "ats-safe": "clean", aria: "clean", sage: "clean",
  onyx: "classic", vanguard: "classic", harbor: "classic", ivory: "classic",
  creative: "sidebar", neon: "sidebar", designer: "sidebar", polaroid: "sidebar", bloom: "sidebar",
  dev: "dark", midnight: "dark", royal: "dark", blueprint: "dark", graphite: "dark",
};

/** Curated ids first; generated ids encode their layout family as a prefix. */
const getLayout = (id: string): Layout => {
  if (TEMPLATE_LAYOUT[id]) return TEMPLATE_LAYOUT[id];
  if (id.startsWith("sidebar-")) return "sidebar";
  if (id.startsWith("classic-")) return "classic";
  if (id.startsWith("clean-")) return "clean";
  if (id.startsWith("dark-")) return "dark";
  if (id.startsWith("band-")) return "band";
  return "band";
};

/* ───────────── Inline editable text ───────────── */
function EditableText({
  value, onCommit, className, style, block,
}: {
  value: string;
  onCommit: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  block?: boolean;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  // useLayoutEffect: set text before paint to avoid a flash of empty content,
  // and re-sync when the value changes externally (only while not focused).
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.textContent !== value) {
      el.textContent = value ?? "";
    }
  }, [value]);
  return (
    <span
      ref={ref}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      onBlur={(e) => {
        const t = (e.currentTarget.textContent ?? "").replace(/[ \t]+$/g, "");
        if (t !== value) onCommit(t);
      }}
      onKeyDown={(e) => {
        if (!block && e.key === "Enter") { e.preventDefault(); e.currentTarget.blur(); }
      }}
      className={`cursor-text outline-none transition-colors hover:bg-black/[0.04] focus:bg-amber-100/70 focus:ring-2 focus:ring-amber-300 rounded-[3px] ${block ? "block w-full whitespace-pre-wrap" : ""} ${className ?? ""}`}
      style={style}
    />
  );
}

/** Text renderer — editable when an onCommit handler is supplied, plain otherwise. */
function T({
  value, editable, onCommit, className, style, block,
}: {
  value: string;
  editable?: boolean;
  onCommit?: (v: string) => void;
  className?: string;
  style?: React.CSSProperties;
  block?: boolean;
}) {
  if (editable && onCommit) return <EditableText value={value} onCommit={onCommit} className={className} style={style} block={block} />;
  return <span className={className} style={style}>{value}</span>;
}

function Photo({ src, size, ring = "rgba(255,255,255,0.4)" }: { src: string; size: number; ring?: string }) {
  return (
    <img
      src={src}
      alt="Profile"
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size, boxShadow: `0 0 0 3px ${ring}` }}
      draggable={false}
    />
  );
}

function SectionTitle({ children, accent }: { children: string; accent: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-2">
      <span className="h-3 w-1 rounded-full" style={{ background: accent }} />
      <h3 className="text-[12px] font-bold uppercase tracking-[0.14em] text-slate-800">{children}</h3>
    </div>
  );
}

type Editable = { editable?: boolean; onEdit?: (path: Path, value: string) => void };

function Paper({
  data, template, accent, font, showPhoto, editable, onEdit,
}: {
  data: ResumeData; template: string; accent: string; font: string; showPhoto?: boolean; editable?: boolean; onEdit?: (path: Path, value: string) => void;
}) {
  const layout = getLayout(template);
  const fam = FONT_STACK[font] ?? FONT_STACK.Inter;
  const b = data.basics;
  const ink = "#1a1a2e";
  const photo = showPhoto && b.photo ? b.photo : "";
  const e: Editable = { editable, onEdit };
  const c = (path: Path) => (v: string) => onEdit?.(path, v);

  // ── DARK / DEV layout
  if (layout === "dark") {
    return (
      <div style={{ fontFamily: fam, background: "#0b0d16", color: "#e7e9f3", padding: 28 }} className="resume-paper min-h-[440px]">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-3">
            {photo && <Photo src={photo} size={44} ring="rgba(139,92,255,0.5)" />}
            <div>
              <div className="font-mono text-2xl font-bold" style={{ color: accent }}>
                <T value={b.name || "Your Name"} {...e} onCommit={c(["basics", "name"])} />
              </div>
              <div className="text-[12px] text-slate-400"><T value={b.title} {...e} onCommit={c(["basics", "title"])} /></div>
            </div>
          </div>
          <code className="hidden text-[9px] text-emerald-400 sm:block">~/resume$ build --optimized</code>
        </div>
        <ContactRow data={data} {...e} onEdit={onEdit} className="mt-2 text-[9.5px] text-slate-400" />
        <Body data={data} accent={accent} dark {...e} onEdit={onEdit} />
      </div>
    );
  }

  // ── SIDEBAR / CREATIVE layout
  if (layout === "sidebar") {
    return (
      <div style={{ fontFamily: fam, background: "#fff", color: ink }} className="resume-paper flex min-h-[440px] overflow-hidden">
        <aside style={{ background: accent }} className="w-[36%] p-5 text-white">
          {photo && <div className="mb-3 flex justify-center"><Photo src={photo} size={72} /></div>}
          <div className="text-xl font-bold leading-tight"><T value={b.name || "Your Name"} {...e} onCommit={c(["basics", "name"])} /></div>
          <div className="text-[11px] text-white/80"><T value={b.title} {...e} onCommit={c(["basics", "title"])} /></div>
          <ContactList data={data} {...e} onEdit={onEdit} className="mt-3 space-y-0.5 text-[9px] text-white/90" />
          {data.skills.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-[11px] font-bold uppercase tracking-wider">Skills</h3>
              <div className="space-y-1.5">
                {data.skills.map((s, i) => (
                  <EditableSkill key={i} name={s.name} level={s.level} accent={accent} onEdit={onEdit ? (v) => onEdit(["skills", i, "name"], v) : undefined} />
                ))}
              </div>
            </div>
          )}
        </aside>
        <main className="flex-1 p-5">
          {b.summary && <div className="text-[10.5px] leading-snug text-slate-600"><T value={b.summary} {...e} onCommit={c(["basics", "summary"])} block /></div>}
          <div className="mt-3"><SectionTitle accent={accent}>Experience</SectionTitle>
            {data.experience.map((exp, i) => <EditableExp key={i} exp={exp} idx={i} {...e} onEdit={onEdit} sidebar />)}
          </div>
          <div className="mt-3"><SectionTitle accent={accent}>Education</SectionTitle>
            {data.education.map((ed, i) => (
              <p key={i} className="text-[10.5px]">
                <T value={ed.degree} {...e} onCommit={c(["education", i, "degree"])} className="font-semibold text-slate-800" />
                <span className="text-slate-500"> · </span>
                <T value={ed.school} {...e} onCommit={c(["education", i, "school"])} />
              </p>
            ))}
          </div>
        </main>
      </div>
    );
  }

  // ── CLASSIC / EXECUTIVE layout
  if (layout === "classic") {
    return (
      <div style={{ fontFamily: "Georgia, serif", background: "#fff", color: ink, padding: 32 }} className="resume-paper min-h-[440px] text-center">
        {photo && <div className="mb-3 flex justify-center"><Photo src={photo} size={84} ring={accent} /></div>}
        <div className="text-3xl font-bold tracking-wide"><T value={b.name || "Your Name"} {...e} onCommit={c(["basics", "name"])} /></div>
        <div className="mt-1 text-[13px] uppercase tracking-[0.3em] text-slate-500"><T value={b.title} {...e} onCommit={c(["basics", "title"])} /></div>
        <ContactRow data={data} {...e} onEdit={onEdit} className="mx-auto mt-2 flex flex-wrap justify-center gap-x-3 text-[10px] text-slate-500" />
        <div className="mx-auto my-3 h-px w-full" style={{ background: accent, opacity: 0.5 }} />
        <div className="text-left">
          {b.summary && (
            <section className="mb-4">
              <h3 className="mb-1 text-center text-[12px] font-bold uppercase tracking-[0.2em]">Profile</h3>
              <div className="text-[11px] italic leading-snug text-slate-600"><T value={b.summary} {...e} onCommit={c(["basics", "summary"])} block /></div>
            </section>
          )}
          <h3 className="mb-1 text-center text-[12px] font-bold uppercase tracking-[0.2em]">Experience</h3>
          {data.experience.map((exp, i) => (
            <div key={i} className="mb-3">
              <div className="flex justify-between">
                <span className="text-[12px] font-bold"><T value={exp.company} {...e} onCommit={c(["experience", i, "company"])} /></span>
                <span className="text-[10px] text-slate-500">
                  <T value={exp.start} {...e} onCommit={c(["experience", i, "start"])} /> — <T value={exp.end} {...e} onCommit={c(["experience", i, "end"])} />
                </span>
              </div>
              <span className="text-[11px] text-slate-700"><T value={exp.role} {...e} onCommit={c(["experience", i, "role"])} /></span>
              <Bullets exp={exp} idx={i} {...e} onEdit={onEdit} />
            </div>
          ))}
          <h3 className="mb-1 mt-3 text-center text-[12px] font-bold uppercase tracking-[0.2em]">Education</h3>
          {data.education.map((ed, i) => (
            <p key={i} className="text-[11px]">
              <T value={ed.degree} {...e} onCommit={c(["education", i, "degree"])} />
              <span className="text-slate-500">, </span>
              <T value={ed.school} {...e} onCommit={c(["education", i, "school"])} />
            </p>
          ))}
        </div>
      </div>
    );
  }

  // ── BAND (modern) layout
  if (layout === "band") {
    return (
      <div style={{ fontFamily: fam, background: "#fff", color: ink }} className="resume-paper min-h-[440px]">
        <header style={{ background: `linear-gradient(120deg, ${accent}, ${accent}cc)` }} className="px-7 py-6 text-white">
          <div className="flex items-center gap-4">
            {photo && <Photo src={photo} size={64} />}
            <div className="min-w-0">
              <div className="text-[26px] font-bold leading-tight"><T value={b.name || "Your Name"} {...e} onCommit={c(["basics", "name"])} /></div>
              <div className="text-[13px] text-white/85"><T value={b.title} {...e} onCommit={c(["basics", "title"])} /></div>
            </div>
          </div>
          <ContactRow data={data} {...e} onEdit={onEdit} className="mt-2 flex flex-wrap gap-x-3 text-[10px] text-white/90" />
        </header>
        <div className="p-7"><Body data={data} accent={accent} {...e} onEdit={onEdit} /></div>
      </div>
    );
  }

  // ── CLEAN / ATS / MINIMAL layout
  return (
    <div style={{ fontFamily: fam, background: "#fff", color: ink, padding: 30 }} className="resume-paper min-h-[440px]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="text-[26px] font-bold tracking-tight"><T value={b.name || "Your Name"} {...e} onCommit={c(["basics", "name"])} /></div>
          <div className="text-[13px] font-medium" style={{ color: accent }}><T value={b.title} {...e} onCommit={c(["basics", "title"])} /></div>
        </div>
        {photo && <Photo src={photo} size={58} ring="#e2e8f0" />}
      </div>
      <ContactRow data={data} {...e} onEdit={onEdit} className="mt-1.5 flex flex-wrap gap-x-3 text-[10px] text-slate-500" />
      <div className="my-3 h-px w-full bg-slate-200" />
      <Body data={data} accent={accent} minimal {...e} onEdit={onEdit} />
    </div>
  );
}

/* ───────────── Contact (editable per field) ───────────── */
function ContactRow({ data, editable, onEdit, className }: Editable & { data: ResumeData; className: string }) {
  const b = data.basics;
  const c = (path: Path) => (v: string) => onEdit?.(path, v);
  const items: [string, string, (v: string) => void][] = [
    [b.email, "✉", c(["basics", "email"])],
    [b.phone, "☎", c(["basics", "phone"])],
    [b.location, "📍", c(["basics", "location"])],
    [b.linkedin, "in", c(["basics", "linkedin"])],
    [b.github, "GH", c(["basics", "github"])],
    [b.website, "🔗", c(["basics", "website"])],
  ];
  return (
    <div className={className}>
      {items.filter(([v]) => v).map(([v, _icon, commit], i) => (
        <span key={i}><T value={v} editable={editable} onCommit={commit} />{i < items.filter(([x]) => x).length - 1 ? " · " : ""}</span>
      ))}
    </div>
  );
}

function ContactList({ data, editable, onEdit, className }: Editable & { data: ResumeData; className: string }) {
  const b = data.basics;
  const c = (path: Path) => (v: string) => onEdit?.(path, v);
  const items: [string, (v: string) => void][] = [
    [b.email, c(["basics", "email"])],
    [b.phone, c(["basics", "phone"])],
    [b.location, c(["basics", "location"])],
    [b.linkedin, c(["basics", "linkedin"])],
    [b.github, c(["basics", "github"])],
    [b.website, c(["basics", "website"])],
  ];
  return (
    <div className={className}>
      {items.filter(([v]) => v).map(([v, commit], i) => (
        <p key={i} className="break-words"><T value={v} editable={editable} onCommit={commit} /></p>
      ))}
    </div>
  );
}

/* ───────────── Body (summary/exp/edu/skills/projects) ───────────── */
function Body({
  data, accent, dark = false, minimal = false, editable, onEdit,
}: Editable & { data: ResumeData; accent: string; dark?: boolean; minimal?: boolean }) {
  const b = data.basics;
  const muted = dark ? "#9aa0b5" : "#5a5a6e";
  const text = dark ? "#e7e9f3" : "#3a3a4e";
  const c = (path: Path) => (v: string) => onEdit?.(path, v);
  const Title = ({ children }: { children: string }) =>
    minimal ? (
      <h3 className="mb-1.5 border-b border-slate-200 pb-0.5 text-[12px] font-bold uppercase tracking-[0.16em]" style={{ color: dark ? "#fff" : accent }}>{children}</h3>
    ) : (
      <SectionTitle accent={accent}>{children}</SectionTitle>
    );

  return (
    <div style={{ color: text }}>
      {b.summary && (
        <section className="mb-4">
          <Title>Summary</Title>
          <div className="text-[11px] leading-snug" style={{ color: muted }}><T value={b.summary} editable={editable} onCommit={c(["basics", "summary"])} block /></div>
        </section>
      )}
      {data.experience.length > 0 && (
        <section className="mb-4">
          <Title>Experience</Title>
            {data.experience.map((exp, i) => <EditableExp key={i} exp={exp} idx={i} editable={editable} onEdit={onEdit} dark={dark} />)}
        </section>
      )}
      <div className="grid grid-cols-2 gap-4">
        {data.education.length > 0 && (
          <section>
            <Title>Education</Title>
            {data.education.map((ed, i) => (
              <div key={i} className="mb-1">
                <div className="text-[11px] font-semibold" style={{ color: dark ? "#fff" : "#1a1a2e" }}><T value={ed.degree} editable={editable} onCommit={c(["education", i, "degree"])} /></div>
                <div className="text-[10px]" style={{ color: muted }}>
                  <T value={ed.school} editable={editable} onCommit={c(["education", i, "school"])} /> · <T value={ed.start} editable={editable} onCommit={c(["education", i, "start"])} />–<T value={ed.end} editable={editable} onCommit={c(["education", i, "end"])} />
                </div>
              </div>
            ))}
          </section>
        )}
        {data.skills.length > 0 && (
          <section>
            <Title>Skills</Title>
            <div className="flex flex-wrap gap-1">
              {data.skills.map((s, i) => (
                <span key={i} className="rounded px-1.5 py-0.5 text-[9.5px] font-medium" style={{ background: `${accent}1a`, color: dark ? "#cbd0e0" : accent }}>
                  <T value={s.name} editable={editable} onCommit={c(["skills", i, "name"])} />
                </span>
              ))}
            </div>
          </section>
        )}
      </div>
      {data.projects.length > 0 && (
        <section className="mt-4">
          <Title>Projects</Title>
          {data.projects.map((p, i) => (
            <p key={i} className="text-[10.5px]" style={{ color: muted }}>
              <span className="font-semibold" style={{ color: dark ? "#fff" : "#1a1a2e" }}><T value={p.name} editable={editable} onCommit={c(["projects", i, "name"])} /></span> — <T value={p.description} editable={editable} onCommit={c(["projects", i, "description"])} />
            </p>
          ))}
        </section>
      )}
    </div>
  );
}

/* ───────────── Editable experience entry ───────────── */
function EditableExp({
  exp, idx, dark = false, sidebar = false, editable, onEdit,
}: Editable & { exp: ResumeData["experience"][number]; idx: number; dark?: boolean; sidebar?: boolean }) {
  const c = (path: Path) => (v: string) => onEdit?.(["experience", idx, ...path], v);
  const muted = dark ? "#9aa0b5" : "#5a5a6e";
  return (
    <div className="mb-2.5">
      <div className={sidebar ? "" : "flex items-baseline justify-between"}>
        <div className="text-[12px] font-bold" style={{ color: dark ? "#fff" : "#1a1a2e" }}>
          <T value={exp.role} editable={editable} onCommit={c(["role"])} /> <span className="font-medium opacity-70">· <T value={exp.company} editable={editable} onCommit={c(["company"])} /></span>
        </div>
        <div className="text-[9.5px]" style={{ color: muted }}>
          <T value={exp.start} editable={editable} onCommit={c(["start"])} /> — <T value={exp.end} editable={editable} onCommit={c(["end"])} />
        </div>
      </div>
      <Bullets exp={exp} idx={idx} editable={editable} onEdit={onEdit} />
    </div>
  );
}

function Bullets({ exp, idx, editable, onEdit }: Editable & { exp: ResumeData["experience"][number]; idx: number }) {
  if (!exp.bullets.length) return null;
  return (
    <ul className="mt-1 space-y-1">
      {exp.bullets.map((b, k) => (
        <li key={k} className="relative pl-3.5 text-[11px] leading-snug text-slate-600">
          <span className="absolute left-0 top-[5px] h-1 w-1 rounded-full bg-current opacity-50" />
          <T value={b} editable={editable} onCommit={onEdit ? (v) => onEdit(["experience", idx, "bullets", k], v) : undefined} block />
        </li>
      ))}
    </ul>
  );
}

function EditableSkill({ name, level, accent, onEdit }: { name: string; level: number; accent: string; onEdit?: (v: string) => void }) {
  return (
    <div>
      <div className="text-[9px] text-white/90"><T value={name} editable={!!onEdit} onCommit={onEdit} /></div>
      <div className="mt-0.5 h-1 rounded-full bg-white/25"><div className="h-1 rounded-full bg-white" style={{ width: `${level}%`, background: accent }} /></div>
    </div>
  );
}

export default function ResumePreview({
  data, template, accent, font, width = 560, className, showPhoto, editable, onEdit,
}: {
  data: ResumeData;
  template: string;
  accent: string;
  font: string;
  width?: number;
  className?: string;
  showPhoto?: boolean;
  editable?: boolean;
  onEdit?: (path: Path, value: string) => void;
}) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [h, setH] = useState<number | undefined>(undefined);

  useLayoutEffect(() => {
    const wrap = wrapRef.current;
    const inner = innerRef.current;
    if (!wrap || !inner) return;
    const update = () => {
      const w = wrap.clientWidth;
      if (w <= 0) return;
      const s = w / width;
      setScale(s);
      setH(inner.offsetHeight * s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(wrap);
    ro.observe(inner);
    return () => ro.disconnect();
  }, [width, data, template, accent, font, showPhoto, editable]);

  return (
    <div ref={wrapRef} className={className} style={{ height: h }}>
      <div ref={innerRef} style={{ width, transform: `scale(${scale})`, transformOrigin: "top left" }}>
        <Paper data={data} template={template} accent={accent} font={font} showPhoto={showPhoto} editable={editable} onEdit={onEdit} />
      </div>
    </div>
  );
}
