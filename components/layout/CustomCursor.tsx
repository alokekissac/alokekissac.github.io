"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type CursorState = "default" | "hover" | "view" | "open" | "text" | "hidden";

const LABELS: Partial<Record<CursorState, string>> = {
  view: "VIEW →",
  open: "OPEN ↗",
};

const INTERACTIVE = "a, button, [role='button'], [role='link'], summary, label, select, [data-cursor='hover']";

function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  const explicit = target.closest<HTMLElement>("[data-cursor]");
  if (explicit) {
    const value = explicit.dataset.cursor;
    if (value === "view" || value === "open" || value === "hover" || value === "hidden") return value;
  }
  if (target.closest("input, textarea, [contenteditable='true']")) return "text";
  const interactive = target.closest(INTERACTIVE);
  if (interactive) {
    if (interactive instanceof HTMLAnchorElement && interactive.target === "_blank") return "open";
    return "hover";
  }
  return "default";
}

/**
 * Dot + interpolated ring cursor for mouse/trackpad users only.
 * Positions are written straight to the DOM in rAF to avoid React re-renders.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!fine) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };
    let raf = 0;
    let lastState: CursorState = "default";

    const tick = () => {
      const ease = reduce ? 1 : 0.18;
      ring.x += (target.x - ring.x) * ease;
      ring.y += (target.y - ring.y) * ease;
      if (dotRef.current) dotRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX;
      target.y = e.clientY;
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const next = resolveState(e.target);
      if (next !== lastState) {
        lastState = next;
        setState(next);
      }
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
    };
  }, [fine]);

  if (!fine) return null;

  const label = LABELS[state];
  const ringSize = label ? 92 : state === "hover" ? 56 : state === "text" ? 4 : 34;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300", visible && state !== "hidden" && state !== "text" ? "opacity-100" : "opacity-0")}>
      <div ref={ringRef} className="absolute top-0 left-0 will-change-transform">
        <div
          className={cn(
            "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color,scale] duration-300 ease-out-expo",
            label
              ? "border-transparent bg-fg text-ink"
              : state === "hover"
                ? "border-accent/60 bg-accent/10"
                : "border-white/35 bg-transparent",
          )}
          style={{ width: ringSize, height: ringSize, scale: pressed ? 0.85 : 1 }}
        >
          <span
            className={cn(
              "font-mono text-[10px] font-semibold tracking-[0.14em] whitespace-nowrap transition-opacity duration-200",
              label ? "opacity-100 delay-100" : "opacity-0",
            )}
          >
            {label}
          </span>
        </div>
      </div>
      <div ref={dotRef} className="absolute top-0 left-0 will-change-transform">
        <div
          className={cn(
            "h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-fg transition-opacity duration-200",
            label || state === "text" ? "opacity-0" : "opacity-100",
          )}
        />
      </div>
    </div>
  );
}
