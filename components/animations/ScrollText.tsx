"use client";

import { motion, useScroll, useTransform, type MotionValue } from "motion/react";
import { useRef } from "react";
import { cn } from "@/lib/utils";

function Word({ children, progress, range }: { children: string; progress: MotionValue<number>; range: [number, number] }) {
  const opacity = useTransform(progress, range, [0.3, 1]);
  return (
    <motion.span style={{ opacity }} className="inline">
      {children}{" "}
    </motion.span>
  );
}

/** Paragraph whose words brighten one by one as it scrolls through the viewport. */
export function ScrollText({ text, className }: { text: string; className?: string }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "end 0.5"] });
  const words = text.split(" ");

  return (
    <p ref={ref} className={cn("relative", className)}>
      <span className="sr-only">{text}</span>
      <span aria-hidden="true">
        {words.map((word, i) => {
          const start = i / words.length;
          return (
            <Word key={i} progress={scrollYProgress} range={[start, start + 1 / words.length]}>
              {word}
            </Word>
          );
        })}
      </span>
    </p>
  );
}
