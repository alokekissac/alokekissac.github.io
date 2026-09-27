import type { ReactNode } from "react";
import { SplitText } from "@/components/animations/SplitText";
import { Reveal } from "@/components/animations/Reveal";
import { cn } from "@/lib/utils";

type SectionHeadingProps = {
  index: string;
  label: string;
  title: string[];
  /** Word(s) in the title rendered in the italic serif accent. */
  accentWords?: string[];
  description?: ReactNode;
  id?: string;
  className?: string;
  align?: "left" | "center";
};

export function SectionHeading({ index, label, title, accentWords, description, id, className, align = "left" }: SectionHeadingProps) {
  return (
    <header className={cn("mb-14 md:mb-20", align === "center" && "text-center", className)}>
      <Reveal y={12}>
        <p className={cn("eyebrow flex items-center gap-3", align === "center" && "justify-center")}>
          <span className="text-accent">{index}</span>
          <span className="h-px w-8 bg-line-strong" aria-hidden="true" />
          {label}
        </p>
      </Reveal>
      <h2
        id={id}
        className="mt-5 text-[clamp(2.25rem,6vw,5rem)] leading-[0.98] font-medium tracking-[-0.035em] text-balance"
      >
        <SplitText lines={title} accentWords={accentWords} />
      </h2>
      {description && (
        <Reveal delay={0.15} className={cn("mt-6 max-w-xl text-base text-muted md:text-lg", align === "center" && "mx-auto")}>
          {description}
        </Reveal>
      )}
    </header>
  );
}
