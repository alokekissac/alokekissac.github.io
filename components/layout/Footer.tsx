import type { ReactNode } from "react";
import { ArrowUp, Mail } from "lucide-react";
import { GitHubIcon, LinkedInIcon } from "@/components/ui/BrandIcons";
import { site } from "@/data/site";
import { contentText, isPlaceholder, type Content } from "@/lib/content";

function FooterLink({ href, label, icon, external }: { href: Content; label: string; icon: ReactNode; external?: boolean }) {
  const cls = "inline-flex min-h-11 items-center gap-2 text-sm text-muted transition-colors hover:text-fg";
  if (isPlaceholder(href)) {
    return (
      <span className={`${cls} placeholder-chip !min-h-0 !py-1`} title={`Placeholder — add: ${contentText(href)}`}>
        {icon} {label}
      </span>
    );
  }
  return (
    <a href={href} className={cls} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>
      {icon} {label}
    </a>
  );
}

export function Footer() {
  const { email, github, linkedin } = site.links;
  return (
    <footer className="relative border-t border-line">
      <div className="container-x py-12 md:py-16">
        <div className="flex flex-col justify-between gap-10 md:flex-row md:items-end">
          <div>
            <p className="text-2xl font-medium tracking-tight">
              {site.name}
              <span className="font-serif text-accent italic">.</span>
            </p>
            <p className="mt-1 text-muted">{site.role}</p>
          </div>

          <nav aria-label="Social links">
            <ul className="flex flex-wrap items-center gap-x-6 gap-y-2">
              <li>
                <FooterLink href={github} label="GitHub" icon={<GitHubIcon size={15} />} external />
              </li>
              <li>
                <FooterLink href={linkedin} label="LinkedIn" icon={<LinkedInIcon size={15} />} external />
              </li>
              <li>
                <FooterLink href={isPlaceholder(email) ? email : `mailto:${email}`} label="Email" icon={<Mail size={15} />} />
              </li>
            </ul>
          </nav>
        </div>

        <div className="mt-12 flex flex-col-reverse items-start justify-between gap-6 border-t border-line pt-8 text-sm text-subtle sm:flex-row sm:items-center">
          <p>© 2026 {site.name}</p>
          <p className="flex items-center gap-2.5">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-accent/60 motion-reduce:hidden" />
              <span className="relative h-2 w-2 rounded-full bg-accent" />
            </span>
            Designed &amp; built with curiosity.
          </p>
          <a
            href="#home"
            className="group inline-flex min-h-11 items-center gap-2 transition-colors hover:text-fg"
            aria-label="Back to top"
          >
            Back to top
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line transition-all group-hover:-translate-y-0.5 group-hover:border-line-strong">
              <ArrowUp size={14} aria-hidden="true" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
