"use client";

import { AnimatePresence, motion } from "motion/react";
import { CloudFog, CloudRain, Sparkles, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { heroEnd, nightness, pageProgress, setWeather, useWeather, type Weather } from "@/lib/sky";
import { cn } from "@/lib/utils";

/** True things about Aloke, revealed by catching a shooting star. */
const FACTS = [
  "I moved from Kottayam, Kerala to Dublin for an MSc in Artificial Intelligence.",
  "The agent in the Lab learns with tabular Q-learning, entirely in your browser.",
  "For my MSc project I trained and compared five model families to forecast landfill waste.",
  "At Rizz Technologies I owned the backend, recommendation model and database of a tour-planning platform.",
  "My first internship was building an Android app in Flutter at SoftLoom IT Solutions.",
  "Covigo plans a route to walk every street in an area, with GPS turn-by-turn guidance.",
  "The flame cursor changes colour to match each section and each project.",
  "This page runs a full day: night at the top, daylight in the middle, night again at the bottom.",
];

const WEATHER: { id: Weather; label: string; icon: typeof Sun }[] = [
  { id: "clear", label: "Clear sky", icon: Sun },
  { id: "rain", label: "Rain", icon: CloudRain },
  { id: "mist", label: "Mist", icon: CloudFog },
];

type Star = { id: number; x: number; y: number; dx: number; dy: number };

/**
 * Things that sit above the page content: clickable shooting stars at night, the fact
 * toast they reveal, and the weather toggle.
 */
export function SkyExtras() {
  const weather = useWeather();
  const [stars, setStars] = useState<Star[]>([]);
  const [fact, setFact] = useState<string | null>(null);
  const factIndex = useRef(0);
  const nextId = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Spawn a shooting star now and then, only in the dark parts of the page and never over the hero.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let timer: ReturnType<typeof setTimeout>;
    const schedule = () => {
      timer = setTimeout(() => {
        const p = pageProgress();
        if (document.visibilityState === "visible" && nightness(p) > 0.85 && p > heroEnd() + 0.01) {
          const w = window.innerWidth;
          const h = window.innerHeight;
          setStars((s) => [
            ...s,
            { id: nextId.current++, x: w * (0.3 + Math.random() * 0.6), y: h * (0.06 + Math.random() * 0.3), dx: -(260 + Math.random() * 200), dy: 120 + Math.random() * 90 },
          ]);
        }
        schedule();
      }, 6000 + Math.random() * 7000);
    };
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const done = useCallback((id: number) => setStars((s) => s.filter((st) => st.id !== id)), []);

  const catchStar = (id: number) => {
    done(id);
    setFact(FACTS[factIndex.current % FACTS.length]);
    factIndex.current++;
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setFact(null), 7000);
  };

  return (
    <>
      {/* Shooting stars (above content so they can be clicked) */}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-[45] overflow-hidden">
        {stars.map((st) => (
          <motion.button
            key={st.id}
            type="button"
            tabIndex={-1}
            onClick={() => catchStar(st.id)}
            className="shooting-star pointer-events-auto absolute"
            style={{ left: st.x, top: st.y, rotate: `${(Math.atan2(st.dy, st.dx) * 180) / Math.PI}deg` }}
            initial={{ x: 0, y: 0, opacity: 0 }}
            animate={{ x: st.dx, y: st.dy, opacity: [0, 1, 1, 0] }}
            transition={{ duration: 2.2, ease: "easeIn", times: [0, 0.1, 0.75, 1] }}
            onAnimationComplete={() => done(st.id)}
          >
            <span className="shooting-star-trail" />
          </motion.button>
        ))}
      </div>

      {/* Fact toast */}
      <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[70] flex justify-center px-4" aria-live="polite">
        <AnimatePresence>
          {fact && (
            <motion.div
              key={fact}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ duration: 0.35 }}
              className="pointer-events-auto max-w-md rounded-2xl border border-line-strong bg-ink-2/90 px-5 py-4 shadow-[0_20px_60px_-20px_rgb(142_162_255/0.5)] backdrop-blur-md"
            >
              <p className="flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-accent uppercase">
                <Sparkles size={12} aria-hidden="true" /> You caught a shooting star
              </p>
              <p className="mt-2 text-sm leading-relaxed text-fg">{fact}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Weather toggle */}
      <div
        role="radiogroup"
        aria-label="Sky weather"
        className="fixed bottom-4 left-4 z-[55] flex items-center gap-0.5 rounded-full border border-line bg-ink-2/80 p-1 backdrop-blur-md md:bottom-6 md:left-6"
      >
        {WEATHER.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            role="radio"
            aria-checked={weather === id}
            aria-label={label}
            title={label}
            onClick={() => setWeather(id)}
            className={cn(
              "flex h-8 w-8 items-center justify-center rounded-full transition-colors",
              weather === id ? "bg-white/12 text-fg" : "text-subtle hover:text-fg",
            )}
          >
            <Icon size={15} aria-hidden="true" />
          </button>
        ))}
      </div>
    </>
  );
}
