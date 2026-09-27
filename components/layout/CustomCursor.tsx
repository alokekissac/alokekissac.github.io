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

/** Ember colours, taken from the site palette so the flame matches the blue wormhole backdrop. */
const EMBER = ["255,255,255", "201,209,255", "142,162,255", "182,156,255"];

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

type Ember = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; c: string };

/**
 * Blue plasma-flame cursor with a rising ember trail, for mouse/trackpad users only.
 * The flame leans against the direction of travel like a real flame, and a lagging
 * halo/label pill handles hover states. Everything is written to the DOM/canvas in rAF.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const flameRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [state, setState] = useState<CursorState>("default");
  const [visible, setVisible] = useState(false);
  const [pressed, setPressed] = useState(false);

  useEffect(() => {
    if (!fine) return;
    const root = document.documentElement;
    root.classList.add("has-custom-cursor");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d") ?? null;
    let dpr = 1;
    const resize = () => {
      if (!canvas) return;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const ring = { ...target };
    const last = { ...target };
    let tilt = 0;
    let raf = 0;
    let frame = 0;
    let active = false;
    let lastState: CursorState = "default";
    const embers: Ember[] = [];

    const spawn = (n: number, spread: number, burst = false) => {
      for (let i = 0; i < n && embers.length < 160; i++) {
        const a = burst ? Math.random() * Math.PI * 2 : 0;
        const s = burst ? 1 + Math.random() * 2.5 : 0;
        embers.push({
          x: target.x + (Math.random() - 0.5) * spread,
          y: target.y - 4 + (Math.random() - 0.5) * spread * 0.5,
          vx: burst ? Math.cos(a) * s : (Math.random() - 0.5) * 0.5,
          vy: burst ? Math.sin(a) * s - 0.6 : -(0.5 + Math.random() * 1.1),
          life: 1,
          decay: 0.018 + Math.random() * 0.025,
          size: 0.8 + Math.random() * 1.8,
          c: EMBER[(Math.random() * EMBER.length) | 0],
        });
      }
    };

    const tick = () => {
      frame++;
      const dx = target.x - last.x;
      const dy = target.y - last.y;
      last.x = target.x;
      last.y = target.y;

      // Flame leans away from the direction of travel, then settles back upright.
      const lean = Math.max(-38, Math.min(38, -dx * 1.6));
      tilt += (lean - tilt) * (reduce ? 1 : 0.15);

      const ease = reduce ? 1 : 0.18;
      ring.x += (target.x - ring.x) * ease;
      ring.y += (target.y - ring.y) * ease;
      if (flameRef.current) flameRef.current.style.transform = `translate3d(${target.x}px, ${target.y}px, 0) rotate(${tilt.toFixed(2)}deg)`;
      if (ringRef.current) ringRef.current.style.transform = `translate3d(${ring.x}px, ${ring.y}px, 0)`;

      if (ctx && canvas && !reduce) {
        const dist = Math.hypot(dx, dy);
        if (active) {
          if (dist > 0.5) spawn(Math.min(4, Math.ceil(dist / 7)), 8);
          else if (frame % 5 === 0) spawn(1, 6);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "lighter";
        for (let i = embers.length - 1; i >= 0; i--) {
          const p = embers[i];
          p.x += p.vx + Math.sin((frame + i * 13) * 0.08) * 0.25;
          p.y += p.vy;
          p.vy -= 0.012;
          p.vx *= 0.97;
          p.life -= p.decay;
          if (p.life <= 0) {
            embers.splice(i, 1);
            continue;
          }
          const r = p.size * (0.4 + p.life * 0.6);
          ctx.fillStyle = `rgba(${p.c},${(p.life * 0.18).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r * 3.2, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(${p.c},${(p.life * 0.9).toFixed(3)})`;
          ctx.beginPath();
          ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(tick);
    };

    const onMove = (e: PointerEvent) => {
      if (e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      target.x = e.clientX;
      target.y = e.clientY;
      active = true;
      setVisible(true);
    };
    const onOver = (e: PointerEvent) => {
      const next = resolveState(e.target);
      if (next !== lastState) {
        lastState = next;
        setState(next);
      }
    };
    const onLeave = () => {
      active = false;
      setVisible(false);
    };
    const onDown = () => {
      setPressed(true);
      if (!reduce) spawn(18, 4, true);
    };
    const onUp = () => setPressed(false);

    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      root.classList.remove("has-custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      document.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("resize", resize);
    };
  }, [fine]);

  if (!fine) return null;

  const label = LABELS[state];
  const hover = state === "hover";
  const ringSize = label ? 92 : hover ? 54 : 30;
  const flameScale = pressed ? 0.8 : label ? 0.7 : hover ? 1.3 : 1;

  return (
    <div aria-hidden="true" className={cn("pointer-events-none fixed inset-0 z-[100] transition-opacity duration-300", visible && state !== "hidden" && state !== "text" ? "opacity-100" : "opacity-0")}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div ref={ringRef} className="absolute top-0 left-0 will-change-transform">
        <div
          className={cn(
            "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color,box-shadow,opacity] duration-300 ease-out-expo",
            label
              ? "border-transparent bg-fg text-ink"
              : hover
                ? "border-accent/50 bg-accent/10 shadow-[0_0_24px_rgba(142,162,255,0.35)]"
                : "border-transparent bg-[radial-gradient(circle,rgba(142,162,255,0.22),transparent_70%)]",
          )}
          style={{ width: ringSize, height: ringSize }}
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

      {/* Flame: base sits on the pointer; rotation is applied around that point. */}
      <div ref={flameRef} className="absolute top-0 left-0 will-change-transform" style={{ transformOrigin: "0 0" }}>
        <div
          className={cn("cursor-flame transition-[scale,opacity] duration-300 ease-out-expo", state === "text" && "opacity-0")}
          style={{ scale: flameScale }}
        >
          <svg viewBox="0 0 24 32" width="22" height="29">
            <defs>
              <linearGradient id="flame-outer" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#8ea2ff" />
                <stop offset="0.55" stopColor="#7b6cff" />
                <stop offset="1" stopColor="#b69cff" stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="flame-inner" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.6" stopColor="#c9d1ff" />
                <stop offset="1" stopColor="#8ea2ff" stopOpacity="0.4" />
              </linearGradient>
            </defs>
            <path
              className="cursor-flame-outer"
              fill="url(#flame-outer)"
              d="M12 1.5C13.2 6.5 19.5 10.5 19.5 19A7.5 7.5 0 0 1 4.5 19C4.5 14.5 7 11.8 8.6 9.2c.4 2.3 1.4 3.6 2.7 4.1C11 9.4 10.6 5.6 12 1.5Z"
            />
            <path
              className="cursor-flame-inner"
              fill="url(#flame-inner)"
              d="M12 11.5c1 3 4.3 5.2 4.3 9.3a4.3 4.3 0 0 1-8.6 0c0-2.5 1.3-3.7 2.2-5.1.3 1.2.9 2 1.6 2.3 0-2.4-.2-4.2.5-6.5Z"
            />
            <ellipse cx="12" cy="23" rx="2.3" ry="3" fill="#fff" />
          </svg>
        </div>
      </div>
    </div>
  );
}
