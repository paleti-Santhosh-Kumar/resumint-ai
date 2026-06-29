import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

export const EASE: [number, number, number, number] = [0.16, 1, 0.3, 1];

export function Reveal({
  children, delay = 0, y = 28, className,
}: { children: ReactNode; delay?: number; y?: number; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-70px" }}
      transition={{ duration: 0.75, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export const staggerParent: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
export const staggerChild: Variants = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
};

export function SectionHeading({
  eyebrow, title, subtitle, center = true,
}: { eyebrow?: string; title: ReactNode; subtitle?: string; center?: boolean }) {
  return (
    <div className={center ? "mx-auto max-w-3xl text-center" : "max-w-3xl"}>
      {eyebrow && (
        <Reveal>
          <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.2em] text-brand-200">
            <span className="h-1.5 w-1.5 rounded-full bg-cyber-400 shadow-[0_0_10px_#22d3ee]" />
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={0.05}>
        <h2 className="mt-5 font-display text-3xl font-semibold leading-[1.1] tracking-tight text-white sm:text-4xl md:text-5xl">
          {title}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={0.1}>
          <p className="mt-4 text-base leading-relaxed text-slate-400 sm:text-lg">{subtitle}</p>
        </Reveal>
      )}
    </div>
  );
}

export function GlassCard({
  children, className, hover = false, glow = false,
}: { children: ReactNode; className?: string; hover?: boolean; glow?: boolean }) {
  return (
    <div
      className={[
        "rounded-3xl",
        hover ? "glass card-hover" : "glass",
        glow ? "ring-glow" : "",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </span>
  );
}

/** Spotlight wrapper — tracks the mouse for a reactive glow. */
export function Spotlight({
  children, className,
}: { children: ReactNode; className?: string }) {
  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - r.top}px`);
  };
  return (
    <div className={["spotlight", className ?? ""].join(" ")} onMouseMove={onMove}>
      {children}
    </div>
  );
}
