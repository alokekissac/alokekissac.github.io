"use client";

import dynamic from "next/dynamic";
import { SectionHeading } from "@/components/ui/SectionHeading";

// Canvas + simulation are client-only.
const GridWorld = dynamic(() => import("@/components/lab/GridWorld").then((m) => m.GridWorld), {
  ssr: false,
  loading: () => <div className="aspect-[12/9] w-full animate-pulse rounded-[28px] border border-line bg-ink-2 md:aspect-[16/7]" />,
});

export function Lab() {
  return (
    <section id="lab" aria-labelledby="lab-title" className="relative py-24 md:py-32">
      <div className="container-x">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <SectionHeading
            id="lab-title"
            index="01"
            label="Live lab"
            title={["Train an AI", "right here"]}
            accentWords={["AI"]}
            className="!mb-0"
          />
          <p className="max-w-sm pb-2 text-muted">
            A reinforcement-learning agent learns to reach the star from scratch, in your browser. Build walls to make it
            harder and watch it adapt — the same idea behind my RL traffic-signal project.
          </p>
        </div>
        <div className="mt-12 md:mt-16">
          <GridWorld />
        </div>
      </div>
    </section>
  );
}
