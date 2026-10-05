"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "motion/react";
import { ArrowUpRight, Moon, Sun, Sunrise, Sunset } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import { DaySky, type DaySkyHandle } from "@/components/skills/DaySky";
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

/** A day in the life: as you scroll, the clock runs 06:00 → 24:00 and each part of the day lights up the skills it uses. */
const DAY: { from: number; label: string; caption: string; filter: Filter; icon: typeof Sun }[] = [
  { from: 6, label: "Morning", caption: "Coffee, git pull, plan the day.", filter: "tools", icon: Sunrise },
  { from: 9, label: "Deep work", caption: "Writing Python and the core logic.", filter: "languages", icon: Sun },
  { from: 12.5, label: "Afternoon", caption: "Training models and tuning RAG pipelines.", filter: "ai", icon: Sun },
  { from: 15.5, label: "Shipping", caption: "Wiring APIs, databases and deploys.", filter: "backend", icon: Sun },
  { from: 18.5, label: "Evening", caption: "Polishing interfaces, like this one.", filter: "frontend", icon: Sunset },
  { from: 21.5, label: "Night", caption: "Side projects, papers and automations.", filter: "all", icon: Moon },
];
const phaseAt = (h: number) => DAY.reduce((acc, p, i) => (h >= p.from ? i : acc), 0);
const fmt = (h: number) => {
  const mins = Math.min(23 * 60 + 55, Math.round((h * 60) / 5) * 5);
  return `${String(Math.floor(mins / 60)).padStart(2, "0")}:${String(mins % 60).padStart(2, "0")}`;
};

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

  // ---- Day cycle, driven by scroll through the (pinned on desktop) section
  const sectionRef = useRef<HTMLElement>(null);
  const skyRef = useRef<DaySkyHandle>(null);
  const timeRef = useRef<HTMLSpanElement>(null);
  const [phase, setPhase] = useState(0);
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  const applyHour = (p: number) => {
    const h = 6 + Math.max(0, Math.min(1, p)) * 18;
    skyRef.current?.setHour(h);
    if (timeRef.current) timeRef.current.textContent = fmt(h);
    const next = phaseAt(h);
    setPhase((prev) => (prev === next ? prev : next));
  };
  useMotionValueEvent(scrollYProgress, "change", applyHour);
  useEffect(() => {
    applyHour(scrollYProgress.get());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // On desktop, each part of the day highlights its skills (clicking a filter still works).
  useEffect(() => {
    if (!window.matchMedia("(min-width: 1024px)").matches) return;
    choose(DAY[phase].filter);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);
  const PhaseIcon = DAY[phase].icon;

  return (
    <section id="skills" ref={sectionRef} aria-labelledby="skills-title" className="relative lg:h-[280vh]">
      <div className="relative py-24 md:py-32 lg:sticky lg:top-0 lg:flex lg:h-screen lg:items-center lg:py-0 lg:pt-16">
      <DaySky ref={skyRef} />

      <div className="container-x relative z-10 grid w-full items-center gap-14 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <SectionHeading
            id="skills-title"
            index="03"
            label="Skills"
            title={["A connected", "toolkit"]}
            accentWords={["connected"]}
            description="A day in my life, in skills. Scroll to run the clock, or pick a category and hover a node to see how each one is used."
            className="!mb-8"
          />

          {/* Clock: a day in the life */}
          <div className="mb-6 flex items-center gap-4 rounded-2xl border border-line bg-ink/40 p-4 backdrop-blur-md">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-line-strong text-[var(--day-accent,#ffd36b)]">
              <PhaseIcon size={18} aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="flex items-baseline gap-2">
                <span ref={timeRef} className="font-mono text-2xl text-fg tabular-nums">06:00</span>
                <span className="eyebrow">{DAY[phase].label}</span>
              </p>
              <AnimatePresence mode="wait">
                <motion.p
                  key={phase}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.25 }}
                  className="truncate text-sm text-muted"
                >
                  {DAY[phase].caption}
                </motion.p>
              </AnimatePresence>
            </div>
            <span className="ml-auto hidden font-mono text-[10px] tracking-[0.14em] text-subtle uppercase lg:block">
              Scroll ↓
            </span>
          </div>

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
          <Reveal className="orbit relative mx-auto hidden aspect-square w-full max-w-[min(680px,74vh)] md:block" y={40}>
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
      </div>
    </section>
  );
}
