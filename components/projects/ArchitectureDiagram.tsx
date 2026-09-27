"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { Text } from "@/components/ui/Text";
import type { ArchitectureLane } from "@/data/projects";
import { EASE_OUT } from "@/lib/utils";

/**
 * Animated flow diagram: nodes appear in sequence while connectors draw
 * between them, then a signal dot loops along each connector.
 * Horizontal on wide screens, vertical on narrow ones.
 */
export function ArchitectureDiagram({ lanes, hue }: { lanes: ArchitectureLane[]; hue: number }) {
  const accent = `hsl(${hue} 90% 72%)`;

  return (
    <div className="space-y-8">
      {lanes.map((lane, laneIndex) => (
        <figure key={lane.title} className="rounded-2xl border border-line bg-white/[0.015] p-5 md:p-6">
          <figcaption className="eyebrow mb-5 !text-[10px]">{lane.title}</figcaption>
          <ol className="flex flex-col items-stretch gap-0 sm:flex-row sm:items-center">
            {lane.steps.map((step, i) => {
              const delay = laneIndex * 0.4 + i * 0.22;
              return (
                <Fragment key={step.label}>
                  <motion.li
                    className="relative flex-1 rounded-xl border border-line-strong bg-ink-2 px-4 py-3"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.45, ease: EASE_OUT, delay: 0.3 + delay }}
                  >
                    <span className="block font-mono text-[10px] text-subtle">{String(i + 1).padStart(2, "0")}</span>
                    <span className="mt-1 block text-sm font-medium">{step.label}</span>
                    <span className="mt-0.5 block text-xs leading-snug text-muted">
                      <Text value={step.detail} />
                    </span>
                  </motion.li>
                  {i < lane.steps.length - 1 && (
                    <li aria-hidden="true" className="relative flex h-8 w-full shrink-0 items-center justify-center sm:h-auto sm:w-10">
                      {/* Connector (vertical on mobile, horizontal on sm+) */}
                      <motion.span
                        className="absolute h-full w-px origin-top sm:h-px sm:w-full sm:origin-left"
                        style={{ background: `hsl(${hue} 90% 72% / 0.5)` }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.35, ease: EASE_OUT, delay: 0.55 + delay }}
                      />
                      <span
                        className="flow-dot absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                        style={{ background: accent, boxShadow: `0 0 10px ${accent}`, animationDelay: `${1 + delay}s` }}
                      />
                    </li>
                  )}
                </Fragment>
              );
            })}
          </ol>
        </figure>
      ))}
    </div>
  );
}
