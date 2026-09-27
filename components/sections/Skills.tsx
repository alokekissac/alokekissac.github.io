"use client";

import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight } from "lucide-react";
import { useMemo, useState, type CSSProperties } from "react";
import { Reveal } from "@/components/animations/Reveal";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects } from "@/data/projects";
import { skillCategories, skills, type Skill, type SkillCategoryId } from "@/data/skills";
import { EASE_OUT, cn } from "@/lib/utils";

type Filter = SkillCategoryId | "all";

/** Rings from inside out; each ring holds one or more categories. */
const RINGS: { categories: SkillCategoryId[]; radius: number; duration: number; reverse: boolean }[] = [
  { categories: ["languages"], radius: 0.2, duration: 110, reverse: false },
  { categories: ["frontend", "backend"], radius: 0.34, duration: 150, reverse: true },
  { categories: ["ai", "tools"], radius: 0.47, duration: 190, reverse: false },
];

const projectsFor = (skill: Skill) =>
  projects.filter((p) => p.tech.some((t) => t.toLowerCase() === skill.name.toLowerCase()));

const categoryLabel = (id: SkillCategoryId) => skillCategories.find((c) => c.id === id)?.label ?? id;

export function Skills() {
  const [filter, setFilter] = useState<Filter>("all");
  const [selected, setSelected] = useState<Skill>(skills[0]);

  const visible = useMemo(() => (filter === "all" ? skills : skills.filter((s) => s.category === filter)), [filter]);
  const usedIn = projectsFor(selected);

  const choose = (next: Filter) => {
    setFilter(next);
    const first = next === "all" ? skills[0] : skills.find((s) => s.category === next);
    if (first) setSelected(first);
  };

  const isDimmed = (s: Skill) => filter !== "all" && s.category !== filter;

  return (
    <section id="skills" aria-labelledby="skills-title" className="relative py-24 md:py-32">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/3 -z-10 h-[60vh] bg-[radial-gradient(50%_50%_at_70%_50%,rgb(142_162_255/0.08),transparent)]"
      />
      <div className="container-x grid items-center gap-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading
            id="skills-title"
            index="02"
            label="Skills"
            title={["A connected", "toolkit"]}
            accentWords={["connected"]}
            description="Languages, frameworks and tools I use — grouped by where they sit in a system. Pick a category or hover a node to see how each one is used."
            className="!mb-10"
          />

          {/* Filters */}
          <Reveal delay={0.1}>
            <div role="group" aria-label="Filter skills by category" className="flex flex-wrap gap-2">
              {(["all", ...skillCategories.map((c) => c.id)] as Filter[]).map((id) => {
                const isActive = filter === id;
                const count = id === "all" ? skills.length : skills.filter((s) => s.category === id).length;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => choose(id)}
                    aria-pressed={isActive}
                    className={cn(
                      "relative inline-flex min-h-10 items-center gap-2 rounded-full px-4 text-sm transition-colors duration-300",
                      isActive ? "text-ink" : "hairline text-muted hover:border-line-strong hover:text-fg",
                    )}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="skill-filter"
                        className="absolute inset-0 rounded-full bg-fg"
                        transition={{ type: "spring", stiffness: 380, damping: 32 }}
                      />
                    )}
                    <span className="relative">{id === "all" ? "All" : categoryLabel(id)}</span>
                    <span className={cn("relative font-mono text-[10px]", isActive ? "text-ink/60" : "text-subtle")}>
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </Reveal>

          {/* Detail panel */}
          <Reveal delay={0.2} className="mt-8">
            <div className="glass relative min-h-52 overflow-hidden rounded-2xl p-6" aria-live="polite">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selected.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3, ease: EASE_OUT }}
                >
                  <p className="eyebrow">{categoryLabel(selected.category)}</p>
                  <p className="mt-3 text-3xl font-medium tracking-tight">{selected.name}</p>
                  <p className="mt-3 text-sm leading-relaxed text-muted">{selected.note}</p>
                  {usedIn.length > 0 && (
                    <div className="mt-5">
                      <p className="eyebrow !text-[10px]">Used in</p>
                      <ul className="mt-2 flex flex-wrap gap-2">
                        {usedIn.map((p) => (
                          <li key={p.slug}>
                            <a
                              href="#projects"
                              className="inline-flex items-center gap-1 rounded-full border border-accent/25 bg-accent/10 px-3 py-1 text-xs text-accent transition-colors hover:bg-accent/20"
                            >
                              {p.title}
                              <ArrowUpRight size={12} aria-hidden="true" />
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Reveal>
        </div>

        {/* Orbit visual (md and up) */}
        <div className="lg:col-span-7">
          <Reveal className="orbit relative mx-auto hidden aspect-square w-full max-w-[680px] md:block" y={40}>
            <div aria-hidden="true" className="absolute inset-0">
              {RINGS.map((ring) => (
                <div
                  key={ring.radius}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-white/[0.08]"
                  style={{ width: `${ring.radius * 200}%`, height: `${ring.radius * 200}%` }}
                />
              ))}
              <div className="absolute top-1/2 left-1/2 h-1/3 w-1/3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent/10 blur-3xl" />
            </div>

            {/* Core */}
            <div className="absolute top-1/2 left-1/2 flex h-24 w-24 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full border border-line-strong bg-ink-2 shadow-[0_0_60px_-10px_rgb(142_162_255/0.5)]">
              <span className="font-serif text-2xl text-accent italic">A.</span>
              <span className="font-mono text-[9px] tracking-[0.2em] text-subtle uppercase">Core</span>
            </div>

            <ul className="absolute inset-0" aria-label="Skills">
              {RINGS.map((ring) => {
                const ringSkills = skills.filter((s) => ring.categories.includes(s.category));
                const style = {
                  "--orbit-duration": `${ring.duration}s`,
                  "--orbit-direction": ring.reverse ? "reverse" : "normal",
                  "--orbit-counter-direction": ring.reverse ? "normal" : "reverse",
                } as CSSProperties;
                return (
                  <li key={ring.radius} className="orbit-spin pointer-events-none absolute inset-0" style={style}>
                    <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
                      {ringSkills.map((s, i) => {
                        const angle = (i / ringSkills.length) * Math.PI * 2 + ring.radius * 10;
                        const active = filter === s.category || selected.name === s.name;
                        return (
                          <line
                            key={s.name}
                            x1="50"
                            y1="50"
                            x2={50 + Math.cos(angle) * ring.radius * 100}
                            y2={50 + Math.sin(angle) * ring.radius * 100}
                            stroke="rgb(142 162 255)"
                            strokeWidth="0.15"
                            className="transition-opacity duration-500"
                            opacity={active ? 0.45 : 0}
                          />
                        );
                      })}
                    </svg>
                    <ul>
                      {ringSkills.map((s, i) => {
                        const angle = (i / ringSkills.length) * Math.PI * 2 + ring.radius * 10;
                        const isSelected = selected.name === s.name;
                        const dim = isDimmed(s);
                        return (
                          <li
                            key={s.name}
                            className="absolute"
                            style={{
                              left: `${50 + Math.cos(angle) * ring.radius * 100}%`,
                              top: `${50 + Math.sin(angle) * ring.radius * 100}%`,
                            }}
                          >
                            <div className="-translate-x-1/2 -translate-y-1/2">
                            <div className="orbit-counter" style={style}>
                              <button
                                type="button"
                                onPointerEnter={() => setSelected(s)}
                                onFocus={() => setSelected(s)}
                                onClick={() => setSelected(s)}
                                aria-pressed={isSelected}
                                className={cn(
                                  "pointer-events-auto block rounded-full border px-3 py-1.5 text-xs whitespace-nowrap backdrop-blur-md transition-[opacity,background-color,border-color,color,box-shadow] duration-500 lg:text-[13px]",
                                  isSelected
                                    ? "border-accent/60 bg-accent/15 text-fg shadow-[0_0_24px_-4px_rgb(142_162_255/0.6)]"
                                    : "border-line-strong bg-ink-2/80 text-muted hover:border-accent/40 hover:text-fg",
                                  dim && "opacity-25",
                                )}
                              >
                                {s.name}
                              </button>
                            </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  </li>
                );
              })}
            </ul>
          </Reveal>

          {/* Mobile: compact cards */}
          <motion.ul layout className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:hidden" aria-label="Skills">
            <AnimatePresence initial={false}>
              {visible.map((s) => (
                <motion.li
                  key={s.name}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.25 }}
                >
                  <button
                    type="button"
                    onClick={() => setSelected(s)}
                    aria-pressed={selected.name === s.name}
                    className={cn(
                      "flex min-h-12 w-full items-center justify-between gap-2 rounded-xl border px-3.5 py-3 text-left text-sm transition-colors",
                      selected.name === s.name ? "border-accent/50 bg-accent/10 text-fg" : "border-line bg-white/[0.02] text-muted",
                    )}
                  >
                    {s.name}
                    <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" aria-hidden="true" />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </motion.ul>
        </div>
      </div>
    </section>
  );
}
