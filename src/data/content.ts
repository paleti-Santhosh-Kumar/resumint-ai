import type { LucideIcon } from "lucide-react";
import {
  Sparkles, FileText, Wand2, Gauge, Target, Mail, Share2, Globe,
  Brain, MessageSquare, Mic, Languages, DollarSign, Map, GitBranch,
  Trophy, Star, Send, Users, BarChart3, Shield, Zap, Bot, Award,
  ScanLine, BookOpen, Briefcase, Palette, FileSearch, AlignLeft,
} from "lucide-react";

export type Feature = { icon: LucideIcon; title: string; desc: string; tag: string };

export const AI_FEATURES: Feature[] = [
  { icon: FileText, title: "AI Resume Writer", desc: "Generate complete, role-optimized resume sections from a few prompts.", tag: "Create" },
  { icon: Wand2, title: "AI Resume Rewriter", desc: "Rewrite any bullet or paragraph into crisp, recruiter-ready copy.", tag: "Refine" },
  { icon: Sparkles, title: "AI Resume Improver", desc: "Inject power verbs and metrics to 10× your impact statements.", tag: "Refine" },
  { icon: Gauge, title: "AI ATS Score Checker", desc: "Live, real-time ATS scoring with an exact breakdown of every factor.", tag: "Analyze" },
  { icon: Target, title: "AI ATS Optimizer", desc: "Auto-tailor your resume to beat a specific job's filters.", tag: "Analyze" },
  { icon: ScanLine, title: "AI Resume Tailoring", desc: "Match keywords and tone to any job description instantly.", tag: "Analyze" },
  { icon: Mail, title: "AI Cover Letter", desc: "Personalized, recruiter-ready cover letters in one click.", tag: "Create" },
  { icon: Share2, title: "AI LinkedIn Optimizer", desc: "Rewrite your headline, about, and experience for reach.", tag: "Create" },
  { icon: Globe, title: "AI Portfolio Generator", desc: "Turn your resume into a live, SEO-ready portfolio site.", tag: "Create" },
  { icon: Brain, title: "AI Career Coach", desc: "A 24/7 strategist for offers, raises, and pivots.", tag: "Coach" },
  { icon: MessageSquare, title: "AI Interview Coach", desc: "Practice with adaptive, role-specific question sets.", tag: "Coach" },
  { icon: Bot, title: "AI Mock Interview", desc: "Full simulations with STAR grading and instant feedback.", tag: "Coach" },
  { icon: Mic, title: "AI Speech Practice", desc: "Build confidence with timed verbal answer drills.", tag: "Coach" },
  { icon: AlignLeft, title: "AI Grammar Checker", desc: "Pixel-perfect grammar, tone, and clarity, everywhere.", tag: "Refine" },
  { icon: GitBranch, title: "AI Keyword Optimizer", desc: "Surface the exact keywords recruiters' systems reward.", tag: "Analyze" },
  { icon: DollarSign, title: "AI Salary Estimator", desc: "Researched low/mid/high bands by role and location.", tag: "Analyze" },
  { icon: Map, title: "AI Career Roadmap", desc: "A personalized 90-day plan to your next milestone.", tag: "Coach" },
  { icon: FileSearch, title: "AI Skill Gap Analysis", desc: "See the gap between you and your target role — closed.", tag: "Analyze" },
  { icon: Languages, title: "AI Resume Translator", desc: "Translate and localize for 30+ global markets.", tag: "Create" },
  { icon: BookOpen, title: "AI Project Generator", desc: "Generate portfolio projects that prove your skills.", tag: "Create" },
  { icon: Trophy, title: "AI Achievement Generator", desc: "Turn tasks into quantified, standout achievements.", tag: "Refine" },
  { icon: Star, title: "AI STAR Answer Generator", desc: "Structured behavioral answers for any question.", tag: "Coach" },
  { icon: Send, title: "AI Email Generator", desc: "Outreach, follow-ups, and thank-yous that get replies.", tag: "Create" },
  { icon: Users, title: "AI Recruiter Simulation", desc: "Negotiate and pitch against a simulated recruiter.", tag: "Coach" },
  { icon: BarChart3, title: "AI Job Match Score", desc: "Score how well a posting fits your profile.", tag: "Analyze" },
  { icon: Briefcase, title: "AI Job Recommendations", desc: "Roles ranked by fit, salary, and growth.", tag: "Coach" },
  { icon: Palette, title: "AI Personal Branding", desc: "Craft a consistent, magnetic professional identity.", tag: "Create" },
  { icon: Bot, title: "24/7 AI Chat Assistant", desc: "Your always-on career copilot, everywhere in the app.", tag: "Coach" },
];

