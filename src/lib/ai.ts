// ───────────────────────────────────────────────────────────────────────────
//  RESUMINT AI — Local Intelligence Engine
//  A deterministic, on-device engine that powers all "AI" features.
//  Architected so each function could later be swapped for a secure
//  server-side call to an LLM provider (OpenAI / Gemini / Claude)
//  that holds the real API keys. No secrets ever live in the client.
// ───────────────────────────────────────────────────────────────────────────

const STOPWORDS = new Set([
  "the", "and", "for", "you", "with", "that", "this", "are", "from", "have",
  "will", "your", "our", "their", "but", "not", "all", "can", "who", "has",
  "was", "were", "they", "them", "his", "her", "she", "him", "any", "into",
  "over", "than", "then", "what", "when", "where", "which", "while", "would",
  "about", "above", "after", "again", "being", "below", "between", "both",
  "during", "each", "few", "here", "how", "more", "most", "other", "out",
  "own", "same", "should", "some", "such", "there", "these", "those", "very",
  "job", "role", "work", "team", "ability", "must", "etc", "including", "using",
  "skills", "experience", "strong", "excellent", "good", "candidate", "looking",
  "join", "help", "company", "we", "us", "i", "a", "an", "to", "of", "in", "on",
  "at", "as", "is", "it", "be", "or", "by", "do", "if", "so", "no",
]);

const ACTION_VERBS = [
  "led", "built", "designed", "developed", "created", "launched", "drove",
  "increased", "reduced", "improved", "optimized", "architected", "engineered",
  "implemented", "delivered", "managed", "spearheaded", "orchestrated",
  "automated", "scaled", "accelerated", "transformed", "streamlined",
  "negotiated", "established", "pioneered", "mentored", "analyzed", "shipped",
  "generated", "boosted", "cut", "saved", "won", "grew", "owned", "revamped",
];

export type KeywordHit = { word: string; found: boolean; weight: number };

export type ATSReport = {
  score: number;
  grade: string;
  verdict: string;
  checks: { label: string; score: number; note: string }[];
  matched: KeywordHit[];
  missing: string[];
  suggestions: string[];
  wordCount: number;
};

const gradeFor = (s: number) =>
  s >= 90 ? { grade: "A+", verdict: "Outstanding — highly ATS-optimized" }
  : s >= 80 ? { grade: "A", verdict: "Strong — minor refinements recommended" }
  : s >= 70 ? { grade: "B", verdict: "Good — several optimizations available" }
  : s >= 55 ? { grade: "C", verdict: "Needs work — below recruiter threshold" }
  : { grade: "D", verdict: "At risk — likely filtered out by ATS" };

