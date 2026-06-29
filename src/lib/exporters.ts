import jsPDF from "jspdf";
import { toPng, toJpeg } from "html-to-image";
import {
  AlignmentType, Document, HeadingLevel, Packer, Paragraph, TextRun,
} from "docx";
import type { ResumeData } from "./ai";

function download(content: BlobPart, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

function slug(s: string) {
  return (s || "resume").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "resume";
}

/* ───────────── Image-based (capture the rendered paper) ───────────── */

function triggerDownload(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

export async function exportPNG(element: HTMLElement, name: string) {
  const dataUrl = await toPng(element, {
    pixelRatio: 2,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: { transform: "none" },
  });
  triggerDownload(dataUrl, `${slug(name)}.png`);
}

export async function exportJPEG(element: HTMLElement, name: string) {
  const dataUrl = await toJpeg(element, {
    pixelRatio: 2,
    quality: 0.92,
    backgroundColor: "#ffffff",
    cacheBust: true,
    style: { transform: "none" },
  });
  triggerDownload(dataUrl, `${slug(name)}.jpg`);
}

/* ───────────── PDF (built from data — vector text, always works) ───────────── */
export function exportPDF(data: ResumeData, name: string) {
  const b = data.basics;
  const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PW = pdf.internal.pageSize.getWidth();
  const PH = pdf.internal.pageSize.getHeight();
  const M = 16; // margin
  const CW = PW - M * 2;
  const ACCENT: [number, number, number] = [124, 58, 237];
  let y = M;

  const ensure = (need: number) => {
    if (y + need > PH - M) { pdf.addPage(); y = M; }
  };
  const heading = (t: string) => {
    ensure(12);
    pdf.setFont("helvetica", "bold"); pdf.setFontSize(11); pdf.setTextColor(...ACCENT);
    pdf.text(t.toUpperCase(), M, y);
    y += 2;
    pdf.setDrawColor(230, 230, 235); pdf.setLineWidth(0.3);
    pdf.line(M, y, M + CW, y);
    y += 6;
  };
  const wrap = (text: string, size: number, style: string, color: [number, number, number], lh = 4.6) => {
    pdf.setFont("helvetica", style); pdf.setFontSize(size); pdf.setTextColor(...color);
    const lines = pdf.splitTextToSize(text, CW) as string[];
    for (const ln of lines) {
      ensure(lh);
      pdf.text(ln, M, y);
      y += lh;
    }
  };

  // Header
  pdf.setFont("helvetica", "bold"); pdf.setFontSize(22); pdf.setTextColor(20, 20, 30);
  pdf.text(b.name || "Your Name", M, y + 6); y += 11;
  if (b.title) { wrap(b.title, 12, "normal", ACCENT, 5); }
  const contact = [b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean).join("  •  ");
  if (contact) { wrap(contact, 9, "normal", [110, 110, 120], 4.5); }
  y += 3;

  if (b.summary) { heading("Summary"); wrap(b.summary, 9.5, "normal", [60, 60, 70]); y += 2; }

  if (data.experience.length) {
    heading("Experience");
    data.experience.forEach((e) => {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10.5); pdf.setTextColor(20, 20, 30);
      pdf.text(e.role, M, y);
      pdf.setFont("helvetica", "normal"); pdf.setTextColor(110, 110, 120);
      const co = `— ${e.company}`;
      const coW = pdf.getTextWidth(e.role) + 2;
      pdf.text(co, M + coW, y);
      pdf.setFontSize(9); pdf.setTextColor(150, 150, 160);
      const date = `${e.start} – ${e.end}`;
      pdf.text(date, M + CW - pdf.getTextWidth(date), y);
      y += 5;
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5); pdf.setTextColor(60, 60, 70);
      e.bullets.forEach((bl) => {
        const lines = pdf.splitTextToSize(`•  ${bl}`, CW - 3) as string[];
        for (const ln of lines) { ensure(4.6); pdf.text(ln, M + 1, y); y += 4.6; }
      });
      y += 2;
    });
  }

  if (data.education.length) {
    heading("Education");
    data.education.forEach((e) => {
      pdf.setFont("helvetica", "bold"); pdf.setFontSize(10); pdf.setTextColor(20, 20, 30);
      pdf.text(e.degree, M, y); y += 4.6;
      wrap(`${e.school}  (${e.start}–${e.end})`, 9.5, "normal", [110, 110, 120], 4.6);
    });
    y += 2;
  }

  if (data.skills.length) {
    heading("Skills");
    wrap(data.skills.map((s) => s.name).join("  •  "), 9.5, "normal", [60, 60, 70]);
    y += 2;
  }

  if (data.projects.length) {
    heading("Projects");
    data.projects.forEach((p) => {
      const lines = pdf.splitTextToSize(`•  ${p.name} — ${p.description}`, CW - 3) as string[];
      pdf.setFont("helvetica", "normal"); pdf.setFontSize(9.5); pdf.setTextColor(60, 60, 70);
      for (const ln of lines) { ensure(4.6); pdf.text(ln, M + 1, y); y += 4.6; }
    });
  }

  pdf.save(`${slug(name)}.pdf`);
}

