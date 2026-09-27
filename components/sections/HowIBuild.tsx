"use client";

import { AnimatePresence, motion, useInView, useScroll, useSpring } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { pipeline, type PipelineStep } from "@/data/pipeline";
import { EASE_OUT, cn, pad } from "@/lib/utils";

function Step({ step, index, active, onActive }: { step: PipelineStep; index: number; active: boolean; onActive: (i: number) => void }) {
  const ref = useRef<HTMLLIElement>(null);
  const inView = useInView(ref, { margin: "-45% 0px -45% 0px" });

  useEffect(() => {
    if (inView) onActive(index);
  }, [inView, index, onActive]);

  return (
    <li ref={ref} className="relative pb-14 pl-14 last:pb-0 md:pl-20">
      {/* Node on the line */}
      <span
        aria-hidden="true"
        className={cn(
          "absolute top-1 left-[11px] flex h-[18px] w-[18px] items-center justify-center rounded-full border bg-ink transition-all duration-500 md:left-[19px]",
          active ? "border-accent shadow-[0_0_0_6px_rgb(142_162_255/0.15),0_0_24px_rgb(142_162_255/0.6)]" : "border-line-strong",
        )}
      >
        <span className={cn("h-1.5 w-1.5 rounded-full transition-colors duration-500", active ? "bg-accent" : "bg-white/20")} />
      </span>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: "0px 0px -15% 0px" }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className={cn("transition-opacity duration-500", active ? "opacity-100" : "md:opacity-50")}
      >
        <p className="font-mono text-xs text-subtle">
          {pad(index + 1)} <span className="text-accent">/</span> {pad(pipeline.length)}
        </p>
        <h3 className="mt-2 text-2xl font-medium tracking-tight md:text-3xl">{step.label}</h3>
        <p className="mt-3 font-serif text-xl leading-snug text-fg/85 italic md:text-2xl">“{step.question}”</p>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-muted">{step.description}</p>
        <ul className="mt-4 flex flex-wrap gap-1.5" aria-label="Outputs">
          {step.outputs.map((o) => (
            <li key={o} className="rounded-md border border-line bg-white/[0.02] px-2 py-1 font-mono text-[11px] text-muted">
              {o}
            </li>
          ))}
        </ul>
      </motion.div>
    </li>
  );
}

export function HowIBuild() {
  const [active, setActive] = useState(0);
  const listRef = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 55%", "end 55%"] });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });
  const current = pipeline[active];

  return (
    <section id="process" aria-labelledby="process-title" className="relative py-24 md:py-32">
      <div className="container-x grid gap-12 lg:grid-cols-12">
        {/* Sticky summary */}
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-32">
            <SectionHeading
              id="process-title"
              index="04"
              label="Process"
              title={["How I", "build"]}
              accentWords={["build"]}
              description="Good AI products are mostly good engineering. This is the path I follow from an idea to something running in production — and the question I ask at each stage."
              className="!mb-10"
            />

            {/* Mini pipeline map */}
            <div className="hidden lg:block" aria-hidden="true">
              <div className="flex items-center gap-1.5">
                {pipeline.map((s, i) => (
                  <span
                    key={s.id}
                    className={cn(
                      "h-1 flex-1 rounded-full transition-colors duration-500",
                      i <= active ? "bg-accent" : "bg-white/10",
                    )}
                  />
                ))}
              </div>
              <div className="mt-8 flex items-end gap-5">
                <span className="font-serif text-8xl leading-[0.8] text-accent italic tabular-nums">{pad(active + 1)}</span>
                <div className="relative h-14 flex-1 overflow-hidden">
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.p
                      key={current.id}
                      initial={{ y: "100%", opacity: 0 }}
                      animate={{ y: "0%", opacity: 1 }}
                      exit={{ y: "-100%", opacity: 0 }}
                      transition={{ duration: 0.4, ease: EASE_OUT }}
                      className="absolute inset-x-0 bottom-0 text-4xl font-medium tracking-tight"
                    >
                      {current.label}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>
              <ol className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-1 font-mono text-[11px] text-subtle">
                {pipeline.map((s, i) => (
                  <li key={s.id} className="flex items-center gap-2">
                    <span className={cn("transition-colors duration-300", i === active && "text-fg")}>{s.label}</span>
                    {i < pipeline.length - 1 && <span className="text-white/20">→</span>}
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="lg:col-span-7">
          <ol ref={listRef} className="relative">
            <span aria-hidden="true" className="absolute top-2 bottom-2 left-[19px] w-px bg-line md:left-[27px]" />
            <motion.span
              aria-hidden="true"
              className="absolute top-2 bottom-2 left-[19px] w-px origin-top bg-gradient-to-b from-accent via-accent-2 to-accent md:left-[27px]"
              style={{ scaleY: progress }}
            />
            {pipeline.map((step, i) => (
              <Step key={step.id} step={step} index={i} active={i === active} onActive={setActive} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
