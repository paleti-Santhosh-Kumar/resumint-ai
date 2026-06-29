// ───────────────────────────────────────────────────────────────────────────
//  Resume importer — extract text from files + parse into structured data.
//
//  Sources: PDF (pdf.js, with line reconstruction by Y-coordinate), DOCX
//  (mammoth), TXT, MD, RTF, JSON, and pasted text. Connectors (LinkedIn,
//  GitHub, Drive…) are simulated — behind a backend they'd OAuth + fetch.
// ───────────────────────────────────────────────────────────────────────────
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import { DEFAULT_RESUME } from "./store";
import type { ResumeData } from "./ai";

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export type ImportResult = {
  ok: boolean;
  data?: ResumeData;
  raw?: string;
  warning?: string;
};

function ext(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

/* ───────────── Text extraction ───────────── */

/** Reconstructs visual lines from a PDF page's text items using their Y position. */
function pdfPageToLines(items: { str: string; transform?: number[] }[]): string[] {
  const spans = items
    .filter((it) => "str" in it && typeof it.str === "string" && it.str.trim())
    .map((it) => ({ text: it.str, y: it.transform?.[5] ?? 0, x: it.transform?.[4] ?? 0 }));
  if (!spans.length) return [];

  const ROW_TOL = 2.5; // px tolerance to be considered the same line
  const lines: { y: number; parts: { x: number; text: string }[] }[] = [];

  for (const s of spans) {
    const row = lines.find((l) => Math.abs(l.y - s.y) <= ROW_TOL);
    if (row) row.parts.push({ x: s.x, text: s.text });
    else lines.push({ y: s.y, parts: [{ x: s.x, text: s.text }] });
  }

  // sort rows top→bottom (higher y = higher on page in PDF coords)
  lines.sort((a, b) => b.y - a.y);
  return lines.map((l) => l.parts.sort((a, b) => a.x - b.x).map((p) => p.text).join(" ").replace(/\s+/g, " ").trim()).filter(Boolean);
}

export async function extractText(file: File): Promise<ImportResult> {
  const type = ext(file.name);
  try {
    if (type === "json") {
      const text = await file.text();
      const parsed = JSON.parse(text);
      return { ok: true, data: normalizeImportedData(parsed), raw: text };
    }
    if (type === "txt" || type === "md" || type === "rtf") {
      return { ok: true, raw: await file.text() };
    }
    if (type === "docx") {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      return { ok: true, raw: result.value };
    }
    if (type === "doc") {
      return { ok: false, warning: "Legacy .doc isn't supported — please save as .docx, .pdf, or .txt." };
    }
    if (type === "pdf") {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      const allLines: string[] = [];
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        allLines.push(...pdfPageToLines(content.items as { str: string; transform?: number[] }[]));
      }
      return { ok: true, raw: allLines.join("\n") };
    }
    // Fallback: try reading as text
    return { ok: true, raw: await file.text() };
  } catch (e) {
    return { ok: false, warning: `Couldn't read this file. ${(e as Error).message}` };
  }
}

/* ───────────── Helpers ───────────── */

const MON = "jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?";
const DATE_UNIT = `(?:${MON})\\.?\\s*\\d{4}|\\d{4}|present|current|now|ongoing`;

function normDate(d: string): string {
  if (/present|current|now|ongoing/i.test(d)) return "Present";
  return d.replace(/\s+/g, " ").trim();
}

/** Extracts a date range (or single date) from a line. Returns start/end + matched text. */
function extractDates(line: string): { start: string; end: string; consumed: string } | null {
  const rangeRe = new RegExp(`\\b(${DATE_UNIT})\\s*(?:[-–—]|to|until|–)\\s*(${DATE_UNIT})\\b`, "i");
  const r = line.match(rangeRe);
  if (r) {
    const start = normDate(r[1]);
    const end = normDate(r[2]);
    return { start, end: end || "Present", consumed: r[0] };
  }
  const singleRe = new RegExp(`\\b(${DATE_UNIT})\\b`, "i");
  const s = line.match(singleRe);
  if (s) {
    const v = normDate(s[1]);
    if (v === "Present") return { start: "", end: "Present", consumed: s[0] };
    return { start: v, end: "", consumed: s[0] };
  }
  return null;
}