export type Template = {
  id: string; name: string; category: string; accent: string;
  dark: boolean; photo?: boolean; font?: string; popular?: boolean; generated?: boolean;
};

/** Style categories (the "look"). Photo division is handled separately. */
export const TEMPLATE_CATEGORIES = ["All", "Modern", "Minimal", "Executive", "Creative", "ATS", "Developer", "Designer", "Dark"];

/** Primary photo division tabs. */
export const PHOTO_TABS = [
  { id: "all", label: "All Templates" },
  { id: "no-photo", label: "Without Photo" },
  { id: "photo", label: "With Photo" },
] as const;

/**
 * Curated, hand-crafted templates — used for the builder's quick picker,
 * the landing showcase, and the "Featured" row.
 */
export const TEMPLATES: Template[] = [
  { id: "aurora", name: "Aurora", category: "Modern", accent: "#7c3aed", dark: false, popular: true },
  { id: "onyx", name: "Onyx Executive", category: "Executive", accent: "#0f172a", dark: false, popular: true },
  { id: "minimal", name: "Pure Minimal", category: "Minimal", accent: "#0ea5e9", dark: false },
  { id: "creative", name: "Prism Creative", category: "Creative", accent: "#ec4899", dark: false, photo: true, popular: true },
  { id: "ats-safe", name: "ATS Crystal", category: "ATS", accent: "#16a34a", dark: false, popular: true },
  { id: "dev", name: "Terminal Dev", category: "Developer", accent: "#22d3ee", dark: true },
  { id: "designer", name: "Studio Designer", category: "Designer", accent: "#f59e0b", dark: false, photo: true },
  { id: "midnight", name: "Midnight Lux", category: "Dark", accent: "#8b5cf6", dark: true, photo: true, popular: true },
  { id: "corporate", name: "Corporate Blue", category: "Executive", accent: "#2563eb", dark: false },
  { id: "soft", name: "Soft Sand", category: "Minimal", accent: "#ca8a04", dark: false },
  { id: "emerald", name: "Emerald Pro", category: "Modern", accent: "#10b981", dark: false },
  { id: "neon", name: "Neon Pulse", category: "Creative", accent: "#d946ef", dark: true },
  { id: "mosaic", name: "Mosaic", category: "Modern", accent: "#7c3aed", dark: false, photo: true, popular: true },
  { id: "vanguard", name: "Vanguard", category: "Executive", accent: "#1e293b", dark: false, photo: true },
  { id: "polaroid", name: "Polaroid", category: "Creative", accent: "#ec4899", dark: false, photo: true },
  { id: "aria", name: "Aria", category: "Minimal", accent: "#8b5cf6", dark: false },
  { id: "cobalt", name: "Cobalt", category: "Modern", accent: "#1d4ed8", dark: false },
  { id: "sage", name: "Sage", category: "Minimal", accent: "#059669", dark: false },
  { id: "royal", name: "Royal Lux", category: "Dark", accent: "#9333ea", dark: true, photo: true },
  { id: "bloom", name: "Bloom", category: "Designer", accent: "#f59e0b", dark: false, photo: true },
  { id: "pulse", name: "Pulse", category: "Creative", accent: "#db2777", dark: false },
  { id: "harbor", name: "Harbor", category: "Executive", accent: "#0f766e", dark: false, photo: true },
  { id: "blueprint", name: "Blueprint", category: "Developer", accent: "#0ea5e9", dark: true },
  { id: "graphite", name: "Graphite", category: "Dark", accent: "#64748b", dark: true },
  { id: "ivory", name: "Ivory", category: "Executive", accent: "#a16207", dark: false, photo: true },
];

