"use client";

import { useEffect, useRef, useState } from "react";
import { useFinePointer } from "@/lib/hooks";
import { cn } from "@/lib/utils";

type CursorState = "default" | "hover" | "view" | "open" | "text" | "hidden";

/** No text labels: links and buttons glow themselves instead (see .btn-glow). */
const LABELS: Partial<Record<CursorState, string>> = {};

const INTERACTIVE = "a, button, [role='button'], [role='link'], summary, label, select, [data-cursor='hover']";

/**
 * Flame palette per page section: base, mid, tip, inner core.
 * The flame (and its embers + comet tail) re-colours as the pointer crosses sections.
 */
type Theme = [string, string, string, string];
const HOME: Theme = ["#8ea2ff", "#7b6cff", "#b69cff", "#c9d1ff"];
const THEMES: Record<string, Theme> = {
  home: HOME,
  about: ["#5ecbff", "#3a8dff", "#9fe8ff", "#d6f4ff"],
  skills: ["#b69cff", "#8b5cf6", "#e0b3ff", "#ecdcff"],
  projects: ["#ff7ad9", "#b44cff", "#ffb3ec", "#ffe0f5"],
  process: ["#ffb547", "#ff5a2d", "#ffd98a", "#fff1c9"],
  experience: ["#2dd4bf", "#0ea5a0", "#99f6e4", "#d5fff8"],
  education: ["#ffd36b", "#f0a030", "#fff0b3", "#fff8e0"],
  github: ["#5ee6b8", "#22b36a", "#a8ffe0", "#dcfff1"],
  contact: HOME,
};
const SECTION_IDS = Object.keys(THEMES);

/** HSL (deg, %, %) → #rrggbb */
function hslHex(h: number, sPct: number, lPct: number) {
  const s = sPct / 100;
  const l = lPct / 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return "#" + [f(0), f(8), f(4)].map((v) => Math.round(v * 255).toString(16).padStart(2, "0")).join("");
}
/** Flame palette for a project card, from the card's hue (matches its burning border). */
const hueTheme = (h: number): Theme => [hslHex(h, 95, 62), hslHex((h + 25) % 360, 85, 52), hslHex(h, 100, 80), hslHex(h, 100, 90)];

const hexRgb = (h: string) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
/** Ember colours in "r,g,b" form: white-hot, core, base, tip. */
const emberSet = (t: Theme) => ["255,255,255", t[3], t[0], t[2]].map((c) => (c.startsWith("#") ? hexRgb(c).join(",") : c));

function resolveState(target: EventTarget | null): CursorState {
  if (!(target instanceof Element)) return "default";
  const explicit = target.closest<HTMLElement>("[data-cursor]");
  if (explicit) {
    const value = explicit.dataset.cursor;
    if (value === "hidden") return value;
    if (value === "view" || value === "open" || value === "hover") return "hover";
  }
  if (target.closest("input, textarea, [contenteditable='true']")) return "text";
  const interactive = target.closest(INTERACTIVE);
  if (interactive) {
    return "hover";
  }
  return "default";
}

type Ember = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; c: string };
type TailPoint = { x: number; y: number };

/**
 * Plasma-flame cursor with a comet tail and rising embers; it re-colours per page section, for mouse/trackpad users only.
 * The flame leans against the direction of travel like a real flame, and a lagging
 * halo/label pill handles hover states. Everything is written to the DOM/canvas in rAF.
 */
