"use client";

import dynamic from "next/dynamic";
import { AnimatePresence } from "motion/react";
import { useCallback, useState } from "react";
import { ProjectCard } from "@/components/projects/ProjectCard";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { projects, type Project } from "@/data/projects";

// The modal (and its diagram) only loads when a project is opened.
const ProjectModal = dynamic(() => import("@/components/projects/ProjectModal"), { ssr: false });

export function Projects() {
  const [open, setOpen] = useState<Project | null>(null);
  const close = useCallback(() => setOpen(null), []);

  return (
    <section id="projects" aria-labelledby="projects-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="projects-title"
            index="03"
            label="Selected work"
            title={["Things I've", "built"]}
            accentWords={["built"]}
            className="!mb-0"
          />
          <p className="max-w-sm pb-2 text-muted">
            AI systems and full-stack products. Open any project for the problem, architecture and approach behind it.
          </p>
        </div>

        <div className="mt-16 space-y-6 md:mt-24 md:space-y-10">
          {projects.map((project, i) => (
            <ProjectCard key={project.slug} project={project} index={i} total={projects.length} onOpen={setOpen} />
          ))}
        </div>
      </div>

      <AnimatePresence>{open && <ProjectModal key={open.slug} project={open} onClose={close} />}</AnimatePresence>
    </section>
  );
}