/* ───────────── Generated template catalog ─────────────
 * Combines 40 color palettes × 5 layouts × 3 font styles × 2 photo modes
 * = 1,200 generated templates (600 with photo, 600 without), each rendering
 * as a real, working resume. Layout is encoded in the id prefix and resolved
 * by ResumePreview. ─────────────────────────────────────────── */

const PALETTES: { name: string; accent: string }[] = [
  { name: "Aurora", accent: "#7c3aed" }, { name: "Cyber", accent: "#06b6d4" },
  { name: "Magenta", accent: "#ec4899" }, { name: "Emerald", accent: "#10b981" },
  { name: "Amber", accent: "#f59e0b" }, { name: "Ruby", accent: "#ef4444" },
  { name: "Royal", accent: "#2563eb" }, { name: "Onyx", accent: "#0f172a" },
  { name: "Coral", accent: "#fb7185" }, { name: "Lime", accent: "#84cc16" },
  { name: "Teal", accent: "#14b8a6" }, { name: "Indigo", accent: "#4f46e5" },
  { name: "Fuchsia", accent: "#d946ef" }, { name: "Sky", accent: "#0ea5e9" },
  { name: "Rose", accent: "#f43f5e" }, { name: "Orange", accent: "#f97316" },
  { name: "Violet", accent: "#8b5cf6" }, { name: "Slate", accent: "#64748b" },
  { name: "Forest", accent: "#059669" }, { name: "Ocean", accent: "#0284c7" },
  { name: "Plum", accent: "#9333ea" }, { name: "Mint", accent: "#34d399" },
  { name: "Gold", accent: "#eab308" }, { name: "Crimson", accent: "#dc2626" },
  { name: "Cobalt", accent: "#1d4ed8" }, { name: "Lavender", accent: "#a78bfa" },
  { name: "Bronze", accent: "#b45309" }, { name: "Jade", accent: "#16a34a" },
  { name: "Berry", accent: "#be185d" }, { name: "Turquoise", accent: "#2dd4bf" },
  { name: "Maroon", accent: "#7f1d1d" }, { name: "Navy", accent: "#1e3a8a" },
  { name: "Sand", accent: "#d97706" }, { name: "Grape", accent: "#7c2d92" },
  { name: "Steel", accent: "#475569" }, { name: "Pine", accent: "#15803d" },
  { name: "Sunset", accent: "#ea580c" }, { name: "Lagoon", accent: "#0891b2" },
  { name: "Amethyst", accent: "#7e22ce" }, { name: "Cherry", accent: "#be123c" },
];

const FONT_STYLES = [
  { key: "inter", suffix: "", font: "Inter" },
  { key: "serif", suffix: " Serif", font: "Georgia" },
  { key: "display", suffix: " Display", font: "Sora" },
];

const LAYOUT_META = [
  { family: "band", category: "Modern" },
  { family: "clean", category: "Minimal" },
  { family: "classic", category: "Executive" },
  { family: "sidebar", category: "Creative" },
  { family: "dark", category: "Dark" },
];

