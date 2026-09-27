import type { ComponentProps, ReactNode } from "react";
import { Magnetic } from "@/components/animations/Magnetic";
import { contentText, isPlaceholder, type Content } from "@/lib/content";
import { cn } from "@/lib/utils";

type Variant = "primary" | "ghost";

const base =
  "group relative inline-flex min-h-12 items-center justify-center gap-2.5 overflow-hidden rounded-full px-6 text-sm font-medium tracking-tight transition-[background-color,border-color,color,box-shadow] duration-300 ease-out-expo select-none btn-glow";

const variants: Record<Variant, string> = {
  primary:
    "bg-fg text-ink",
  ghost: "hairline bg-white/[0.03] text-fg hover:border-line-strong hover:bg-white/[0.07]",
};

type ButtonLinkProps = Omit<ComponentProps<"a">, "href"> & {
  href: Content;
  variant?: Variant;
  icon?: ReactNode;
  magnetic?: boolean;
  /** Treat as an external link (opens in a new tab). */
  external?: boolean;
};

export function ButtonLink({
  href,
  variant = "ghost",
  icon,
  magnetic = true,
  external,
  className,
  children,
  ...rest
}: ButtonLinkProps) {
  const label = (
    <>
      <span className="relative z-10">{children}</span>
      {icon && (
        <span className="relative z-10 transition-transform duration-300 ease-out-expo group-hover:translate-x-0.5 group-hover:-translate-y-0.5">
          {icon}
        </span>
      )}
    </>
  );

  // A link that hasn't been filled in yet: rendered, but clearly inert.
  const node = isPlaceholder(href) ? (
    <span
      role="link"
      aria-disabled="true"
      title={`Placeholder — add: ${contentText(href)}`}
      className={cn(base, variants.ghost, "border-dashed !border-amber-300/50 opacity-80", className)}
    >
      {label}
    </span>
  ) : (
    <a
      href={href}
      className={cn(base, variants[variant], className)}
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      {...rest}
    >
      {label}
    </a>
  );

  return magnetic ? <Magnetic>{node}</Magnetic> : node;
}

type ButtonProps = ComponentProps<"button"> & { variant?: Variant; icon?: ReactNode; magnetic?: boolean };

export function Button({ variant = "primary", icon, magnetic = true, className, children, ...rest }: ButtonProps) {
  const node = (
    <button className={cn(base, variants[variant], "disabled:opacity-60", className)} {...rest}>
      <span className="relative z-10">{children}</span>
      {icon && <span className="relative z-10">{icon}</span>}
    </button>
  );
  return magnetic ? <Magnetic>{node}</Magnetic> : node;
}
