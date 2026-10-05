"use client";

import { useSyncExternalStore } from "react";

/** Shared sky state: the visitor's weather choice and how dark the page sky is right now. */
export type Weather = "clear" | "rain" | "mist";

const KEY = "sky-weather";
let weather: Weather = "clear";
const listeners = new Set<() => void>();

try {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(KEY) : null;
  if (saved === "rain" || saved === "mist" || saved === "clear") weather = saved;
} catch {
  /* storage unavailable */
}

export function setWeather(next: Weather) {
  weather = next;
  try {
    window.localStorage.setItem(KEY, next);
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((l) => l());
}

export function useWeather(): Weather {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => weather,
    () => "clear",
  );
}

export const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
export const ramp = (v: number, from: number, to: number) => clamp01((v - from) / (to - from));

/** Page scroll progress 0 (top) → 1 (bottom). */
export function pageProgress() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  return max > 0 ? clamp01(window.scrollY / max) : 0;
}

/** Where the hero ends, as page progress; the hero's wormhole stays free of sky effects. */
export function heroEnd() {
  const max = document.documentElement.scrollHeight - window.innerHeight;
  const hero = document.getElementById("home");
  return hero && max > 0 ? Math.min(0.12, (hero.offsetHeight * 0.85) / max) : 0.08;
}

/** 1 at night, 0 in full daylight. */
export const nightness = (p: number) => 1 - ramp(p, 0.15, 0.28) * (1 - ramp(p, 0.68, 0.8));
