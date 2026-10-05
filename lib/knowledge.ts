import { aboutIntro, focusAreas } from "@/data/about";
import { education, experience } from "@/data/experience";
import { pipeline } from "@/data/pipeline";
import { projects } from "@/data/projects";
import { site } from "@/data/site";
import { skillCategories, skills } from "@/data/skills";
import { isPlaceholder, type Content } from "@/lib/content";

/**
 * Small retrieval index over the portfolio's own data, for the "Ask about me" chat.
 * Every answer is grounded in these chunks; each chunk links back to its section.
 */

export type Chunk = { id: string; title: string; href: string; text: string };

const real = (items: (Content | undefined)[] = []) =>
  items.filter((c): c is string => typeof c === "string" && !isPlaceholder(c) && c.length > 0);

function buildChunks(): Chunk[] {
  const chunks: Chunk[] = [];

  chunks.push({
    id: "about",
    title: "About Aloke",
    href: "#about",
    text: [
      `Aloke K Issac is an ${site.role} based in ${site.location}.`,
      site.available ? "He is available for work and open to new opportunities and collaborations." : "",
      aboutIntro.statement,
      ...aboutIntro.paragraphs,
      `Contact: email ${String(site.links.email)}, GitHub ${String(site.links.github)}, LinkedIn ${String(site.links.linkedin)}.`,
    ].join(" "),
  });
  for (const f of focusAreas) {
    chunks.push({ id: `focus-${f.id}`, title: `Focus: ${f.title}`, href: "#about", text: `${f.title}: ${f.summary} ${f.detail}` });
  }

  for (const c of skillCategories) {
    const list = skills.filter((s) => s.category === c.id);
    chunks.push({
      id: `skills-${c.id}`,
      title: `Skills: ${c.label}`,
      href: "#skills",
      text: `${c.label} skills (${c.description}): ${list.map((s) => `${s.name} — ${s.note}`).join(" ")}`,
    });
  }

  for (const p of projects) {
    chunks.push({
      id: `project-${p.slug}`,
      title: p.title,
      href: "#projects",
      text: [
        `${p.title}: ${p.description}`,
        p.overview,
        `Problem: ${p.problem}`,
        `Solution: ${p.solution}`,
        `Tech stack: ${p.tech.join(", ")}.`,
        ...real(p.features).map((f) => `Feature: ${f.replace(/[.\s]*$/, ".")}`),
        ...real(p.results).map((r) => `Result: ${r.replace(/[.\s]*$/, ".")}`),
        ...real([p.liveUrl]).map((u) => `Live demo: ${u}`),
      ].join(" "),
    });
  }

  for (const e of [...experience, ...education]) {
    chunks.push({
      id: `journey-${e.id}`,
      title: `${String(e.title)} — ${String(e.organisation)}`,
      href: "#journey",
      text: [
        `${e.kind === "education" ? "Studied: " : "Worked as "}${String(e.title)} at ${String(e.organisation)} (${String(e.period)}${e.location ? `, ${String(e.location)}` : ""}).`,
        String(e.summary),
        ...real(e.highlights).map((h) => h.replace(/[.\s]*$/, ".")),
      ].join(" "),
    });
  }

  chunks.push({
    id: "process",
    title: "How Aloke builds",
    href: "#process",
    text: pipeline.map((s) => `${s.label}: ${s.description}`).join(" "),
  });

  return chunks;
}

// ------------------------------------------------------------------ BM25

const STOP = new Set(
  "a an and are as at be by can could did do does for from had has have he him his how i if in is it its me my of on or our she so that the their them they this to was we were what when where which who why will with would you your aloke aloke's alokes use used using uses any about tell know does ever".split(" "),
);
const SYN: Record<string, string> = { pytorch: "torch", tensorflow: "torch", job: "work", jobs: "work", worked: "work", internship: "intern", internships: "intern", degree: "study", studied: "study", university: "study", college: "study", llm: "llms", ml: "machine" };

