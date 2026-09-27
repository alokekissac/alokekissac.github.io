"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef } from "react";
import { EASE_OUT, pad } from "@/lib/utils";

/** Counts up to `value` once visible. Renders the final value on the server. */
export function Counter({ value, padTo = 2, duration = 1.2 }: { value: number; padTo?: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "0px 0px -10% 0px" });
  const reduce = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!inView || !el || reduce) return;
    const controls = animate(0, value, {
      duration,
      ease: EASE_OUT,
      onUpdate: (v) => {
        el.textContent = pad(Math.round(v), padTo);
      },
    });
    return () => controls.stop();
  }, [inView, value, padTo, duration, reduce]);

  return (
    <span ref={ref} className="tabular-nums">
      {pad(value, padTo)}
    </span>
  );
}
