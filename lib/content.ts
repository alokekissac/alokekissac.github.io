/**
 * Content that hasn't been provided yet is wrapped in `placeholder()` so it
 * renders with a visible "placeholder" treatment instead of passing as real.
 * Search the /data folder for `placeholder(` to find everything to replace.
 */
export type Placeholder = { readonly placeholder: string };
export type Content = string | Placeholder;

export const placeholder = (hint: string): Placeholder => ({ placeholder: hint });

export const isPlaceholder = (value: Content | undefined): value is Placeholder =>
  typeof value === "object" && value !== null && "placeholder" in value;

/** Plain-text version of a content value, for attributes like aria-label. */
export const contentText = (value: Content): string =>
  isPlaceholder(value) ? value.placeholder : value;

/** A URL is usable only when it is a real string (not a placeholder). */
export const isRealUrl = (value: Content | undefined): value is string =>
  typeof value === "string" && value.length > 0;
