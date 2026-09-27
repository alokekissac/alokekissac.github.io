type ClassValue = string | false | null | undefined;

/** Tiny className joiner — avoids pulling in clsx/tailwind-merge. */
export function cn(...classes: ClassValue[]): string {
  return classes.filter(Boolean).join(" ");
}

export const pad = (n: number, length = 2) => String(n).padStart(length, "0");

/** Standard easing curve used across the site (ease-out-expo-ish). */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const;
