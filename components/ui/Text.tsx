import { isPlaceholder, type Content } from "@/lib/content";

/**
 * Renders a content value. Placeholders get a dashed amber chip so they are
 * impossible to mistake for real information.
 */
export function Text({ value }: { value: Content }) {
  if (isPlaceholder(value)) {
    return (
      <span className="placeholder-chip" title="Placeholder — replace in /data">
        {value.placeholder}
      </span>
    );
  }
  return <>{value}</>;
}