const BULLET_RE = /^[•‣▪◦●►○◦·▪●\-*–—►]+\s*/;
const isBullet = (l: string) => BULLET_RE.test(l);
const stripBullet = (l: string) => l.replace(BULLET_RE, "").trim();

const ROLE_RE = /\b(engineer|developer|designer|manager|analyst|scientist|consultant|specialist|director|lead|architect|intern|administrator|coordinator|officer|representative|associate|head|founder|co-?founder|principal|staff|sr\.?|junior|president|vp|cto|ceo|cfo|cmo|devops|sre|recruiter|marketer|writer|editor|strategist)\b/i;

/** Splits a header line into role + company using common separators. */
function splitRoleCompany(text: string): { role: string; company: string } {
  const t = text.trim();
  // "Role at Company"
  let m = t.match(/^(.+?)\s+at\s+(.+)$/i);
  if (m && m[1].length < 60) return assign({ a: m[1], b: m[2] });
  // pipe
  m = t.match(/^(.+?)\s*\|\s*(.+)$/);
  if (m) return assign({ a: m[1], b: m[2] });
  // em/en dash
  m = t.match(/^(.+?)\s*[—–-]\s*(.+)$/);
  if (m && !isBullet(t) && m[1].length < 60) return assign({ a: m[1], b: m[2] });
  // comma (but not a location like "City, ST")
  m = t.match(/^(.+?),\s*([^,]+)$/);
  if (m && !/[A-Z]{2}$/.test(m[1].trim()) && m[1].length < 60) return assign({ a: m[1], b: m[2] });
  // no separator → treat whole line as role (company may be next line)
  return { role: t, company: "" };
}

function assign({ a, b }: { a: string; b: string }) {
  const A = a.trim(), B = b.trim();
  const aRole = ROLE_RE.test(A), bRole = ROLE_RE.test(B);
  if (aRole && !bRole) return { role: A, company: B };
  if (bRole && !aRole) return { role: B, company: A };
  return { role: A, company: B };
}

/** Returns the canonical section name for a header line, or null. */
function sectionOf(line: string): string | null {
  const raw = line.replace(/[:：▪•*–—\s]+$/, "").trim();
  if (raw.length === 0 || raw.length > 34) return null;
  const map: [RegExp, string][] = [
    [/^(professional\s+)?(work\s+)?experience|employment(\s+history)?|work\s+history|career\s+history|professional\s+background/i, "experience"],
    [/^education|academic(\s+background|s)?|qualifications|academics/i, "education"],
    [/^(technical\s+)?skills|core\s+competenc(?:y|ies)|competenc(?:y|ies)|technologies|tech\s+stack|key\s+skills|areas\s+of\s+expertise|expertise/i, "skills"],
    [/^(personal\s+)?projects|key\s+projects|selected\s+projects|notable\s+projects/i, "projects"],
    [/^(professional\s+)?summary|summary\s+of\s+qualifications|objective|profile|about(\s+me)?|career\s+objective/i, "summary"],
    [/^certifications?|certificates?|licenses?/i, "certifications"],
    [/^awards|honou?rs|achievements|accomplishments/i, "awards"],
    [/^languages/i, "languages"],
    [/^references/i, "references"],
    [/^publications?|research/i, "publications"],
    [/^interests|hobbies/i, "interests"],
    [/^contact(\s+(info|details))?/i, "contact"],
  ];
  for (const [re, name] of map) if (re.test(raw)) return name;
  return null;
}

const DEGREE_RE = /\b(b\.?\s?sc?\.?|b\.?\s?a\.?|m\.?\s?sc?\.?|m\.?\s?a\.?|mba|ph\.?\s?d|bachelor(?:'?s)?|master(?:'?s)?|diploma|associate|b\.?\s?tech|m\.?\s?tech|b\.?\s?e\.?|m\.?\s?e\.?|doctorate|juris\s+doctor|j\.?\s?d\.?)\b/i;

