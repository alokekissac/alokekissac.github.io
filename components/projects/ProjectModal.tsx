"use client";

import { motion } from "motion/react";
import { ArrowUpRight, X } from "lucide-react";
import { useEffect, useRef, type ReactNode } from "react";
import { ArchitectureDiagram } from "@/components/projects/ArchitectureDiagram";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import { GitHubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import { Text } from "@/components/ui/Text";
import type { Project } from "@/data/projects";
import { projects } from "@/data/projects";
import { EASE_OUT, pad } from "@/lib/utils";

const FOCUSABLE = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

function Block({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="grid gap-3 border-t border-line py-8 md:grid-cols-12 md:gap-8">
      <h3 className="eyebrow md:col-span-3 md:pt-1">{label}</h3>
      <div className="md:col-span-9">{children}</div>
    </section>
  );
}

function BulletList({ items }: { items: Project["features"] }) {
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-muted">
          <span className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden="true" />
          <span>
            <Text value={item} />
          </span>
        </li>
      ))}
    </ul>
  );
}

export default function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const index = projects.findIndex((p) => p.slug === project.slug);

  // Scroll lock, Escape to close, focus trap, focus restore.
  useEffect(() => {
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    document.body.style.overflow = "hidden";
    document.body.style.paddingRight = `${scrollbar}px`;
    closeRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
        return;
      }
      if (e.key !== "Tab" || !dialogRef.current) return;
      const nodes = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
      if (!nodes.length) return;
      const first = nodes[0];
      const last = nodes[nodes.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = overflow;
      document.body.style.paddingRight = "";
      previouslyFocused?.focus({ preventScroll: true });
    };
  }, [onClose]);

  const titleId = `modal-${project.slug}-title`;

  return (
    <motion.div
      className="fixed inset-0 z-[80] flex items-end justify-center md:items-center md:p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 bg-black/70 backdrop-blur-md"
        onClick={onClose}
        data-cursor="hover"
      />
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative flex max-h-[94svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-[28px] border border-line-strong bg-ink-2 shadow-2xl md:max-h-[90vh] md:rounded-[28px]"
        initial={{ y: 60, opacity: 0, scale: 0.98 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 40, opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.5, ease: EASE_OUT }}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-4 border-b border-line px-5 py-4 md:px-8">
          <p className="font-mono text-xs tracking-[0.2em] text-subtle">
            PROJECT {pad(index + 1)} / {pad(projects.length)}
          </p>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Close project details"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-line transition-colors hover:border-line-strong hover:bg-white/5"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain">
          {/* Hero */}
          <div className="relative aspect-[16/7] min-h-48 overflow-hidden">
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              transition={{ duration: 1.2, ease: EASE_OUT }}
            >
              <ProjectVisual kind={project.visual} hue={project.hue} />
            </motion.div>
            <div className="absolute inset-0 bg-gradient-to-t from-ink-2 via-ink-2/30 to-transparent" />
          </div>

          <div className="px-5 pb-10 md:px-10">
            <motion.header
              className="-mt-16 relative md:-mt-24"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.15 }}
            >
              <h2 id={titleId} className="text-[clamp(2rem,5vw,3.75rem)] leading-[1] font-medium tracking-[-0.04em]">
                {project.title}
              </h2>
              <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{project.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <ButtonLink href={project.githubUrl} external variant="primary" icon={<GitHubIcon size={16} />}>
                  GitHub
                </ButtonLink>
                {project.liveUrl && (
                  <ButtonLink href={project.liveUrl} external icon={<ArrowUpRight size={16} />}>
                    Live Demo
                  </ButtonLink>
                )}
              </div>
              <p className="mt-4 text-xs text-subtle">
                Year: <Text value={project.year} />
              </p>
            </motion.header>

            <motion.div
              className="mt-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Block label="Overview">
                <p className="text-[15px] leading-relaxed text-fg/90 md:text-base">{project.overview}</p>
              </Block>
              <Block label="Problem">
                <p className="text-[15px] leading-relaxed text-muted">{project.problem}</p>
              </Block>
              <Block label="Solution">
                <p className="text-[15px] leading-relaxed text-muted">{project.solution}</p>
              </Block>
              <Block label="Architecture">
                <ArchitectureDiagram lanes={project.architecture} hue={project.hue} />
              </Block>
              <Block label="Technologies">
                <ul className="flex flex-wrap gap-2">
                  {project.tech.map((t) => (
                    <li key={t} className="rounded-full border border-line-strong px-3 py-1.5 font-mono text-xs text-fg/80">
                      {t}
                    </li>
                  ))}
                </ul>
              </Block>
              <Block label="Key features">
                <BulletList items={project.features} />
              </Block>
              <Block label="Challenges">
                <BulletList items={project.challenges} />
              </Block>
              <Block label="Results">
                <BulletList items={project.results} />
              </Block>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