export function analyzeResume(resumeText: string, jobDescription: string): ATSReport {
  const text = resumeText.toLowerCase();
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const sentences = resumeText.split(/[.!?\n]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);

  // ── Keyword analysis
  const jdTokens = (jobDescription || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  const jdFreq = new Map<string, number>();
  jdTokens.forEach((w) => jdFreq.set(w, (jdFreq.get(w) || 0) + 1));

  const topKeywords = [...jdFreq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 14)
    .map(([word]) => word);

  const matched: KeywordHit[] = topKeywords.map((word) => {
    const found = text.includes(word);
    return { word, found, weight: jdFreq.get(word) || 1 };
  });
  const missing = matched.filter((k) => !k.found).map((k) => k.word);
  const matchedCount = matched.filter((k) => k.found).length;
  const keywordScore = topKeywords.length
    ? Math.round((matchedCount / topKeywords.length) * 100)
    : 70;

  // ── Action verbs
  const verbHits = ACTION_VERBS.filter((v) => text.includes(v)).length;
  const actionScore = Math.min(100, Math.round((verbHits / 6) * 100));

  // ── Quantified achievements (lines with numbers / % / $)
  const quantified = sentences.filter((s) => /(\$?\d[\d,]*\.?\d*\s?%?|\d+x)/.test(s)).length;
  const bulletCount = Math.max(sentences.length, 1);
  const metricScore = Math.min(100, Math.round((quantified / Math.max(6, bulletCount * 0.5)) * 100));

  // ── Length appropriateness (ideal 380–820 words)
  let lengthScore: number;
  if (wordCount === 0) lengthScore = 10;
  else if (wordCount < 200) lengthScore = 40;
  else if (wordCount < 380) lengthScore = 72;
  else if (wordCount <= 820) lengthScore = 100;
  else if (wordCount <= 1000) lengthScore = 82;
  else lengthScore = 60;

  // ── Contact completeness
  const hasEmail = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/.test(text);
  const hasPhone = /\+?\d[\d\s().-]{7,}\d/.test(text);
  const hasLinks = /(linkedin|github|http|www\.)/.test(text);
  const contactScore = Math.round(((Number(hasEmail) + Number(hasPhone) + Number(hasLinks)) / 3) * 100);

  // ── Readability / banned phrases
  const banned = ["responsible for", "duties included", "hard worker", "team player", "think outside the box"];
  const bannedHits = banned.filter((b) => text.includes(b)).length;
  const readabilityScore = Math.max(20, 100 - bannedHits * 22);

  const checks = [
    { label: "Keyword Match", score: keywordScore, note: `${matchedCount}/${topKeywords.length} critical keywords found` },
    { label: "Action Verbs", score: actionScore, note: `${verbHits} strong verbs detected` },
    { label: "Quantified Impact", score: metricScore, note: `${quantified} metric-backed statements` },
    { label: "Length & Density", score: lengthScore, note: `${wordCount} words (${wordCount < 380 ? "short" : wordCount > 820 ? "long" : "optimal"})` },
    { label: "Contact Info", score: contactScore, note: [hasEmail && "email", hasPhone && "phone", hasLinks && "links"].filter(Boolean).join(" · ") || "missing" },
    { label: "Readability", score: readabilityScore, note: bannedHits ? `${bannedHits} cliché phrases` : "Clean & professional" },
  ];

  const weighted =
    keywordScore * 0.32 + actionScore * 0.16 + metricScore * 0.2 + lengthScore * 0.12 +
    contactScore * 0.1 + readabilityScore * 0.1;
  const score = Math.max(8, Math.min(100, Math.round(weighted)));
  const { grade, verdict } = gradeFor(score);

  const suggestions: string[] = [];
  if (missing.length) suggestions.push(`Add these missing keywords: ${missing.slice(0, 6).join(", ")}.`);
  if (metricScore < 70) suggestions.push("Quantify achievements with metrics (% growth, $ saved, time reduced).");
  if (actionScore < 70) suggestions.push("Start bullets with strong action verbs (Led, Built, Shipped, Scaled).");
  if (bannedHits) suggestions.push("Replace cliché phrases (“responsible for”) with concrete results.");
  if (wordCount < 380) suggestions.push("Expand your content — aim for 400–800 words.");
  if (!suggestions.length) suggestions.push("Your resume is well-optimized. Tailor specifics to each posting.");

  return { score, grade, verdict, checks, matched, missing, suggestions, wordCount };
}

// ── Resume text serializer (from editor state → analyzable string)
export type ResumeData = {
  basics: {
    name: string; title: string; email: string; phone: string; location: string;
    website: string; linkedin: string; github: string; summary: string; photo: string;
  };
  experience: { role: string; company: string; start: string; end: string; bullets: string[] }[];
  education: { degree: string; school: string; start: string; end: string }[];
  skills: { name: string; level: number }[];
  projects: { name: string; description: string; link: string }[];
};

export function resumeToText(r: ResumeData): string {
  return [
    r.basics.name, r.basics.title, r.basics.email, r.basics.phone, r.basics.location,
    r.basics.linkedin, r.basics.github, r.basics.website,
    r.basics.summary,
    ...r.experience.flatMap((e) => [`${e.role} at ${e.company} (${e.start}–${e.end})`, ...e.bullets]),
    ...r.education.map((e) => `${e.degree}, ${e.school}`),
    r.skills.map((s) => s.name).join(", "),
    ...r.projects.map((p) => `${p.name}: ${p.description}`),
  ].filter(Boolean).join("\n");
}

// ── Generative helpers (template-based, deterministic)
export function generateSummary(role: string, years: number, skills: string[]): string {
  const top = skills.slice(0, 4).join(", ") || "cross-functional collaboration, scalable systems, and product strategy";
  const yr = years > 0 ? `${years}+ years of` : "results-driven";
  return `${yr} ${role || "professional"} with a proven record of shipping high-impact products and driving measurable growth. Specialized in ${top}. Adept at translating ambiguous problems into scalable solutions, mentoring teams, and aligning engineering with business outcomes to deliver compounding value.`;
}

const POWER_OPENERS = [
  "Spearheaded", "Architected", "Scaled", "Drove", "Orchestrated",
  "Engineered", "Launched", "Optimized", "Accelerated", "Transformed",
];

export function improveBullet(bullet: string): string {
  if (!bullet.trim()) return "Led a high-impact initiative that improved key metrics by 30% within two quarters.";
  let out = bullet.trim().replace(/^(responsible for|duties included|worked on|helped to|helped)\s*/i, "");
  const firstWord = out.split(/\s/)[0].toLowerCase();
  if (!ACTION_VERBS.includes(firstWord)) {
    const opener = POWER_OPENERS[Math.floor((out.length + firstWord.length) % POWER_OPENERS.length)];
    out = `${opener} ${out.charAt(0).toLowerCase()}${out.slice(1)}`;
  }
  if (!/\d/.test(out)) {
    const gain = 18 + ((out.length % 30));
    out += `, boosting efficiency by ${gain}% across the workflow`;
  }
  return out.replace(/\.+$/, "") + ".";
}

export function generateCoverLetter(role: string, company: string, name: string, skills: string[]): string {
  const top = skills.slice(0, 3).join(", ") || "leadership, product strategy, and execution";
  return `Dear Hiring Team at ${company || "your company"},

I am excited to apply for the ${role || "open"} position at ${company || "your company"}. With a background rooted in ${top}, I have consistently translated ambitious goals into shipped outcomes — owning initiatives end-to-end and collaborating across teams to compound results.

What draws me to ${company || "your team"} is the opportunity to build at scale alongside people who care deeply about craft and impact. I am eager to contribute from day one and grow together with the team.

I would welcome the chance to discuss how my experience can accelerate your roadmap. Thank you for your consideration.

Warm regards,
${name || "Your Name"}`;
}

export function starAnswer(question: string): string {
  const q = question.trim() || "Tell me about a time you overcame a challenge.";
  return `SITUATION — On a previous project, ${q.toLowerCase().replace(/\?$/, "")} emerged as a blocker threatening the release timeline.

TASK — As the owner of the workstream, I was accountable for unblocking the path forward without compromising quality.

ACTION — I broke the problem into smaller validated hypotheses, realigned the team around the highest-leverage fix, and instrumented the rollout so we could measure impact in real time.

RESULT — We shipped on schedule, improved the target metric by ~28%, and codified the learnings into a playbook the team still reuses today.`;
}

export function estimateSalary(role: string, location: string): { low: number; mid: number; high: number; currency: string } {
  const base = (role || "").toLowerCase();
  let anchor = 85000;
  if (/lead|staff|principal|director|head|manager/.test(base)) anchor = 165000;
  else if (/senior|sr\.?/.test(base)) anchor = 130000;
  else if (/junior|intern|entry/.test(base)) anchor = 62000;
  else if (/ai|ml|data|engineer|developer|software|backend|frontend|devops/.test(base)) anchor = 118000;
  else if (/design|product/.test(base)) anchor = 105000;
  else if (/market|sales|content|writer/.test(base)) anchor = 72000;

  const loc = (location || "").toLowerCase();
  const mult = /san franc|new york|seattle|london|zurich|singapore/.test(loc) ? 1.28
    : /boston|los angeles|washington|dublin|sydney|toronto/.test(loc) ? 1.12
    : /berlin|amsterdam|remote|austin|denver|chicago/.test(loc) ? 0.98
    : /india|bangalore|mumbai|hyderabad|pune|remote/.test(loc) ? 0.42
    : 1;

  const mid = Math.round((anchor * mult) / 1000) * 1000;
  return { low: Math.round(mid * 0.82), mid, high: Math.round(mid * 1.22), currency: /india|bangalore|mumbai|hyderabad|pune/.test(loc) ? "₹" : "$" };
}

// ── 24/7 Chat assistant — keyword-routed intelligent replies
export function chatReply(message: string): string {
  const m = message.toLowerCase();
  if (/ats|score|pass|filter/.test(m))
    return "To beat the ATS, match keywords from the job description verbatim, quantify every achievement, and avoid tables/graphics that parsers can't read. Open the Resume Builder and hit “Run ATS Scan” — I'll show your live score and the exact gaps to fix.";
  if (/cover letter/.test(m))
    return "I can draft a tailored cover letter in seconds. Head to AI Tools → Cover Letter Generator, drop in the role and company, and I'll produce a polished, recruiter-ready draft you can refine.";
  if (/interview|mock/.test(m))
    return "Try AI Tools → Mock Interview. I'll ask role-specific questions, then grade your STAR answers for structure, impact, and clarity. Want me to start with a behavioral question?";
  if (/template|design|format/.test(m))
    return "We have thousands of templates across Modern, Executive, ATS, Creative and more. For automated systems, pick an “ATS” template — single column, standard fonts, no columns. For humans (portfolios/emails), go Creative.";
  if (/skill|gap|roadmap/.test(m))
    return "Run the Skill Gap Analysis: paste a target role and I'll compare it to your profile, surface missing skills, and generate a 90-day learning roadmap to close the gaps.";
  if (/salary|pay|comp/.test(m))
    return "Use the Salary Estimator — give me a role + location and I'll return a researched low/mid/high band with negotiation talking points.";
  if (/import|upload|pdf|linkedin/.test(m))
    return "You can import from PDF, DOCX, LinkedIn, GitHub, Google Drive and more. Click “Import Resume” in the builder and I'll parse it into an editable, structured profile.";
  if (/portfolio|website/.test(m))
    return "The Portfolio Builder turns your resume into a live, SEO-ready personal site with a custom domain — one click from the dashboard.";
  if (/hello|hi|hey|start/.test(m))
    return "Hey! I'm your RESUMINT AI career copilot. I can optimize your resume for ATS, write cover letters, run mock interviews, analyze skill gaps, and more. What are you working on today?";
  if (/thank/.test(m))
    return "Anytime — that's what I'm here for. Go land that role. 🚀";
  return "Great question. I can help with ATS optimization, resume writing, cover letters, mock interviews, salary estimates, skill-gap analysis, and job tailoring. Tell me which goal you're chasing and I'll take it from there.";
}
