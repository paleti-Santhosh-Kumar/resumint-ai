// ───────────────────────────────────────────────────────────────────────────
//  AI Service — every generative AI feature goes through here.
//
//  With an OpenRouter key configured → calls the live model.
//  Without a key (or on error) → falls back to the local engine so the app
//  never breaks. Each function is async.
// ───────────────────────────────────────────────────────────────────────────
import {
  improveBullet as localBullet, generateSummary as localSummary,
  generateCoverLetter as localCover, starAnswer as localStar, chatReply,
} from "./ai";
import type { ResumeData } from "./ai";
import { chat, streamChat, hasAI, type Msg } from "./openrouter";

/** Strips common LLM wrappers (```…```, leading labels). */
function clean(s: string): string {
  return s
    .replace(/^\s*```[a-z]*\s*/i, "")
    .replace(/\s*```\s*$/i, "")
    .replace(/^\s*(result|answer|output|here)[:\-]\s*/i, "")
    .trim();
}

async function tryAI(messages: Msg[], fallback: string, opts?: { temperature?: number }): Promise<string> {
  if (hasAI()) {
    try {
      const out = await chat(messages, opts);
      if (out && out.length > 0) return clean(out);
    } catch {
      /* fall back */
    }
  }
  return fallback;
}

export async function improveBullet(bullet: string, role = ""): Promise<string> {
  const sys: Msg = {
    role: "system",
    content:
      "You are an elite resume writer for top tech companies. Rewrite the user's resume bullet to start with a strong action verb and include a concrete, realistic quantified metric (%, $, time, or scale). Keep it to ONE punchy sentence. Return ONLY the rewritten bullet — no quotes, no preamble, no explanations.",
  };
  const user: Msg = {
    role: "user",
    content: role ? `Role: ${role}\nBullet: ${bullet}` : `Bullet: ${bullet}`,
  };
  return tryAI([sys, user], localBullet(bullet), { temperature: 0.6 });
}

export async function generateSummary(role: string, years: number, skills: string[]): Promise<string> {
  const sys: Msg = {
    role: "system",
    content:
      "You are an expert resume writer. Write a professional resume summary (2-3 sentences, ~50 words). It should be confident, specific, and impact-oriented, weaving in the candidate's top skills. Return ONLY the summary text — no headings, no quotes.",
  };
  const user: Msg = {
    role: "user",
    content: `Role: ${role || "Professional"}\nYears: ${years}\nTop skills: ${skills.join(", ") || "n/a"}`,
  };
  return tryAI([sys, user], localSummary(role, years, skills), { temperature: 0.7 });
}

export async function generateCoverLetter(role: string, company: string, name: string, skills: string[]): Promise<string> {
  const sys: Msg = {
    role: "system",
    content:
      "You are a professional cover-letter writer. Write a concise, persuasive cover letter (3 short paragraphs) tailored to the role and company. Warm, specific, and confident — never generic. Return ONLY the letter text.",
  };
  const user: Msg = {
    role: "user",
    content: `Applicant: ${name}\nRole: ${role || "the role"}\nCompany: ${company || "the company"}\nKey skills: ${skills.join(", ")}`,
  };
  return tryAI([sys, user], localCover(role, company, name, skills), { temperature: 0.75 });
}

export async function starAnswer(question: string): Promise<string> {
  const sys: Msg = {
    role: "system",
    content:
      "You are an interview coach. Answer the behavioral question using the STAR method (Situation, Task, Action, Result). Make it vivid, specific, and results-driven with a quantified outcome. Label each part. Return ONLY the answer.",
  };
  const user: Msg = { role: "user", content: question };
  return tryAI([sys, user], localStar(question), { temperature: 0.7 });
}

/** Tailored suggestions after an ATS scan, based on missing keywords. */
export async function atsAdvice(report: {
  missing: string[]; score: number; suggestions: string[]; wordCount: number;
}, role = ""): Promise<string> {
  const fallback = report.suggestions[0] ?? "Tailor your resume to the job description.";
  if (!hasAI()) return fallback;
  const sys: Msg = {
    role: "system",
    content:
      "You are an ATS optimization expert. Given an analysis, give 3-4 sharp, specific, actionable recommendations to raise the ATS score. Be concise — bullet points. Return ONLY the recommendations.",
  };
  const user: Msg = {
    role: "user",
    content: `Target role: ${role || "n/a"}\nCurrent ATS score: ${report.score}/100\nMissing keywords: ${report.missing.join(", ") || "none"}\nWord count: ${report.wordCount}`,
  };
  return tryAI([sys, user], fallback, { temperature: 0.6 });
}

/** Full chat copilot. Streams tokens via onToken. */
export async function chatCopilot(
  history: Msg[],
  message: string,
  onToken: (delta: string) => void,
  signal?: AbortSignal
): Promise<string> {
  const fallback = chatReply(message);
  if (!hasAI()) {
    // Simulate streaming of the local reply — emit incremental deltas so the
    // caller (which appends) reconstructs the message correctly.
    const tokens = fallback.split(" ");
    for (let i = 0; i < tokens.length; i++) {
      onToken((i === 0 ? "" : " ") + tokens[i]);
      await new Promise((r) => setTimeout(r, 18));
    }
    return fallback;
  }
  const sys: Msg = {
    role: "system",
    content:
      "You are RESUMINT AI, an expert career copilot. Give concise, practical help with resumes, ATS optimization, cover letters, interviews, salary, and job strategy. Be warm and specific. Use short paragraphs or bullets.",
  };
  return streamChat([sys, ...history, { role: "user", content: message }], onToken, { temperature: 0.7, signal });
}

/** Rewrites the whole resume's bullet points in place (bulk AI pass). */
export async function rewriteAllBullets(data: ResumeData): Promise<string[]> {
  const bullets = data.experience.flatMap((e) => e.bullets);
  const role = data.basics.title;
  const results = await Promise.all(bullets.map((b) => improveBullet(b, role)));
  return results;
}
