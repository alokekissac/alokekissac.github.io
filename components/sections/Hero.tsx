"use client";

import dynamic from "next/dynamic";
import { motion, useScroll, useTransform } from "motion/react";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import { SplitText } from "@/components/animations/SplitText";
import { ButtonLink } from "@/components/ui/Button";
import { site } from "@/data/site";

// Backgrounds are client-only and non-critical: load them after hydration.
const Wormhole = dynamic(() => import("@/components/background/Wormhole"), { ssr: false });
// Fallback when WebGL isn't available.
const NeuralCanvas = dynamic(() => import("@/components/background/NeuralCanvas"), { ssr: false });

// CSS entrance (see .fade-up in globals.css) so the hero paints before hydration.
const delay = (seconds: number) => ({ animationDelay: `${seconds}s` });

const meta = [
  { label: "Graduated", value: "MSc Artificial Intelligence", sub: "Dublin Business School" },
  { label: "Focus", value: "RAG · Machine Learning", sub: "Full-stack products" },
  { label: "Based in", value: site.location, sub: "Open to opportunities" },
];

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });
  const contentY = useTransform(scrollYProgress, [0, 1], ["0%", "18%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.75], [1, 0]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.12]);
  const [webglFailed, setWebglFailed] = useState(false);
  const onUnsupported = useCallback(() => setWebglFailed(true), []);
  // Scrolling out of the hero accelerates travel through the wormhole.
  const getBoost = useCallback(() => scrollYProgress.get(), [scrollYProgress]);

  return (
    <section
      ref={ref}
      id="home"
      aria-labelledby="hero-title"
      className="relative flex min-h-[100svh] flex-col overflow-hidden"
    >
      {/* Background layers */}
      <motion.div aria-hidden="true" className="absolute inset-0" style={{ scale: bgScale }}>
        <div className="absolute inset-0 bg-[radial-gradient(55%_50%_at_72%_50%,rgb(40_80_220/0.18),transparent_70%),radial-gradient(40%_40%_at_15%_85%,rgb(60_90_200/0.08),transparent_70%)]" />
        <div className="page-in absolute inset-0 [animation-duration:1.8s]">
          {webglFailed ? (
            <NeuralCanvas className="h-full w-full [mask-image:radial-gradient(120%_90%_at_70%_40%,#000_35%,transparent_85%)]" />
          ) : (
            <Wormhole
              className="h-full w-full"
              onUnsupported={onUnsupported}
              getBoost={getBoost}
            />
          )}
        </div>
        {/* Readability scrims: keep the headline side calm */}
        <div className="absolute inset-0 bg-ink/45 md:hidden" />
        <div className="absolute inset-y-0 left-0 hidden w-[62%] bg-gradient-to-r from-ink/85 via-ink/45 to-transparent md:block" />
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/70 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-b from-transparent to-ink" />
      </motion.div>

      <motion.div
        className="container-x relative z-10 flex flex-1 flex-col justify-center pt-32 pb-16 md:pt-36"
        style={{ y: contentY, opacity: contentOpacity }}
      >
        <div className="fade-up flex flex-wrap items-center gap-3" style={delay(0)}>
          <span className="glass inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs text-fg/90">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inset-0 animate-ping rounded-full bg-signal/60 motion-reduce:hidden" />
              <span className="relative h-2 w-2 rounded-full bg-signal" />
            </span>
            Available for opportunities
          </span>
        </div>

        <p className="fade-up mt-8 text-lg text-muted md:text-xl" style={delay(0.05)}>
          Hi, I&apos;m
        </p>

        <h1
          id="hero-title"
          className="mt-3 text-[clamp(2.75rem,7.6vw,7.5rem)] leading-[0.92] font-medium tracking-[-0.045em]"
        >
          <SplitText
            immediate
            delay={0.1}
            stagger={0.06}
            lines={["Aloke", "K Issac"]}
            accentWords={["K"]}
            lineClassNames={["", "text-fg/55"]}
          />
        </h1>

        <p className="fade-up mt-6 text-xl tracking-tight text-fg md:text-3xl" style={delay(0.35)}>
          AI Engineer <span className="font-serif text-accent italic">&amp;</span> Full Stack Developer
        </p>

        <p className="rise-in mt-8 max-w-xl text-base leading-relaxed text-muted md:text-lg">
          I build intelligent systems, interactive products, and software that turns complex ideas into useful
          experiences.
        </p>

        <div className="fade-up mt-10 flex flex-wrap items-center gap-3" style={delay(0.45)}>
          <ButtonLink href="#projects" variant="primary" icon={<ArrowDownRight size={18} />}>
            View My Work
          </ButtonLink>
          <ButtonLink href="#contact" variant="ghost" icon={<ArrowRight size={18} />}>
            Let&apos;s Connect
          </ButtonLink>
        </div>
      </motion.div>

      {/* Bottom meta row + scroll indicator */}
      <div className="fade-up container-x relative z-10 pb-8" style={delay(0.6)}>
        <div className="flex items-end justify-between gap-6 border-t border-line pt-6">
          <dl className="hidden grid-cols-3 gap-10 md:grid">
            {meta.map((m) => (
              <div key={m.label}>
                <dt className="eyebrow">{m.label}</dt>
                <dd className="mt-2 text-sm text-fg">{m.value}</dd>
                <dd className="text-sm text-subtle">{m.sub}</dd>
              </div>
            ))}
          </dl>

          <a
            href="#lab"
            className="group mx-auto flex flex-col items-center gap-3 text-subtle transition-colors hover:text-fg md:mx-0"
            aria-label="Scroll to the Lab section"
          >
            <span className="eyebrow !text-[10px]">Scroll</span>
            <span className="flex h-10 w-6 justify-center rounded-full border border-line-strong pt-2" aria-hidden="true">
              <span className="h-1.5 w-1 animate-scroll-dot rounded-full bg-fg" />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
