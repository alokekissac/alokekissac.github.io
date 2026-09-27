"use client";

import { motion } from "motion/react";
import { Fragment } from "react";
import { EASE_OUT, cn } from "@/lib/utils";

type SplitTextProps = {
  /** Each entry renders on its own line. */
  lines: string[];
  className?: string;
  lineClassName?: string;
  /** Per-line classes, applied in addition to `lineClassName`. */
  lineClassNames?: string[];
  /** Delay before the first word animates (s). */
  delay?: number;
  stagger?: number;
  /** Animate on mount instead of when scrolled into view. */
  immediate?: boolean;
  /** Words rendered in the italic serif accent style. */
  accentWords?: string[];
};

const ACCENT = "font-serif font-normal tracking-normal text-accent italic pr-[0.06em]";

/**
 * Masked word-by-word reveal. With `immediate`, the reveal runs in CSS on load
 * (no hydration wait); otherwise Motion plays it when scrolled into view.
 * A visually hidden copy of the full text is what screen readers announce,
 * so they don't read it word by word.
 */
export function SplitText({
  lines,
  className,
  lineClassName,
  lineClassNames = [],
  delay = 0,
  stagger = 0.06,
  immediate = false,
  accentWords = [],
}: SplitTextProps) {
  let index = 0;

  return (
    <motion.span
      className={cn("block", className)}
      initial={immediate ? false : "hidden"}
      whileInView={immediate ? undefined : "show"}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
    >
      <span className="sr-only">{lines.join(" ")}</span>
      {lines.map((line, li) => (
        <span key={li} className={cn("block", lineClassName, lineClassNames[li])} aria-hidden="true">
          {line.split(" ").map((word, wi, arr) => {
            const i = index++;
            return (
              <Fragment key={wi}>
                <span className="inline-block overflow-hidden pb-[0.12em] -mb-[0.12em] align-bottom">
                  {immediate ? (
                    <span
                      className={cn("word-up inline-block", accentWords.includes(word) && ACCENT)}
                      style={{ animationDelay: `${delay + i * stagger}s` }}
                    >
                      {word}
                    </span>
                  ) : (
                    <motion.span
                      className={cn("inline-block will-change-transform", accentWords.includes(word) && ACCENT)}
                      variants={{
                        hidden: { y: "110%" },
                        show: { y: "0%", transition: { duration: 0.7, ease: EASE_OUT, delay: delay + i * stagger } },
                      }}
                    >
                      {word}
                    </motion.span>
                  )}
                </span>
                {wi < arr.length - 1 && " "}
              </Fragment>
            );
          })}
        </span>
      ))}
    </motion.span>
  );
}