/* ───────────── Print ───────────── */
export function printResume() {
  window.print();
}

/* ───────────── JSON ───────────── */
export function exportJSON(data: ResumeData, name: string) {
  download(JSON.stringify(data, null, 2), `${slug(name)}.json`, "application/json");
}

/* ───────────── TXT ───────────── */
export function exportTXT(data: ResumeData, name: string) {
  const lines: string[] = [];
  const b = data.basics;
  lines.push(b.name.toUpperCase());
  if (b.title) lines.push(b.title);
  lines.push([b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean).join(" | "));
  if (b.summary) lines.push("", "SUMMARY", b.summary);
  if (data.experience.length) {
    lines.push("", "EXPERIENCE");
    data.experience.forEach((e) => {
      lines.push(`\n${e.role} — ${e.company} (${e.start} - ${e.end})`);
      e.bullets.forEach((x) => lines.push(`  • ${x}`));
    });
  }
  if (data.education.length) {
    lines.push("", "EDUCATION");
    data.education.forEach((e) => lines.push(`${e.degree}, ${e.school} (${e.start} - ${e.end})`));
  }
  if (data.skills.length) lines.push("", "SKILLS", data.skills.map((s) => s.name).join(", "));
  if (data.projects.length) {
    lines.push("", "PROJECTS");
    data.projects.forEach((p) => lines.push(`• ${p.name} — ${p.description}${p.link ? ` (${p.link})` : ""}`));
  }
  download(lines.join("\n"), `${slug(name)}.txt`, "text/plain");
}

/* ───────────── Markdown ───────────── */
export function exportMarkdown(data: ResumeData, name: string) {
  const b = data.basics;
  const md: string[] = [`# ${b.name}`, "", `**${b.title}**`, ""];
  const contact = [b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean);
  if (contact.length) md.push(contact.join(" • "), "");
  if (b.summary) md.push("## Summary", "", b.summary, "");
  if (data.experience.length) {
    md.push("## Experience", "");
    data.experience.forEach((e) => {
      md.push(`### ${e.role} — ${e.company}`, `*${e.start} – ${e.end}*`, "");
      e.bullets.forEach((x) => md.push(`- ${x}`));
      md.push("");
    });
  }
  if (data.education.length) {
    md.push("## Education", "");
    data.education.forEach((e) => md.push(`- **${e.degree}**, ${e.school} (*${e.start}–${e.end}*)`));
    md.push("");
  }
  if (data.skills.length) md.push("## Skills", "", data.skills.map((s) => s.name).join(", "), "");
  if (data.projects.length) {
    md.push("## Projects", "");
    data.projects.forEach((p) => md.push(`- **${p.name}** — ${p.description}`));
  }
  download(md.join("\n"), `${slug(name)}.md`, "text/markdown");
}

/* ───────────── HTML (standalone, styled, shareable) ───────────── */
export function exportHTML(data: ResumeData, name: string) {
  const b = data.basics;
  const esc = (s: string) => (s || "").replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
  const html = `<!doctype html><html><head><meta charset="utf-8"><title>${esc(b.name)} — Resume</title>
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  :root{color-scheme:light}body{font-family:Inter,system-ui,sans-serif;background:#f4f4f7;margin:0;padding:40px}
  .r{max-width:760px;margin:0 auto;background:#fff;color:#1a1a2e;padding:48px;border-radius:12px;box-shadow:0 20px 60px -20px rgba(0,0,0,.2)}
  h1{margin:0;font-size:32px}h2{margin:28px 0 8px;font-size:13px;text-transform:uppercase;letter-spacing:.12em;color:#7c3aed;border-bottom:1px solid #eee;padding-bottom:4px}
  .t{color:#6d28d9;font-weight:600}.c{color:#666;font-size:13px;margin-top:4px}
  .role{font-weight:700}.co{color:#666}.date{float:right;color:#999;font-size:12px}
  ul{margin:6px 0 12px;padding-left:18px}li{margin:3px 0;font-size:14px;line-height:1.5}
  p{font-size:14px;line-height:1.6;color:#444}.sk{display:inline-block;background:#f1edff;color:#6d28d9;padding:3px 10px;border-radius:999px;font-size:12px;margin:2px}
</style></head><body><div class="r">
<h1>${esc(b.name)}</h1><div class="t">${esc(b.title)}</div>
<div class="c">${[b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean).map(esc).join(" • ")}</div>
${b.summary ? `<h2>Summary</h2><p>${esc(b.summary)}</p>` : ""}
${data.experience.length ? `<h2>Experience</h2>` + data.experience.map((e) =>
    `<div><span class="role">${esc(e.role)}</span> <span class="co">— ${esc(e.company)}</span><span class="date">${esc(e.start)} – ${esc(e.end)}</span><ul>${e.bullets.map((x) => `<li>${esc(x)}</li>`).join("")}</ul></div>`
  ).join("") : ""}
${data.education.length ? `<h2>Education</h2>` + data.education.map((e) => `<p><span class="role">${esc(e.degree)}</span> — ${esc(e.school)} <span class="date">${esc(e.start)}–${esc(e.end)}</span></p>`).join("") : ""}
${data.skills.length ? `<h2>Skills</h2><div>${data.skills.map((s) => `<span class="sk">${esc(s.name)}</span>`).join("")}</div>` : ""}
${data.projects.length ? `<h2>Projects</h2><ul>${data.projects.map((p) => `<li><b>${esc(p.name)}</b> — ${esc(p.description)}</li>`).join("")}</ul>` : ""}
</div></body></html>`;
  download(html, `${slug(name)}.html`, "text/html");
}