/* ───────────── Main parser ───────────── */
export function parseResume(text: string): ResumeData {
  if (!text || !text.trim()) return { ...DEFAULT_RESUME, basics: emptyBasics() };

  const clean = text.replace(/\r/g, "\n");
  const lines = clean.split("\n").map((l) => l.replace(/[ \t]+/g, " ").trim()).filter(Boolean);

  const contact: Partial<ResumeData["basics"]> = {};
  let name = "";
  let title = "";

  // Split into sections based on header lines.
  type Chunk = { section: string; lines: string[] };
  const chunks: Chunk[] = [];
  let preHeader: string[] = []; // content before first header (name/title/contact)
  let current: Chunk | null = null;

  for (const l of lines) {
    const sec = sectionOf(l);
    if (sec) {
      current = { section: sec, lines: [] };
      chunks.push(current);
    } else if (current) {
      current.lines.push(l);
    } else {
      preHeader.push(l);
    }
  }

  // If no header found at all, treat whole doc as experience-ish freeform.
  if (!chunks.length && preHeader.length) {
    chunks.push({ section: "experience", lines: preHeader });
    preHeader = [];
  }

  // ── Name, title, contact from the pre-header block (or contact section)
  const contactLines = [...preHeader, ...(chunks.find((c) => c.section === "contact")?.lines ?? [])];
  extractContacts(contactLines.join("\n"), contact);

  // Name = first pre-header line that looks like a person's name.
  for (const l of preHeader.slice(0, 8)) {
    if (looksLikeName(l)) { name = l; break; }
  }
  if (!name && contactLines[0]) name = contactLines[0].slice(0, 50);

  // Title = first pre-header line (after name) that looks like a job title.
  let nameFound = false;
  for (const l of preHeader.slice(0, 8)) {
    if (l === name) { nameFound = true; continue; }
    if (!nameFound) continue;
    if (l.length <= 60 && !/@|http|www\.|tel:|\(\d{3}\)|\d{4}/i.test(l) && ROLE_RE.test(l)) { title = l; break; }
    if (l.length <= 60 && ROLE_RE.test(l)) { title = l; break; }
  }
  if (!title) {
    const t = preHeader.find((l) => l !== name && l.length <= 60 && ROLE_RE.test(l) && !/@|http/i.test(l));
    if (t) title = t;
  }

  // ── Parse each section
  const get = (s: string) => chunks.filter((c) => c.section === s).flatMap((c) => c.lines);

  const experience = parseExperience(get("experience"));
  const education = parseEducation(get("education"));
  const skills = parseSkills(get("skills"));
  const projects = parseProjects(get("projects"));
  const summaryRaw = get("summary").join(" ").replace(/\s+/g, " ").trim();
  const summary = summaryRaw.slice(0, 800);

  return {
    basics: {
      name: name || contact.name || DEFAULT_RESUME.basics.name,
      title: title || contact.title || DEFAULT_RESUME.basics.title,
      email: contact.email ?? "",
      phone: contact.phone ?? "",
      location: contact.location ?? "",
      website: contact.website ?? "",
      linkedin: contact.linkedin ?? "",
      github: contact.github ?? "",
      summary,
      photo: "",
    },
    experience: experience.length ? experience : DEFAULT_RESUME.experience,
    education: education.length ? education : DEFAULT_RESUME.education,
    skills: skills.length ? skills : DEFAULT_RESUME.skills,
    projects,
  };
}

function emptyBasics(): ResumeData["basics"] {
  return { name: "", title: "", email: "", phone: "", location: "", website: "", linkedin: "", github: "", summary: "", photo: "" };
}

