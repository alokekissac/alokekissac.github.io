"use client";

import { motion, useMotionValueEvent, useReducedMotion, useScroll, useSpring } from "motion/react";
import { ArrowRight, Flag, MapPin } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ButtonLink } from "@/components/ui/Button";
import type { TimelineEntry } from "@/data/experience";
import { EASE_OUT, cn } from "@/lib/utils";
import { EntryCard } from "./Timeline";

/**
 * Career timeline as a road trip: a winding road runs down the middle, and a little car
 * drives along it as you scroll. Each milestone lights up when the car reaches it.
 */

const STOP_OFFSET = 30; // px from the top of each entry to its stop on the road
type Geometry = { width: number; height: number; cx: number; stops: number[]; d: string };

function buildRoad(width: number, height: number, cx: number, amp: number, stops: number[]) {
  const ys = [0, ...stops, height];
  let d = `M ${cx} 0`;
  for (let i = 0; i < ys.length - 1; i++) {
    const y1 = ys[i];
    const y2 = ys[i + 1];
    const side = i % 2 ? 1 : -1;
    const a = Math.min(amp, (y2 - y1) * 0.35);
    d += ` C ${cx + side * a} ${y1 + (y2 - y1) * 0.35}, ${cx + side * a} ${y1 + (y2 - y1) * 0.65}, ${cx} ${y2}`;
  }
  return { width, height, cx, stops, d };
}