/* ───────────── DOCX (real Microsoft Word file) ───────────── */
export async function exportDOCX(data: ResumeData, name: string) {
  const b = data.basics;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    children: [new TextRun({ text: b.name, bold: true, size: 40 })],
    spacing: { after: 60 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: b.title, color: "6D28D9", size: 24 })],
    spacing: { after: 60 },
  }));
  children.push(new Paragraph({
    children: [new TextRun({ text: [b.email, b.phone, b.location, b.linkedin, b.github, b.website].filter(Boolean).join("  •  "), size: 18, color: "666666" })],
    spacing: { after: 120 },
  }));

  const heading = (t: string) => new Paragraph({
    children: [new TextRun({ text: t.toUpperCase(), bold: true, size: 22, color: "7C3AED" })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 200, after: 80 },
    border: { bottom: { color: "EEEEEE", space: 2, style: "single", size: 6 } },
  });

  if (b.summary) {
    children.push(heading("Summary"));
    children.push(new Paragraph({ children: [new TextRun({ text: b.summary, size: 20 })], spacing: { after: 60 } }));
  }
  if (data.experience.length) {
    children.push(heading("Experience"));
    data.experience.forEach((e) => {
      children.push(new Paragraph({
        children: [
          new TextRun({ text: e.role, bold: true, size: 22 }),
          new TextRun({ text: ` — ${e.company}`, size: 22, color: "666666" }),
          new TextRun({ text: `   (${e.start} – ${e.end})`, size: 18, color: "999999" }),
        ],
        spacing: { after: 40 },
      }));
      e.bullets.forEach((x) =>
        children.push(new Paragraph({
          children: [new TextRun({ text: x, size: 20 })],
          bullet: { level: 0 },
          spacing: { after: 30 },
        }))
      );
    });
  }
  if (data.education.length) {
    children.push(heading("Education"));
    data.education.forEach((e) =>
      children.push(new Paragraph({
        children: [
          new TextRun({ text: e.degree, bold: true, size: 21 }),
          new TextRun({ text: ` — ${e.school}`, size: 21, color: "666666" }),
          new TextRun({ text: `   (${e.start}–${e.end})`, size: 18, color: "999999" }),
        ],
        spacing: { after: 40 },
      }))
    );
  }
  if (data.skills.length) {
    children.push(heading("Skills"));
    children.push(new Paragraph({
      children: [new TextRun({ text: data.skills.map((s) => s.name).join("  •  "), size: 20 })],
      alignment: AlignmentType.LEFT,
    }));
  }
  if (data.projects.length) {
    children.push(heading("Projects"));
    data.projects.forEach((p) =>
      children.push(new Paragraph({
        children: [
          new TextRun({ text: p.name, bold: true, size: 21 }),
          new TextRun({ text: ` — ${p.description}`, size: 21 }),
        ],
        bullet: { level: 0 },
        spacing: { after: 30 },
      }))
    );
  }

  const doc = new Document({
    creator: "RESUMINT AI",
    title: `${b.name} — Resume`,
    sections: [{ properties: {}, children }],
  });

  const blob = await Packer.toBlob(doc);
  download(blob, `${slug(name)}.docx`, "application/vnd.openxmlformats-officedocument.wordprocessingml.document");
}

/* ───────────── Share link (demo) ───────────── */
export async function copyShareLink(name: string) {
  const id = btoa(unescape(encodeURIComponent(name || "resume"))).slice(0, 10).toLowerCase();
  const link = `https://resumint.ai/r/${id}`;
  try {
    await navigator.clipboard.writeText(link);
  } catch {
    /* ignore */
  }
  return link;
}