const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function buildGenerated(): Template[] {
  const out: Template[] = [];
  for (const L of LAYOUT_META) {
    for (const P of PALETTES) {
      for (const F of FONT_STYLES) {
        const base = `${L.family}-${slug(P.name)}-${F.key}`;
        const name = `${P.name} ${L.category}${F.suffix}`;
        out.push({ id: base, name, category: L.category, accent: P.accent, dark: L.family === "dark", photo: false, font: F.font, generated: true });
        out.push({ id: `${base}-p`, name, category: L.category, accent: P.accent, dark: L.family === "dark", photo: true, font: F.font, generated: true });
      }
    }
  }
  return out;
}

export const GENERATED_TEMPLATES = buildGenerated();

/** The full gallery: curated + generated (1,200+). */
export const ALL_TEMPLATES: Template[] = [...TEMPLATES, ...GENERATED_TEMPLATES];

/** Quick metadata lookup across the entire catalog. */
export function getTemplateMeta(id: string): Template | undefined {
  return ALL_TEMPLATES.find((t) => t.id === id);
}

export const STATS = [
  { value: "2.4M+", label: "Resumes optimized" },
  { value: "94%", label: "ATS pass rate" },
  { value: "10,000+", label: "Premium templates" },
  { value: "31", label: "AI career tools" },
];

export const TRUST = ["Stripe", "Linear", "Notion", "Vercel", "Figma", "Framer", "GitLab", "Airbnb", "Spotify", "Shopify"];

export const STEPS = [
  { icon: FileText, title: "Import or start fresh", desc: "Import from PDF, DOCX, LinkedIn, or GitHub in seconds. Or begin from a premium template." },
  { icon: Wand2, title: "Let AI do the heavy lifting", desc: "Generate, rewrite, tailor, and score your resume with 31 specialized AI engines." },
  { icon: Send, title: "Land the interview", desc: "Export anywhere, build a portfolio, track applications, and ace the interview." },
];

export const FAQS = [
  { q: "Is RESUMINT AI really free?", a: "Yes — every feature, every template, every AI tool is 100% free for everyone, forever. No paywalls, no watermarks, no credit card required." },
  { q: "How does the ATS scoring work?", a: "Our engine analyzes keyword match density, action verbs, quantified impact, length, contact completeness, and readability against the job description — then returns a live score with the exact fixes to improve it." },
  { q: "Can I import my existing resume?", a: "Absolutely. Import from PDF, DOCX, TXT, LinkedIn, GitHub, Google Drive, Europass, and more. We parse everything into a clean, editable profile." },
  { q: "Where is my data stored?", a: "Your resume is stored locally in your browser by default and autosaved continuously. Nothing leaves your device unless you choose to publish a portfolio." },
  { q: "Do you support my industry?", a: "We support every industry with role-aware AI — engineering, design, medical, finance, education, government, and creative fields." },
  { q: "Can I export to PDF and DOCX?", a: "Yes — export to PDF, DOCX, HTML, Markdown, TXT, JSON, or PNG, plus a shareable link and QR code." },
];

export const SECURITY = [
  { icon: Shield, title: "Bank-grade encryption", desc: "End-to-end encryption at rest and in transit, with secure HTTP-only cookies." },
  { icon: Zap, title: "Rate limiting & DDoS shield", desc: "Adaptive throttling and edge protection keep the platform fast and safe." },
  { icon: Award, title: "MFA & device management", desc: "Email OTP, TOTP, and backup codes with full device session control." },
  { icon: Brain, title: "Zero-knowledge by default", desc: "Resumes are stored locally first. Your content is yours, always." },
];

export const SECURE_IMPORTS = [
  "PDF", "DOC", "DOCX", "TXT", "RTF", "HTML", "Markdown", "JSON",
  "LinkedIn", "GitHub", "Google Drive", "Dropbox", "OneDrive", "iCloud",
  "Google Docs", "Camera OCR", "Europass", "Behance", "Dribbble", "Canva",
];

export const EXPORTS = [
  "PDF", "DOCX", "HTML", "Markdown", "TXT", "RTF", "JSON", "PNG", "JPEG",
  "Print", "Share Link", "QR Code", "Password-Protected",
];