export function RoadTrip({ entries }: { entries: TimelineEntry[] }) {
  const listRef = useRef<HTMLOListElement>(null);
  const pathRef = useRef<SVGPathElement>(null);
  const litRef = useRef<SVGPathElement>(null);
  const carRef = useRef<HTMLDivElement>(null);
  const lut = useRef<{ len: number; y: number }[]>([]);
  const total = useRef(0);
  const [geo, setGeo] = useState<Geometry | null>(null);
  const [reached, setReached] = useState(-1);
  const reduce = useReducedMotion();

  // Measure stops and draw the road to fit them.
  const measure = useCallback(() => {
    const ol = listRef.current;
    if (!ol) return;
    const width = ol.clientWidth;
    const height = ol.clientHeight;
    const desktop = window.matchMedia("(min-width: 768px)").matches;
    const cx = desktop ? width / 2 : 22;
    const amp = desktop ? 30 : 9;
    const stops = Array.from(ol.querySelectorAll<HTMLElement>("[data-stop]")).map((li) => li.offsetTop + STOP_OFFSET);
    setGeo(buildRoad(width, height, cx, amp, stops));
  }, []);

  useLayoutEffect(() => {
    measure();
    const ro = new ResizeObserver(measure);
    if (listRef.current) ro.observe(listRef.current);
    return () => ro.disconnect();
  }, [measure]);

  // Length ↔ y lookup so the car tracks a fixed line in the viewport.
  useEffect(() => {
    const path = pathRef.current;
    if (!path || !geo) return;
    const L = path.getTotalLength();
    total.current = L;
    const samples = 400;
    lut.current = Array.from({ length: samples + 1 }, (_, i) => {
      const len = (i / samples) * L;
      return { len, y: path.getPointAtLength(len).y };
    });
  }, [geo]);

  const { scrollYProgress } = useScroll({ target: listRef, offset: ["start 58%", "end 58%"] });
  const smooth = useSpring(scrollYProgress, { stiffness: 90, damping: 22, mass: 0.4 });
  const progress = reduce ? scrollYProgress : smooth;

  const place = useCallback(
    (p: number) => {
      const path = pathRef.current;
      const car = carRef.current;
      if (!path || !car || !geo || !lut.current.length) return;
      const targetY = Math.max(0, Math.min(1, p)) * geo.height;
      // binary search the lookup table for the length at this y
      const t = lut.current;
      let lo = 0;
      let hi = t.length - 1;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        if (t[mid].y < targetY) lo = mid;
        else hi = mid;
      }
      const span = t[hi].y - t[lo].y || 1;
      const len = t[lo].len + ((targetY - t[lo].y) / span) * (t[hi].len - t[lo].len);
      const pt = path.getPointAtLength(len);
      const ahead = path.getPointAtLength(Math.min(total.current, len + 2));
      const behind = path.getPointAtLength(Math.max(0, len - 2));
      const angle = (Math.atan2(ahead.y - behind.y, ahead.x - behind.x) * 180) / Math.PI;
      car.style.transform = `translate3d(${pt.x}px, ${pt.y}px, 0) rotate(${angle}deg)`;
      if (litRef.current) litRef.current.style.strokeDasharray = `${len} ${total.current}`;
      let r = -1;
      geo.stops.forEach((y, i) => {
        if (pt.y >= y - 6) r = i;
      });
      setReached((prev) => (prev === r ? prev : r));
    },
    [geo],
  );

  useMotionValueEvent(progress, "change", place);
  useEffect(() => {
    place(progress.get());
  }, [geo, place, progress]);

  return (
    <div className="mx-auto max-w-5xl">
      {/* Start sign */}
      <div className="mb-8 flex md:justify-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-line bg-ink-2 px-3.5 py-1.5 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          <MapPin size={12} className="text-accent" aria-hidden="true" /> Start · Kerala, India
        </span>
      </div>

      <div className="relative">
        {/* Road */}
        {geo && (
          <svg
            aria-hidden="true"
            className="pointer-events-none absolute top-0 left-0 overflow-visible"
            width={geo.width}
            height={geo.height}
          >
            <defs>
              <filter id="road-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="4" />
              </filter>
            </defs>
            {/* shoulder, asphalt, centre line */}
            <path d={geo.d} fill="none" stroke="rgb(255 255 255 / 0.10)" strokeWidth="30" strokeLinecap="round" />
            <path ref={pathRef} d={geo.d} fill="none" stroke="#0f0f17" strokeWidth="26" strokeLinecap="round" />
            <path d={geo.d} fill="none" stroke="rgb(255 255 255 / 0.22)" strokeWidth="1.5" strokeDasharray="8 10" />
            {/* the stretch already driven */}
            <path
              ref={litRef}
              d={geo.d}
              fill="none"
              stroke="var(--journey)"
              strokeWidth="6"
              strokeLinecap="round"
              opacity="0.55"
              filter="url(#road-glow)"
              style={{ strokeDasharray: "0 99999" }}
            />
            {/* stops */}
            {geo.stops.map((y, i) => (
              <g key={i} transform={`translate(${geo.cx} ${y})`}>
                <circle r={i <= reached ? 10 : 7} className={cn("journey-stop", i <= reached && "is-reached")} />
                <circle r="3" fill={i <= reached ? "#fff" : "rgb(255 255 255 / 0.4)"} />
              </g>
            ))}
          </svg>
        )}

        {/* Car */}
        <div ref={carRef} aria-hidden="true" className="pointer-events-none absolute top-0 left-0 z-20 will-change-transform" style={{ transformOrigin: "0 0" }}>
          <div className="journey-car">
            <svg viewBox="0 0 120 44" width="84" height="31">
              <defs>
                <linearGradient id="beam" x1="0" x2="1">
                  <stop offset="0" stopColor="#fff6d6" stopOpacity="0.55" />
                  <stop offset="1" stopColor="#fff6d6" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="body" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="var(--journey)" />
                  <stop offset="1" stopColor="var(--journey-2)" />
                </linearGradient>
              </defs>
              {/* headlight beams (car faces +x) */}
              <path d="M58 13 L120 0 L120 20 Z" fill="url(#beam)" />
              <path d="M58 31 L120 24 L120 44 Z" fill="url(#beam)" />
              {/* body */}
              <rect x="6" y="8" width="54" height="28" rx="9" fill="url(#body)" />
              {/* cabin / windows */}
              <rect x="20" y="12" width="26" height="20" rx="5" fill="#0b0b12" opacity="0.85" />
              <rect x="40" y="13" width="6" height="18" rx="2" fill="#cfe3ff" opacity="0.55" />
              {/* lights */}
              <rect x="55" y="10" width="5" height="6" rx="2" fill="#fffbe8" />
              <rect x="55" y="28" width="5" height="6" rx="2" fill="#fffbe8" />
              <rect x="5" y="10" width="3" height="6" rx="1.5" fill="#ff4d6d" />
              <rect x="5" y="28" width="3" height="6" rx="1.5" fill="#ff4d6d" />
            </svg>
          </div>
        </div>

        <ol ref={listRef} className="relative">
          {entries.map((entry, i) => {
            const right = i % 2 === 1;
            const arrived = i <= reached;
            return (
              <li
                key={entry.id}
                data-stop
                className="relative grid pb-14 pl-14 last:pb-0 md:grid-cols-2 md:gap-32 md:pl-0"
              >
                <motion.div
                  className={cn(right ? "md:col-start-2" : "md:col-start-1")}
                  initial={{ opacity: 0, x: right ? 40 : -40 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true, margin: "0px 0px -15% 0px" }}
                  transition={{ duration: 0.7, ease: EASE_OUT }}
                >
                  <EntryCard entry={entry} arrived={arrived} />
                </motion.div>
              </li>
            );
          })}
        </ol>
      </div>

      {/* Destination */}
      <motion.div
        className="relative mt-12 flex flex-col items-start gap-4 pl-14 md:items-center md:pl-0 md:text-center"
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
      >
        <span className="inline-flex items-center gap-2 font-mono text-[11px] tracking-[0.14em] text-muted uppercase">
          <Flag size={12} className="text-signal" aria-hidden="true" /> Next stop
        </span>
        <p className="text-2xl font-medium tracking-tight md:text-3xl">
          Your team<span className="font-serif text-accent italic">?</span>
        </p>
        <ButtonLink href="#contact" variant="primary" icon={<ArrowRight size={16} />}>
          Let&apos;s talk
        </ButtonLink>
      </motion.div>
    </div>
  );
}
