"use client";

import { motion, useScroll, useSpring } from "motion/react";
import { Briefcase, GraduationCap, type LucideIcon } from "lucide-react";
import { useRef } from "react";
import { Text } from "@/components/ui/Text";
import type { TimelineEntry, TimelineKind } from "@/data/experience";
import { EASE_OUT, cn } from "@/lib/utils";

const kindMeta: Record<TimelineKind, { label: string; icon: LucideIcon }> = {
  work: { label: "Work", icon: Briefcase },
  education: { label: "Education", icon: GraduationCap },
};

export function EntryCard({ entry, arrived = false }: { entry: TimelineEntry; arrived?: boolean }) {
  const { label, icon: Icon } = kindMeta[entry.kind];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-ink-2 p-6 transition-[border-color,box-shadow] duration-700 hover:border-line-strong md:p-7",
        arrived ? "journey-arrived border-transparent" : "border-line",
      )}
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-accent/10 opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-100"
      />
      <div className="relative flex flex-wrap items-center gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full border border-line px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-muted uppercase">
          <Icon size={12} aria-hidden="true" />
          {label}
        </span>
        {entry.current && (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-signal/30 bg-signal/10 px-2.5 py-1 font-mono text-[10px] tracking-[0.14em] text-signal uppercase">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-signal" aria-hidden="true" />
            Current
          </span>
        )}
      </div>
      <h3 className="relative mt-4 text-xl font-medium tracking-tight md:text-2xl">
        <Text value={entry.title} />
      </h3>
      <p className="relative mt-1 text-accent">
        <Text value={entry.organisation} />
      </p>
      <p className="relative mt-2 font-mono text-xs text-subtle">
        <Text value={entry.period} />
        {entry.location && (
          <>
            {" · "}
            <Text value={entry.location} />
          </>
        )}
      </p>
      <p className="relative mt-4 text-[15px] leading-relaxed text-muted">
        <Text value={entry.summary} />
      </p>
      {entry.highlights && (
        <ul className="relative mt-4 space-y-2">
          {entry.highlights.map((h, i) => (
            <li key={i} className="flex gap-3 text-sm text-muted">
              <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
              <span>
                <Text value={h} />
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Timeline({ entries }: { entries: TimelineEntry[] }) {
  const ref = useRef<HTMLOListElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 70%", "end 60%"] });
  const scaleY = useSpring(scrollYProgress, { stiffness: 120, damping: 24, mass: 0.3 });

  return (
    <div className="mx-auto max-w-5xl">
      <ol ref={ref} className="relative">
        {/* Track + scroll-drawn progress */}
        <span aria-hidden="true" className="absolute top-0 bottom-0 left-[15px] w-px bg-line md:left-1/2" />
        <motion.span
          aria-hidden="true"
          className="absolute top-0 bottom-0 left-[15px] w-px origin-top bg-gradient-to-b from-accent to-accent-2 md:left-1/2"
          style={{ scaleY }}
        />

        {entries.map((entry, i) => {
          const right = i % 2 === 1;
          return (
            <li
              key={entry.id}
              className="relative grid pb-12 pl-12 last:pb-0 md:grid-cols-2 md:gap-16 md:pl-0"
            >
              <span
                aria-hidden="true"
                className="absolute top-7 left-[9px] z-10 h-[13px] w-[13px] rounded-full border-2 border-accent bg-ink shadow-[0_0_0_5px_rgb(6_6_10)] md:left-[calc(50%-6px)]"
              />
              <motion.div
                className={cn(right ? "md:col-start-2" : "md:col-start-1")}
                initial={{ opacity: 0, x: right ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                transition={{ duration: 0.7, ease: EASE_OUT }}
              >
                <EntryCard entry={entry} />
              </motion.div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
