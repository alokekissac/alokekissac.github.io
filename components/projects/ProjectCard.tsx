"use client";

import { motion, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";
import { ArrowUpRight, Maximize2 } from "lucide-react";
import { useRef, type CSSProperties, type PointerEvent } from "react";
import { ProjectCover } from "@/components/projects/ProjectCover";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import { GitHubIcon } from "@/components/ui/BrandIcons";
import { ButtonLink } from "@/components/ui/Button";
import type { Project } from "@/data/projects";
import { useFinePointer } from "@/lib/hooks";
import { EASE_OUT, cn, pad } from "@/lib/utils";

type ProjectCardProps = {
  project: Project;
  index: number;
  total: number;
  onOpen: (project: Project) => void;
};

const SPRING = { stiffness: 150, damping: 18, mass: 0.5 };

export function ProjectCard({ project, index, total, onOpen }: ProjectCardProps) {
  const ref = useRef<HTMLElement>(null);
  const fine = useFinePointer();
  const reduce = useReducedMotion();
  const interactive = fine && !reduce;

  // Pointer position normalised to -0.5 … 0.5
  const px = useMotionValue(0);
  const py = useMotionValue(0);
  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [3, -3]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-4, 4]), SPRING);
  const visualX = useSpring(useTransform(px, [-0.5, 0.5], [-14, 14]), SPRING);
  const visualY = useSpring(useTransform(py, [-0.5, 0.5], [-10, 10]), SPRING);
  const glowX = useTransform(px, [-0.5, 0.5], ["0%", "100%"]);
  const glowY = useTransform(py, [-0.5, 0.5], ["0%", "100%"]);
  const sheen = useTransform(
    [glowX, glowY],
    ([x, y]) => `radial-gradient(600px circle at ${x} ${y}, hsl(${project.hue} 90% 70% / 0.08), transparent 40%)`,
  );

  // Scroll parallax on the visual
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const parallaxY = useTransform(scrollYProgress, [0, 1], ["-6%", "6%"]);

  const onMove = (e: PointerEvent<HTMLElement>) => {
    if (!interactive || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    px.set((e.clientX - rect.left) / rect.width - 0.5);
    py.set((e.clientY - rect.top) / rect.height - 0.5);
  };
  const onLeave = () => {
    px.set(0);
    py.set(0);
  };

  const reversed = index % 2 === 1;
  const burnVars = {
    "--burn-a": `hsl(${project.hue} 100% 88%)`,
    "--burn-b": `hsl(${project.hue} 95% 62%)`,
    "--burn-c": `hsl(${(project.hue + 25) % 360} 85% 52%)`,
  } as CSSProperties;
  const titleId = `project-${project.slug}-title`;

  return (
    <motion.article
      ref={ref}
      aria-labelledby={titleId}
      initial={{ opacity: 0, y: 60 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "0px 0px -10% 0px" }}
      transition={{ duration: 0.8, ease: EASE_OUT }}
      style={{ perspective: 1400 }}
    >
      <motion.div
        onPointerMove={onMove}
        onPointerLeave={onLeave}
        onClick={() => onOpen(project)}
        style={interactive ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="group relative grid cursor-pointer overflow-hidden rounded-[28px] border border-line bg-ink-2 transition-colors duration-500 hover:border-line-strong md:grid-cols-12"
      >
        {/* Pointer-following sheen */}
        {interactive && (
          <motion.div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
            style={{ background: sheen }}
          />
        )}

        {/* Burning border: a line in this project's own colour races around the edge on hover */}
        <div aria-hidden="true" className="card-burn pointer-events-none absolute inset-0 z-20 rounded-[28px]" style={burnVars} />
        <div aria-hidden="true" className="card-burn card-burn-glow pointer-events-none absolute inset-0 z-20 rounded-[28px]" style={burnVars} />

        {/* Visual */}
        <div
          className={cn(
            "relative z-10 aspect-[4/3] overflow-hidden md:col-span-7 md:aspect-auto md:min-h-[460px]",
            reversed && "md:order-2",
          )}
        >
          <motion.div className="absolute -inset-[8%]" style={{ y: reduce ? 0 : parallaxY }}>
            <motion.div
              className="h-full w-full transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
              style={interactive ? { x: visualX, y: visualY } : undefined}
            >
              {project.cardImage ? (
                <ProjectCover project={project} src={project.cardImage} sizes="(min-width: 768px) 60vw, 100vw" />
              ) : (
                <ProjectVisual kind={project.visual} hue={project.hue} />
              )}
            </motion.div>
          </motion.div>
          <span className="absolute top-5 left-5 font-mono text-xs tracking-[0.2em] text-white/60">
            {pad(index + 1)} / {pad(total)}
          </span>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between gap-10 p-7 md:col-span-5 md:p-10">
          <div>
            <p className="font-serif text-6xl leading-none text-white/15 italic md:text-7xl" aria-hidden="true">
              {pad(index + 1)}
            </p>
            <h3 id={titleId} className="mt-6 text-3xl font-medium tracking-[-0.03em] md:text-4xl">
              {project.title}
            </h3>
            <p className="mt-4 text-[15px] leading-relaxed text-muted">{project.description}</p>
            <ul className="mt-6 flex flex-wrap gap-1.5" aria-label="Technologies">
              {project.tech.map((t) => (
                <li key={t} className="rounded-full border border-line px-2.5 py-1 font-mono text-[11px] text-muted">
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Actions don't trigger the card click */}
          <div className="flex flex-wrap items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              onClick={() => onOpen(project)}
              className="inline-flex min-h-11 items-center gap-2 rounded-full bg-fg px-5 text-sm font-medium text-ink transition-shadow duration-300 hover:shadow-[0_0_0_5px_rgb(142_162_255/0.2)]"
              aria-label={`Open case study: ${project.title}`}
            >
              Case study <Maximize2 size={14} aria-hidden="true" />
            </button>
            <ButtonLink
              href={project.githubUrl}
              external
              magnetic={false}
              className="!min-h-11 !px-4"
              icon={<GitHubIcon size={15} />}
              aria-label={`${project.title} on GitHub`}
            >
              GitHub
            </ButtonLink>
            {project.liveUrl && (
              <ButtonLink
                href={project.liveUrl}
                external
                magnetic={false}
                className="!min-h-11 !px-4"
                icon={<ArrowUpRight size={15} />}
                aria-label={`${project.title} live demo`}
              >
                Live Demo
              </ButtonLink>
            )}
          </div>
        </div>
      </motion.div>
    </motion.article>
  );
}
