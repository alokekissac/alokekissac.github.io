"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Whole-page sky behind every section: deep night at the top of the page that
 * slowly turns to dawn as you scroll down to Contact. Stars fade, the moon sets,
 * the horizon warms and the sun rises over a city skyline at the very end.
 * Updated in rAF from scroll position; nothing re-renders.
 */

type RGB = [number, number, number];
type Key = { p: number; top: RGB; mid: RGB; glow: RGB; a: number };

// p = page scroll progress (0 top → 1 bottom)
const KEYS: Key[] = [
  { p: 0.0, top: [6, 6, 10], mid: [6, 6, 10], glow: [70, 80, 190], a: 0.0 },
  { p: 0.2, top: [5, 6, 14], mid: [7, 8, 18], glow: [80, 90, 210], a: 0.08 },
  { p: 0.5, top: [6, 8, 20], mid: [9, 11, 26], glow: [100, 90, 230], a: 0.12 },
  { p: 0.7, top: [8, 11, 28], mid: [14, 16, 38], glow: [150, 100, 220], a: 0.18 },
  { p: 0.85, top: [12, 14, 34], mid: [34, 20, 46], glow: [255, 110, 120], a: 0.26 },
  { p: 1.0, top: [18, 22, 46], mid: [60, 34, 52], glow: [255, 160, 90], a: 0.4 },
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const ramp = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));

function sample(p: number) {
  let i = 0;
  while (i < KEYS.length - 2 && p > KEYS[i + 1].p) i++;
  const k0 = KEYS[i];
  const k1 = KEYS[i + 1];
  const t = clamp01((p - k0.p) / (k1.p - k0.p));
  const mix = (x: RGB, y: RGB) => x.map((v, j) => Math.round(lerp(v, y[j], t))).join(",");
  return { top: mix(k0.top, k1.top), mid: mix(k0.mid, k1.mid), glow: mix(k0.glow, k1.glow), a: lerp(k0.a, k1.a, t) };
}

// Deterministic pseudo-random so server and client markup agree.
function rng(seed: number) {
  return () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
}

export function PageSky() {
  const skyRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const moonRef = useRef<HTMLDivElement>(null);
  const sunRef = useRef<HTMLDivElement>(null);
  const cityRef = useRef<HTMLDivElement>(null);
  const windowsRef = useRef<SVGGElement>(null);

  const stars = useMemo(() => {
    const r = rng(11);
    return Array.from({ length: 110 }, () => ({ x: r() * 100, y: r() * 100, s: 0.6 + r() * 1.5, d: r() * 5, big: r() < 0.08 }));
  }, []);

  const city = useMemo(() => {
    const r = rng(42);
    const out: { x: number; w: number; h: number; windows: { x: number; y: number }[] }[] = [];
    let x = 0;
    while (x < 1440) {
      const w = 40 + Math.round(r() * 70);
      const h = 30 + Math.round(r() * 70);
      const windows: { x: number; y: number }[] = [];
      for (let wy = 120 - h + 9; wy < 113; wy += 11) {
        for (let wx = x + 7; wx < x + w - 8; wx += 11) if (r() < 0.4) windows.push({ x: wx, y: wy });
      }
      out.push({ x, w, h, windows });
      x += w + 4 + Math.round(r() * 10);
    }
    return out;
  }, []);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const p = max > 0 ? clamp01(window.scrollY / max) : 0;
      const s = sample(p);
      const sky = skyRef.current;
      if (sky) {
        sky.style.setProperty("--sky-top", `rgb(${s.top})`);
        sky.style.setProperty("--sky-mid", `rgb(${s.mid})`);
        sky.style.setProperty("--sky-glow", `rgba(${s.glow},${s.a.toFixed(3)})`);
      }
      // Stars: full through the night, fading before dawn; slight parallax.
      if (starsRef.current) {
        starsRef.current.style.opacity = String(1 - ramp(p, 0.68, 0.92));
        starsRef.current.style.transform = `translate3d(0, ${(-p * 60).toFixed(1)}px, 0)`;
      }
      // Moon: high on the right at the top of the page, setting by pre-dawn.
      if (moonRef.current) {
        const m = ramp(p, 0.05, 0.85);
        moonRef.current.style.top = `${14 + m * 80}%`;
        moonRef.current.style.left = `${84 - m * 10}%`;
        moonRef.current.style.opacity = String(ramp(p, 0.02, 0.1) * (1 - ramp(p, 0.75, 0.86)));
      }
      // Sun: rises from below the horizon at the very end.
      if (sunRef.current) {
        const sp = ramp(p, 0.86, 1);
        sunRef.current.style.top = `${112 - sp * 30}%`;
        sunRef.current.style.opacity = String(sp);
      }
      // Skyline: appears near the end; windows lit at night, switching off at sunrise.
      if (cityRef.current) cityRef.current.style.opacity = String(ramp(p, 0.78, 0.9));
      if (windowsRef.current) windowsRef.current.style.opacity = String(0.85 - ramp(p, 0.9, 1) * 0.7);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div ref={skyRef} aria-hidden="true" className="page-sky pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div ref={starsRef} className="absolute -inset-y-16 inset-x-0 will-change-transform">
        {stars.map((st, i) => (
          <span
            key={i}
            className={st.big ? "sky-star sky-star-big" : "sky-star"}
            style={{ left: `${st.x}%`, top: `${st.y}%`, width: st.s, height: st.s, animationDelay: `${st.d}s` }}
          />
        ))}
      </div>
      <div ref={moonRef} className="sky-moon absolute opacity-0" />
      <div ref={sunRef} className="sky-sun absolute left-[68%] opacity-0" />

      <div ref={cityRef} className="absolute inset-x-0 bottom-0 opacity-0">
        <svg className="h-[80px] w-full md:h-[110px]" viewBox="0 0 1440 120" preserveAspectRatio="xMidYMax slice">
          <g fill="#07070c">
            {city.map((b, i) => (
              <rect key={i} x={b.x} y={120 - b.h} width={b.w} height={b.h} rx="2" />
            ))}
            {/* Dublin's Spire */}
            <path d="M1012 120 L1015.5 0 L1019 120 Z" />
          </g>
          <g ref={windowsRef} fill="#ffd36b">
            {city.flatMap((b, i) => b.windows.map((w, j) => <rect key={`${i}-${j}`} x={w.x} y={w.y} width="4" height="5" rx="0.5" />))}
            <circle cx="1015.5" cy="3" r="2" fill="#ff6b6b" />
          </g>
        </svg>
      </div>
    </div>
  );
}