export function CustomCursor() {
  const fine = useFinePointer();
  const rootRef = useRef<HTMLDivElement>(null);
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
    const tail: TailPoint[] = [];
    const TAIL_LEN = 22;

    // Section-aware colour.
    let themeId = "";
    let emberColors = emberSet(HOME);
    let tailRgb = hexRgb(HOME[0]).join(",");
    let tailCore = hexRgb(HOME[3]).join(",");
    const applyTheme = (id: string) => {
      if (id === themeId) return;
      themeId = id;
      const t = id.startsWith("hue:") ? hueTheme(Number(id.slice(4))) : (THEMES[id] ?? HOME);
      const el = rootRef.current;
      if (el) {
        el.style.setProperty("--f1", t[0]);
        el.style.setProperty("--f2", t[1]);
        el.style.setProperty("--f3", t[2]);
        el.style.setProperty("--fi", t[3]);
      }
      // Buttons outside project cards glow in the current section's flame colour.
      document.documentElement.style.setProperty("--glow", t[0]);
      emberColors = emberSet(t);
      tailRgb = hexRgb(t[0]).join(",");
      tailCore = hexRgb(t[3]).join(",");
    };
    let sections: HTMLElement[] = [];
    const collectSections = () => {
      sections = SECTION_IDS.map((id) => document.getElementById(id)).filter((el): el is HTMLElement => !!el);
    };
    const detectSection = () => {
      // Over a project card: take that card's own colour.
      const under = document.elementFromPoint(target.x, target.y);
      const card = under?.closest<HTMLElement>("[data-flame-hue]");
      if (card) {
        applyTheme(`hue:${card.dataset.flameHue}`);
        return;
      }
      if (!sections.length || !sections[0].isConnected) collectSections();
      let found = "home";
      for (const el of sections) {
        const r = el.getBoundingClientRect();
        if (target.y >= r.top && target.y < r.bottom) {
          found = el.id;
          break;
        }
        // Past the last section (footer): stay on the nearest one above.
        if (r.bottom <= target.y) found = el.id;
      }
      applyTheme(found);
    };
    applyTheme("home");

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
          c: emberColors[(Math.random() * emberColors.length) | 0],
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

      if (frame % 8 === 0) detectSection();

      if (ctx && canvas && !reduce) {
        const dist = Math.hypot(dx, dy);
        if (active) {
          if (dist > 0.5) spawn(Math.min(3, Math.ceil(dist / 9)), 8);
          else if (frame % 5 === 0) spawn(1, 6);
        }
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = "lighter";

        // Comet tail: a tapered, glowing ribbon through recent positions (from the flame's body).
        tail.unshift({ x: target.x, y: target.y - 7 });
        if (tail.length > TAIL_LEN) tail.length = TAIL_LEN;
        if (active && tail.length > 2) {
          ctx.lineCap = "round";
          ctx.lineJoin = "round";
          for (let i = 1; i < tail.length; i++) {
            const a = tail[i - 1];
            const b = tail[i];
            const seg = Math.hypot(a.x - b.x, a.y - b.y);
            if (seg < 0.3) continue;
            const f = 1 - i / tail.length; // 1 at the head, 0 at the end
            const w = Math.min(1, seg / 6) * f;
            // wide soft glow
            ctx.strokeStyle = `rgba(${tailRgb},${(0.16 * f).toFixed(3)})`;
            ctx.lineWidth = 16 * w + 1;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            // bright core
            ctx.strokeStyle = `rgba(${tailCore},${(0.75 * f * f).toFixed(3)})`;
            ctx.lineWidth = 4.5 * w + 0.5;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }

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
    <div ref={rootRef} aria-hidden="true" className={cn("cursor-root pointer-events-none fixed inset-0 z-[100]", visible && state !== "hidden" && state !== "text" ? "opacity-100" : "opacity-0")}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />

      <div ref={ringRef} className="absolute top-0 left-0 will-change-transform">
        <div
          className={cn(
            "flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border transition-[width,height,background-color,border-color,box-shadow,opacity] duration-300 ease-out-expo",
            label
              ? "border-transparent bg-fg text-ink"
              : hover
                ? "scale-50 border-transparent opacity-0"
                : "cursor-ring-idle border-transparent",
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
                <stop offset="0" style={{ stopColor: "var(--f1)" }} />
                <stop offset="0.55" style={{ stopColor: "var(--f2)" }} />
                <stop offset="1" style={{ stopColor: "var(--f3)" }} stopOpacity="0.15" />
              </linearGradient>
              <linearGradient id="flame-inner" x1="0" y1="1" x2="0" y2="0">
                <stop offset="0" stopColor="#ffffff" />
                <stop offset="0.6" style={{ stopColor: "var(--fi)" }} />
                <stop offset="1" style={{ stopColor: "var(--f1)" }} stopOpacity="0.4" />
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
