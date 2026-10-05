"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";

/**
 * Scroll-driven sky for the Skills section: dawn → day → sunset → night.
 * The parent calls `setHour(h)` (6–24); everything is written straight to the DOM.
 */

export type DaySkyHandle = { setHour: (h: number) => void };

type Key = { h: number; top: [number, number, number]; glow: [number, number, number]; a: number };
const KEYS: Key[] = [
  { h: 6, top: [14, 10, 28], glow: [255, 138, 92], a: 0.42 },
  { h: 8.5, top: [11, 16, 34], glow: [255, 190, 120], a: 0.26 },
  { h: 12, top: [13, 22, 50], glow: [142, 162, 255], a: 0.24 },
  { h: 16, top: [12, 19, 42], glow: [255, 196, 128], a: 0.24 },
  { h: 18.5, top: [20, 10, 32], glow: [255, 94, 130], a: 0.42 },
  { h: 20.5, top: [9, 8, 18], glow: [120, 90, 255], a: 0.18 },
  { h: 24, top: [6, 6, 10], glow: [70, 80, 190], a: 0.1 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

function sample(h: number) {
  let i = 0;
  while (i < KEYS.length - 2 && h > KEYS[i + 1].h) i++;
  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const t = clamp01((h - k0.h) / (k1.h - k0.h));
  const mix = (x: [number, number, number], y: [number, number, number]) => x.map((v, j) => Math.round(lerp(v, y[j], t))).join(",");
  return { top: mix(k0.top, k1.top), glow: mix(k0.glow, k1.glow), a: lerp(k0.a, k1.a, t) };
}

// Deterministic pseudo-random so server and client agree.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export const DaySky = forwardRef<DaySkyHandle>(function DaySky(_, ref) {
  const skyRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const windowsRef = useRef<SVGGElement>(null);

  const stars = useMemo(() => {
    const r = rng(7);
    return Array.from({ length: 70 }, () => ({ x: r() * 100, y: r() * 62, s: 0.6 + r() * 1.6, d: r() * 4 }));
  }, []);

  // Skyline: a row of buildings plus the Dublin Spire.
  const city = useMemo(() => {
    const r = rng(42);
    const buildings: { x: number; w: number; h: number; windows: { x: number; y: number }[] }[] = [];
    let x = 0;
    while (x < 1440) {
      const w = 40 + Math.round(r() * 70);
      const h = 34 + Math.round(r() * 86);
      const windows: { x: number; y: number }[] = [];
      for (let wy = 140 - h + 10; wy < 132; wy += 12) {
        for (let wx = x + 7; wx < x + w - 8; wx += 11) if (r() < 0.42) windows.push({ x: wx, y: wy });
      }
      buildings.push({ x, w, h, windows });
      x += w + 4 + Math.round(r() * 10);
    }
    return buildings;
  }, []);

  useImperativeHandle(ref, () => ({
    setHour(h: number) {
      const s = sample(h);
      const sky = skyRef.current;
      if (sky) {
        sky.style.setProperty("--sky-top", `rgb(${s.top})`);
        sky.style.setProperty("--sky-glow", `rgba(${s.glow},${s.a.toFixed(3)})`);
      }
      // Sun: 6:00 → 18:30 along an arc.
      const st = (h - 6) / 12.5;
      if (sunRef.current) {
        const vis = st >= 0 && st <= 1;
        sunRef.current.style.opacity = vis ? String(clamp01(Math.min(st, 1 - st) * 8)) : "0";
        sunRef.current.style.left = `${8 + clamp01(st) * 84}%`;
        sunRef.current.style.top = `${78 - Math.sin(Math.PI * clamp01(st)) * 62}%`;
        sky?.style.setProperty("--glow-x", `${8 + clamp01(st) * 84}%`);
        sky?.style.setProperty("--glow-y", `${78 - Math.sin(Math.PI * clamp01(st)) * 62}%`);
      }
      // Moon: 18:30 → 24:00, rising from the left.
      const mt = (h - 18.5) / 7;
      if (moonRef.current) {
        moonRef.current.style.opacity = String(clamp01(mt * 5));
        moonRef.current.style.left = `${10 + clamp01(mt) * 70}%`;
        moonRef.current.style.top = `${70 - Math.sin(Math.PI * clamp01(mt) * 0.9) * 55}%`;
        if (mt > 0) {
          sky?.style.setProperty("--glow-x", `${10 + clamp01(mt) * 70}%`);
          sky?.style.setProperty("--glow-y", `${70 - Math.sin(Math.PI * clamp01(mt) * 0.9) * 55}%`);
        }
      }
      if (starsRef.current) starsRef.current.style.opacity = String(clamp01((h - 18.5) / 2.5));
      if (windowsRef.current) windowsRef.current.style.opacity = String(0.06 + clamp01((h - 17.5) / 2.5) * 0.6);
    },
  }));

  return (
    <div ref={skyRef} aria-hidden="true" className="day-sky pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div ref={starsRef} className="absolute inset-0 opacity-0">
        {stars.map((st, i) => (
          <span
            key={i}
            className="day-star absolute rounded-full bg-white"
            style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
          />
        ))}
      </div>
      <div ref={sunRef} className="day-sun absolute" />
      <div ref={moonRef} className="day-moon absolute opacity-0" />

      {/* Skyline */}
      <svg className="day-city absolute inset-x-0 bottom-0 h-[70px] w-full md:h-[96px]" viewBox="0 0 1440 140" preserveAspectRatio="xMidYMax slice">
        <g fill="#08080e">
          {city.map((b, i) => (
            <rect key={i} x={b.x} y={140 - b.h} width={b.w} height={b.h} rx="2" />
          ))}
          {/* The Spire */}
          <path d="M1012 140 L1016 0 L1020 140 Z" />
        </g>
        <g ref={windowsRef} fill="#ffd36b" opacity="0.08">
          {city.flatMap((b, i) => b.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y} width="4" height="5" rx="0.5" />))}
          <circle cx="1016" cy="4" r="2" fill="#fff6d6" />
        </g>
      </svg>
      <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-ink/60" />
    </div>
  );
});
