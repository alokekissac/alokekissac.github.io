import Image from "next/image";
import { ProjectVisual } from "@/components/projects/ProjectVisual";
import type { Project } from "@/data/projects";

/** A real screenshot when the project has one, otherwise the code-drawn cover art. */
export function ProjectCover({ project, sizes }: { project: Project; sizes: string }) {
  if (!project.image) return <ProjectVisual kind={project.visual} hue={project.hue} />;
  return (
    <div className="relative h-full w-full bg-[#0b0b12]">
      <Image
        src={project.image.src}
        alt={project.image.alt}
        fill
        sizes={sizes}
        className="object-cover object-top"
      />
      {/* tint so screenshots sit inside the dark theme */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{ background: `linear-gradient(160deg, hsl(${project.hue} 90% 60% / 0.10), transparent 55%)` }}
      />
    </div>
  );
}