function looksLikeName(l: string): boolean {
  // "Jane Doe", "Jane M. Doe", "O'Brien, Jr.", names with 2-4 capitalized words
  if (l.length < 3 || l.length > 40) return false;
  if (/@|http|www\.|\d|\b(inc|llc|ltd|corp)\b/i.test(l)) return false;
  const words = l.split(/\s+/);
  if (words.length < 2 || words.length > 4) return false;
  // each word should start uppercase (allow Mc/O'/accents/apostrophes/hyphens)
  return words.every((w) => /^[A-Z][a-zA-Z.'’-]+$/.test(w));
}

/* ── Contact extraction ── */
function extractContacts(text: string, out: Partial<ResumeData["basics"]>) {
  const m_email = text.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  if (m_email) out.email = m_email[0];

  const m_linkedin = text.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/(?:in|pub)\/[a-zA-Z0-9_-]+/i);
  if (m_linkedin) out.linkedin = m_linkedin[0].replace(/^https?:\/\//i, "").replace(/^www\./i, "");

  const m_github = text.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_-]+/i);
  if (m_github) out.github = m_github[0].replace(/^https?:\/\//i, "").replace(/^www\./i, "");

  // Phone: pick the number-like token with 10–15 digits.
  const phoneCandidates = text.match(/\+?\(?\d[\d\s().-]{8,}\d/g) || [];
  const phone = phoneCandidates.find((p) => {
    const digits = p.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 && !/^20\d{2}$/.test(digits);
  });
  if (phone) out.phone = phone.trim();

  // Website: a domain that isn't an email/linkedin/github/social.
  const domains = text.match(/\b(?:[a-z0-9-]+\.)+(?:com|net|org|io|dev|me|co|app|ai|xyz|tech|design|studio)\b(?:\/[^\s]*)?/gi) || [];
  const social = /linkedin|github|facebook|twitter|x\.com|instagram|behance|dribbble|mailto/i;
  const web = domains.find((d) => !social.test(d) && !d.includes(out.email ?? "___"));
  if (web) out.website = web.replace(/^www\./i, "");

  // Location: "City, ST" or "City, Country"
  const m_loc = text.match(/\b([A-Z][a-zA-Z.'-]+(?:\s[A-Z][a-zA-Z.'-]+){0,2}),\s*([A-Z]{2}|[A-Z][a-zA-Z]+)\b/);
  if (m_loc) out.location = `${m_loc[1]}, ${m_loc[2]}`;
}

/* ── Experience ── */
function parseExperience(lines: string[]): ResumeData["experience"] {
  const result: ResumeData["experience"] = [];
  let cur: ResumeData["experience"][number] | null = null;

  const push = () => {
    if (cur) {
      if (!cur.bullets.length) cur.bullets.push("Describe a key achievement and its measurable impact.");
      if (!cur.start) cur.start = "";
      if (!cur.end) cur.end = "Present";
      result.push(cur);
    }
  };

  for (let i = 0; i < lines.length; i++) {
    let l = lines[i].trim();
    if (!l) continue;

    if (isBullet(l)) {
      const text = stripBullet(l);
      if (!cur) cur = { role: "Role", company: "", start: "", end: "Present", bullets: [] };
      cur.bullets.push(text);
      continue;
    }

    const dates = extractDates(l);
    const remainder = dates ? l.replace(dates.consumed, "").replace(/[|·,–—-]\s*$/, "").trim() : l;

    // Pure date / location line → attach to current entry
    if (dates && remainder.length < 10) {
      if (cur) { if (!cur.start) cur.start = dates.start; if (!cur.end) cur.end = dates.end || "Present"; }
      continue;
    }

    // New header? short line with role keyword or separator, not a long sentence
    const looksHeader =
      remainder.length <= 70 &&
      (ROLE_RE.test(remainder) || /\bat\b|\||—|–/.test(remainder)) &&
      remainder.split(/\s+/).length <= 12;

    if (looksHeader) {
      push();
      const { role, company } = splitRoleCompany(remainder);
      cur = { role: role || "Role", company: company || "", start: dates?.start ?? "", end: dates?.end ?? "Present", bullets: [] };
      continue;
    }

    // Header with dates inline removed but still a title-ish line
    if (dates && remainder.length <= 70 && ROLE_RE.test(remainder)) {
      push();
      const { role, company } = splitRoleCompany(remainder);
      cur = { role: role || "Role", company, start: dates.start, end: dates.end || "Present", bullets: [] };
      continue;
    }

    // Otherwise it's a descriptive bullet (if we have an entry) or start one
    if (cur && l.length > 20) {
      cur.bullets.push(stripBullet(l));
    } else {
      push();
      const { role, company } = splitRoleCompany(remainder);
      cur = { role: role || "Role", company, start: dates?.start ?? "", end: dates?.end ?? "Present", bullets: [] };
    }
  }
  push();
  return result.filter((e) => (e.role && e.role !== "Role" ? true : e.bullets.length > 1 || e.company));
}

/* ── Education ── */
function parseEducation(lines: string[]): ResumeData["education"] {
  const result: ResumeData["education"] = [];
  let i = 0;
  while (i < lines.length) {
    const l = lines[i].trim();
    if (!l) { i++; continue; }
    const dates = extractDates(l);
    const remainder = dates ? l.replace(dates.consumed, "").replace(/[|,–—]\s*$/, "").trim() : l;

    if (DEGREE_RE.test(remainder)) {
      let degree = remainder;
      let school = "";
      const sep = remainder.match(/^(.+?)\s*[|,–—]\s*(.+)$/);
      if (sep) {
        degree = DEGREE_RE.test(sep[1]) ? sep[1].trim() : sep[2].trim();
        school = DEGREE_RE.test(sep[1]) ? sep[2].trim() : sep[1].trim();
      }
      // school may be on the next line
      if (!school && i + 1 < lines.length && !DEGREE_RE.test(lines[i + 1]) && lines[i + 1].length <= 60) {
        school = lines[i + 1].trim();
        i++;
      }
      result.push({
        degree: degree.trim(),
        school: school.trim() || "University",
        start: dates?.start ?? "",
        end: dates?.end ?? "",
      });
    } else if (!dates && l.length <= 60 && result.length && !result[result.length - 1].school) {
      result[result.length - 1].school = l;
    }
    i++;
  }
  return result;
}

/* ── Skills ── */
function parseSkills(lines: string[]): ResumeData["skills"] {
  const block = lines.join(" ");
  // strip "Category:" labels
  const stripped = block.replace(/[A-Za-z /&]+:\s/g, " ");
  const tokens = stripped
    .split(/[,;|•·▪►\-–—•]|\s{2,}|\n|\t/)
    .map((s) => s.replace(/[\s•·▪]+/g, " ").trim())
    .filter((s) => s.length >= 2 && s.length <= 32 && !/^\d+$/.test(s) && !/^(proficient|expertise|skills?|tools|technologies)$/i.test(s));
  const uniq = [...new Set(tokens)].slice(0, 16);
  return uniq.map((name, i) => ({ name, level: Math.max(60, 92 - i * 3) }));
}

/* ── Projects ── */
function parseProjects(lines: string[]): ResumeData["projects"] {
  const result: ResumeData["projects"] = [];
  let cur: ResumeData["projects"][number] | null = null;
  for (const raw of lines) {
    const l = raw.trim();
    if (!l) continue;
    if (isBullet(l)) {
      const t = stripBullet(l);
      if (cur) cur.description += (cur.description ? " " : "") + t;
      else cur = { name: t.slice(0, 40), description: t, link: "" };
      continue;
    }
    const link = l.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/[a-zA-Z0-9_/-]+/i)?.[0] || "";
    const sep = l.match(/^(.+?)\s*[:–—|]\s*(.+)$/);
    if (sep && sep[1].length <= 50) {
      if (cur) result.push(cur);
      cur = { name: sep[1].trim(), description: sep[2].trim(), link: link.replace(/^https?:\/\//i, "") };
    } else if (l.length <= 60) {
      if (cur) result.push(cur);
      cur = { name: l, description: "", link: link.replace(/^https?:\/\//i, "") };
    } else if (cur) {
      cur.description += (cur.description ? " " : "") + l;
    }
  }
  if (cur) result.push(cur);
  return result.slice(0, 6).map((p) => ({
    name: p.name,
    description: p.description || "A project showcasing relevant skills.",
    link: p.link,
  }));
}

/* ── Normalize imported JSON to our shape ── */
function normalizeImportedData(d: unknown): ResumeData {
  if (!d || typeof d !== "object") return { ...DEFAULT_RESUME };
  const obj = d as Record<string, unknown>;
  const basics = (obj.basics ?? {}) as Record<string, unknown>;
  return {
    basics: {
      name: str(basics.name) || DEFAULT_RESUME.basics.name,
      title: str(basics.title) || DEFAULT_RESUME.basics.title,
      email: str(basics.email),
      phone: str(basics.phone),
      location: str(basics.location),
      website: str(basics.website),
      linkedin: str(basics.linkedin),
      github: str(basics.github),
      summary: str(basics.summary),
      photo: str(basics.photo),
    },
    experience: Array.isArray(obj.experience) ? (obj.experience as ResumeData["experience"]) : DEFAULT_RESUME.experience,
    education: Array.isArray(obj.education) ? (obj.education as ResumeData["education"]) : DEFAULT_RESUME.education,
    skills: Array.isArray(obj.skills) ? (obj.skills as ResumeData["skills"]) : DEFAULT_RESUME.skills,
    projects: Array.isArray(obj.projects) ? (obj.projects as ResumeData["projects"]) : [],
  };
}
function str(v: unknown): string {
  return typeof v === "string" ? v : "";
}

export function importFromText(text: string): ResumeData {
  if (!text.trim()) return DEFAULT_RESUME;
  return parseResume(text);
}
