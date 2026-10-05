"use client";

import { useEffect, useMemo, useRef } from "react";

/**
 * Whole-page sky behind every section, running a full day as you scroll:
 * night → dawn → day → sunset → night. The moon sets, the sun crosses the sky,
 * clouds drift by at midday, and a city skyline lights up as night returns.
 * Updated in rAF from scroll position; nothing re-renders.
 */

type RGB = [number, number, number];
type Key = { p: number; top: RGB; mid: RGB; glow: RGB; a: number };

// p = page scroll progress (0 top → 1 bottom): night → dawn → day → sunset → night
const KEYS: Key[] = [
  { p: 0.0, top: [6, 6, 10], mid: [6, 6, 10], glow: [70, 80, 190], a: 0.05 },
  { p: 0.12, top: [8, 8, 20], mid: [12, 12, 30], glow: [110, 90, 220], a: 0.12 },
  { p: 0.22, top: [14, 14, 34], mid: [50, 28, 48], glow: [255, 140, 90], a: 0.38 },
  { p: 0.32, top: [16, 30, 64], mid: [22, 40, 78], glow: [255, 200, 140], a: 0.28 },
  { p: 0.45, top: [18, 38, 82], mid: [24, 48, 92], glow: [190, 210, 255], a: 0.26 },
  { p: 0.6, top: [16, 32, 70], mid: [26, 40, 80], glow: [255, 200, 130], a: 0.26 },
  { p: 0.72, top: [20, 16, 40], mid: [70, 30, 60], glow: [255, 110, 90], a: 0.42 },
  { p: 0.82, top: [10, 9, 22], mid: [24, 16, 40], glow: [150, 90, 220], a: 0.18 },
  { p: 1.0, top: [6, 6, 10], mid: [8, 8, 16], glow: [70, 80, 190], a: 0.06 },
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
  const cloudsRef = useRef<HTMLDivElement>(null);
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
      // Stars: out at night (top and bottom of the page), gone in the day.
      if (starsRef.current) {
        starsRef.current.style.opacity = String(Math.max(1 - ramp(p, 0.08, 0.2), ramp(p, 0.78, 0.9)));
        starsRef.current.style.transform = `translate3d(0, ${(-p * 60).toFixed(1)}px, 0)`;
      }
      let gx = 75;
      let gy = 30;
      // Moon: sets at the start of the page, rises again at the end.
      if (moonRef.current) {
        const m = ramp(p, 0, 0.16);
        const n = ramp(p, 0.8, 1);
        const late = p >= 0.5;
        const x = late ? 14 + n * 22 : 76 + m * 14;
        const y = late ? 86 - n * 62 : 18 + m * 72;
        moonRef.current.style.left = `${x}%`;
        moonRef.current.style.top = `${y}%`;
        moonRef.current.style.opacity = String(late ? ramp(p, 0.8, 0.87) : 1 - ramp(p, 0.1, 0.17));
        if (p < 0.12 || p > 0.84) {
          gx = x;
          gy = y;
        }
      }
      // Sun: rises on the left, crosses the sky, sets on the right.
      if (sunRef.current) {
        const sp = ramp(p, 0.17, 0.77);
        const x = 10 + sp * 80;
        const y = 88 - Math.sin(Math.PI * sp) * 72;
        sunRef.current.style.left = `${x}%`;
        sunRef.current.style.top = `${y}%`;
        sunRef.current.style.opacity = String(sp > 0 && sp < 1 ? clamp01(Math.min(sp, 1 - sp) * 10) : 0);
        if (p >= 0.12 && p <= 0.84) {
          gx = x;
          gy = y;
        }
      }
      sky?.style.setProperty("--glow-x", `${gx.toFixed(1)}%`);
      sky?.style.setProperty("--glow-y", `${gy.toFixed(1)}%`);
      // Soft clouds drift through the daytime.
      if (cloudsRef.current) {
        cloudsRef.current.style.opacity = String(ramp(p, 0.25, 0.35) * (1 - ramp(p, 0.62, 0.72)));
        cloudsRef.current.style.transform = `translate3d(${(-p * 240).toFixed(1)}px, 0, 0)`;
      }
      // Skyline at dusk; windows light up as night falls.
      if (cityRef.current) cityRef.current.style.opacity = String(ramp(p, 0.66, 0.76));
      if (windowsRef.current) windowsRef.current.style.opacity = String(0.05 + ramp(p, 0.74, 0.86) * 0.8);
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
      <div ref={cloudsRef} className="absolute inset-0 opacity-0 will-change-transform">
        <span className="sky-cloud" style={{ left: "12%", top: "16%", width: 420, height: 90 }} />
        <span className="sky-cloud" style={{ left: "58%", top: "10%", width: 520, height: 110 }} />
        <span className="sky-cloud" style={{ left: "88%", top: "28%", width: 380, height: 80 }} />
        <span className="sky-cloud" style={{ left: "34%", top: "34%", width: 300, height: 70 }} />
      </div>
      <div ref={moonRef} className="sky-moon absolute opacity-0" />
      <div ref={sunRef} className="sky-sun absolute opacity-0" />

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
