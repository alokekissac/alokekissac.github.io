"use client";

import { Brain, Code2, Globe, Plus, Sparkles, Workflow, type LucideIcon } from "lucide-react";
import { motion } from "motion/react";
import { useState } from "react";
import { Counter } from "@/components/animations/Counter";
import { Reveal, RevealGroup, itemVariants } from "@/components/animations/Reveal";
import { ScrollText } from "@/components/animations/ScrollText";
import { aboutIntro, focusAreas, type FocusIconName } from "@/data/about";
import { projects } from "@/data/projects";
import { skills } from "@/data/skills";
import { cn, pad } from "@/lib/utils";

const icons: Record<FocusIconName, LucideIcon> = {
  brain: Brain,
  code: Code2,
  globe: Globe,
  workflow: Workflow,
  sparkles: Sparkles,
};

// Every number here is derived from the site's own data — nothing invented.
const stats = [
  { value: projects.length, label: "Featured projects" },
  { value: skills.length, label: "Technologies in use" },
  { value: focusAreas.length, label: "Focus areas" },
];

export function About() {
  const [active, setActive] = useState(focusAreas[0].id);

  return (
    <section id="about" aria-labelledby="about-title" className="relative py-24 md:py-32">
      <div className="container-x grid gap-16 lg:grid-cols-12 lg:gap-12">
        {/* Left: statement */}
        <div className="lg:col-span-7">
          <Reveal y={12}>
            <p className="eyebrow flex items-center gap-3">
              <span className="text-accent">01</span>
              <span className="h-px w-8 bg-line-strong" aria-hidden="true" />
              {aboutIntro.eyebrow}
            </p>
          </Reveal>
          <h2 id="about-title" className="sr-only">
            About Aloke
          </h2>
          <ScrollText
            text={aboutIntro.statement}
            className="mt-6 text-[clamp(1.75rem,3.6vw,3.25rem)] leading-[1.12] font-medium tracking-[-0.03em] text-balance"
          />

          <div className="mt-12 grid max-w-2xl gap-6 text-base leading-relaxed text-muted md:grid-cols-2 md:text-[1.05rem]">
            {aboutIntro.paragraphs.map((p, i) => (
              <Reveal key={i} delay={i * 0.1}>
                <p>{p}</p>
              </Reveal>
            ))}
          </div>

          <RevealGroup as="ul" className="mt-14 grid max-w-2xl grid-cols-3 gap-4 border-t border-line pt-8">
            {stats.map((s) => (
              <motion.li key={s.label} variants={itemVariants}>
                <p className="text-[clamp(2rem,5vw,3.5rem)] leading-none font-medium tracking-tight">
                  <Counter value={s.value} />
                </p>
                <p className="mt-2 text-xs text-subtle md:text-sm">{s.label}</p>
              </motion.li>
            ))}
          </RevealGroup>
        </div>

        {/* Right: facts + focus cards */}
        <div className="lg:col-span-5">
          <RevealGroup as="dl" className="grid gap-px overflow-hidden rounded-2xl border border-line bg-line">
            {aboutIntro.facts.map((f) => (
              <motion.div key={f.label} variants={itemVariants} className="flex items-baseline justify-between gap-4 bg-ink-2 px-5 py-4">
                <dt className="eyebrow shrink-0">{f.label}</dt>
                <dd className="text-right">
                  <span className="block text-sm text-fg">{f.value}</span>
                  <span className="block text-xs text-subtle">{f.sub}</span>
                </dd>
              </motion.div>
            ))}
          </RevealGroup>

          <RevealGroup as="ul" className="mt-6 space-y-3">
            {focusAreas.map((area, i) => {
              const Icon = icons[area.icon];
              const isOpen = active === area.id;
              return (
                <motion.li key={area.id} variants={itemVariants}>
                  <button
                    type="button"
                    onClick={() => setActive(area.id)}
                    onPointerEnter={(e) => e.pointerType === "mouse" && setActive(area.id)}
                    onFocus={() => setActive(area.id)}
                    aria-expanded={isOpen}
                    aria-controls={`focus-${area.id}`}
                    className={cn(
                      "group relative w-full overflow-hidden rounded-2xl border p-5 text-left transition-[border-color,background-color] duration-500",
                      isOpen ? "border-line-strong bg-surface" : "border-line bg-white/[0.015] hover:border-line-strong",
                    )}
                  >
                    <span
                      aria-hidden="true"
                      className={cn(
                        "pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl transition-opacity duration-700",
                        isOpen ? "opacity-100" : "opacity-0",
                      )}
                    />
                    <span className="relative flex items-center gap-4">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border transition-colors duration-500",
                          isOpen ? "border-accent/40 bg-accent/10 text-accent" : "border-line text-muted",
                        )}
                      >
                        <Icon size={18} aria-hidden="true" />
                      </span>
                      <span className="flex-1">
                        <span className="block font-medium tracking-tight">{area.title}</span>
                        <span className="block text-sm text-subtle">{area.summary}</span>
                      </span>
                      <span className="font-mono text-xs text-subtle">{pad(i + 1)}</span>
                      <Plus
                        size={16}
                        aria-hidden="true"
                        className={cn("text-muted transition-transform duration-500", isOpen && "rotate-45")}
                      />
                    </span>
                    <span
                      id={`focus-${area.id}`}
                      className={cn(
                        "relative grid transition-[grid-template-rows,opacity] duration-500 ease-out-expo",
                        isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0",
                      )}
                    >
                      <span className="overflow-hidden">
                        <span className="block pt-4 pl-14 text-sm leading-relaxed text-muted">{area.detail}</span>
                      </span>
                    </span>
                  </button>
                </motion.li>
              );
            })}
          </RevealGroup>
        </div>
      </div>
    </section>
  );
}
