"use client";

import { useEffect, useRef } from "react";

type Node = { x: number; y: number; vx: number; vy: number; r: number };
type Pulse = { a: number; b: number; t: number; speed: number };

const LINK_DISTANCE = 140;
const MOUSE_RADIUS = 180;

/**
 * Lightweight 2D-canvas neural network: drifting nodes, proximity links,
 * mouse "activation" and occasional signal pulses travelling along links.
 * Pauses off-screen / in background tabs and renders a single static frame
 * when the user prefers reduced motion.
 */
export default function NeuralCanvas({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d", { alpha: true });
    if (!canvas || !ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let width = 0;
    let height = 0;
    let nodes: Node[] = [];
    const pulses: Pulse[] = [];
    const mouse = { x: -9999, y: -9999, active: false };
    let raf = 0;
    let running = false;
    let lastPulse = 0;
    let inView = false;

    const setup = () => {
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      height = rect.height;
      const mobile = width < 768;
      const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1 : 1.5);
      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = mobile ? 34 : Math.min(110, Math.round((width * height) / 15000));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
        r: Math.random() * 1.3 + 0.6,
      }));
      pulses.length = 0;
    };

    const draw = (time: number) => {
      ctx.clearRect(0, 0, width, height);
      const linkDist = width < 768 ? 110 : LINK_DISTANCE;

      // Move + mouse influence
      for (const n of nodes) {
        if (!reduce) {
          n.x += n.vx;
          n.y += n.vy;
          if (n.x < -20) n.x = width + 20;
          if (n.x > width + 20) n.x = -20;
          if (n.y < -20) n.y = height + 20;
          if (n.y > height + 20) n.y = -20;
        }
        if (mouse.active) {
          const dx = n.x - mouse.x;
          const dy = n.y - mouse.y;
          const d = Math.hypot(dx, dy);
          if (d < MOUSE_RADIUS && d > 0.1) {
            // Gentle repulsion keeps the area around the pointer readable.
            const f = (1 - d / MOUSE_RADIUS) * 0.6;
            n.x += (dx / d) * f;
            n.y += (dy / d) * f;
          }
        }
      }

      // Links
      const edges: [number, number][] = [];
      ctx.lineWidth = 0.6;
      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy;
          if (d2 < linkDist * linkDist) {
            const alpha = (1 - Math.sqrt(d2) / linkDist) * 0.22;
            ctx.strokeStyle = `rgba(160,175,255,${alpha})`;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
            edges.push([i, j]);
          }
        }
      }

      // Mouse activation links
      if (mouse.active) {
        for (const n of nodes) {
          const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
          if (d < MOUSE_RADIUS * 1.1) {
            ctx.strokeStyle = `rgba(182,156,255,${(1 - d / (MOUSE_RADIUS * 1.1)) * 0.35})`;
            ctx.beginPath();
            ctx.moveTo(mouse.x, mouse.y);
            ctx.lineTo(n.x, n.y);
            ctx.stroke();
          }
        }
      }

      // Nodes
      for (const n of nodes) {
        const near = mouse.active && Math.hypot(n.x - mouse.x, n.y - mouse.y) < MOUSE_RADIUS;
        ctx.fillStyle = near ? "rgba(220,215,255,0.95)" : "rgba(200,208,255,0.55)";
        ctx.beginPath();
        ctx.arc(n.x, n.y, near ? n.r + 0.6 : n.r, 0, Math.PI * 2);
        ctx.fill();
      }

      // Signal pulses travelling along existing links
      if (!reduce) {
        if (time - lastPulse > 900 && edges.length && pulses.length < 6) {
          const [a, b] = edges[Math.floor(Math.random() * edges.length)];
          pulses.push({ a, b, t: 0, speed: 0.008 + Math.random() * 0.01 });
          lastPulse = time;
        }
        for (let i = pulses.length - 1; i >= 0; i--) {
          const p = pulses[i];
          p.t += p.speed;
          const a = nodes[p.a];
          const b = nodes[p.b];
          if (!a || !b || p.t >= 1) {
            pulses.splice(i, 1);
            continue;
          }
          const x = a.x + (b.x - a.x) * p.t;
          const y = a.y + (b.y - a.y) * p.t;
          const glow = ctx.createRadialGradient(x, y, 0, x, y, 8);
          glow.addColorStop(0, "rgba(142,162,255,0.9)");
          glow.addColorStop(1, "rgba(142,162,255,0)");
          ctx.fillStyle = glow;
          ctx.beginPath();
          ctx.arc(x, y, 8, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const loop = (time: number) => {
      draw(time);
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (running || reduce) return;
      running = true;
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointer = (e: PointerEvent) => {
      if (!finePointer) return;
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
      mouse.active = mouse.y >= 0 && mouse.y <= rect.height;
    };
    const onLeave = () => {
      mouse.active = false;
    };

    setup();
    if (reduce) draw(0);

    const resizeObserver = new ResizeObserver(() => {
      setup();
      if (reduce) draw(0);
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) start();
      else stop();
    });
    visibility.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : inView && start());
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    document.documentElement.addEventListener("pointerleave", onLeave);

    return () => {
      stop();
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      document.documentElement.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
