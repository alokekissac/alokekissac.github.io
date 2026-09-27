"use client";

import { motion, useMotionValue, useSpring, useReducedMotion } from "motion/react";
import { useRef, type PointerEvent, type ReactNode } from "react";
import { useFinePointer } from "@/lib/hooks";

type MagneticProps = {
  children: ReactNode;
  /** How far (0–1) the element follows the pointer. */
  strength?: number;
  className?: string;
};

/** Pulls its child gently toward the pointer. Inert on touch / reduced motion. */
export function Magnetic({ children, strength = 0.3, className }: MagneticProps) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const fine = useFinePointer();
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18, mass: 0.4 });
  const sy = useSpring(y, { stiffness: 220, damping: 18, mass: 0.4 });
  const enabled = fine && !reduce;

  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!enabled || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((e.clientY - (rect.top + rect.height / 2)) * strength);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      className={className ?? "inline-block"}
      style={enabled ? { x: sx, y: sy } : undefined}
      onPointerMove={onMove}
      onPointerLeave={reset}
    >
      {children}
    </motion.div>
  );
}