export function tokenize(text: string): string[] {
  return (text.toLowerCase().match(/[a-z0-9+#.]+/g) ?? [])
    .map((t) => t.replace(/\.+$/, ""))
    .filter((t) => t.length > 1 && !STOP.has(t))
    .map((t) => SYN[t] ?? t)
    .map((t) => (t.length > 4 ? t.replace(/(ing|ies|es|ed|s)$/, "") : t));
}

type Index = { chunks: Chunk[]; docs: string[][]; df: Map<string, number>; avg: number };
let index: Index | null = null;

function getIndex(): Index {
  if (index) return index;
  const chunks = buildChunks();
  const docs = chunks.map((c) => tokenize(`${c.title} ${c.title} ${c.text}`));
  const df = new Map<string, number>();
  for (const d of docs) for (const t of new Set(d)) df.set(t, (df.get(t) ?? 0) + 1);
  const avg = docs.reduce((a, d) => a + d.length, 0) / docs.length;
  index = { chunks, docs, df, avg };
  return index;
}

export function idf(term: string) {
  const { df, chunks } = getIndex();
  const n = df.get(term) ?? 0;
  return Math.log(1 + (chunks.length - n + 0.5) / (n + 0.5));
}

export function search(query: string, k = 4) {
  const { chunks, docs, avg } = getIndex();
  const q = [...new Set(tokenize(query))];
  const k1 = 1.4;
  const b = 0.75;
  const scored = docs.map((d, i) => {
    let score = 0;
    for (const t of q) {
      const tf = d.filter((x) => x === t).length;
      if (!tf) continue;
      score += idf(t) * ((tf * (k1 + 1)) / (tf + k1 * (1 - b + (b * d.length) / avg)));
    }
    return { chunk: chunks[i], score };
  });
  return { terms: q, hits: scored.filter((s) => s.score > 0).sort((a, b2) => b2.score - a.score).slice(0, k) };
}

/** Share of the question's (idf-weighted) terms that a chunk actually contains. */
export function coverage(terms: string[], chunk: Chunk) {
  const toks = new Set(tokenize(`${chunk.title} ${chunk.text}`));
  const total = terms.reduce((a, t) => a + idf(t), 0) || 1;
  return terms.reduce((a, t) => a + (toks.has(t) ? idf(t) : 0), 0) / total;
}

/** Best supporting sentences from the retrieved chunks, for a no-LLM answer. */
export function extractive(terms: string[], hits: { chunk: Chunk; score: number }[], max = 3) {
  const best = hits[0]?.score ?? 0;
  const strong = hits.filter((h) => h.score >= best * 0.5);
  const sentences: { text: string; score: number; order: number }[] = [];
  strong.forEach((h, hi) => {
    // Terms already in the chunk's title say what it's about; the rest say which aspect is wanted
    // ("results", "tech stack", …), so sentences matching those are preferred.
    const titleToks = new Set(tokenize(h.chunk.title));
    const aspect = terms.filter((t) => !titleToks.has(t));
    const parts = h.chunk.text.split(/(?<=[.!?])\s+/);
    parts.forEach((sentence, si) => {
      const toks = new Set(tokenize(sentence));
      let s = 0;
      for (const t of terms) if (toks.has(t)) s += idf(t) * (aspect.includes(t) ? 2 : 0.5);
      if (s > 0) sentences.push({ text: sentence.trim(), score: s * (1 - hi * 0.15), order: hi * 100 + si });
    });
  });
  const top = Math.max(0, ...sentences.map((s) => s.score));
  const seen = new Set<string>();
  const picked = sentences
    .filter((s) => s.score >= top * 0.6)
    .sort((a, b) => b.score - a.score)
    .filter((s) => (seen.has(s.text) ? false : (seen.add(s.text), true)))
    .slice(0, max);
  // Too thin? Add the opening of the best chunk for context.
  if (picked.length < 2 && strong[0]) {
    const opening = strong[0].chunk.text.split(/(?<=[.!?])\s+/).slice(0, 2);
    for (const [i, o] of opening.entries()) if (!seen.has(o.trim())) picked.push({ text: o.trim(), score: 0, order: i - 1 });
  }
  return picked
    .slice(0, max)
    .sort((a, b) => a.order - b.order)
    .map((s) => s.text);
}
