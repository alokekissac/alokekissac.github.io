"use client";

import { useEffect, useRef } from "react";

/** Contact-section flame colours (white-hot, core, base, tip). */
const COLORS = ["255,255,255", "201,209,255", "142,162,255", "182,156,255"];

type Spark = { x: number; y: number; vx: number; vy: number; life: number; decay: number; size: number; c: string };

const MIRROR_PROPS = [
  "boxSizing", "width", "height", "overflowX", "overflowY",
  "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
  "paddingTop", "paddingRight", "paddingBottom", "paddingLeft",
  "fontStyle", "fontVariant", "fontWeight", "fontStretch", "fontSize", "lineHeight", "fontFamily",
  "textAlign", "textTransform", "textIndent", "letterSpacing", "wordSpacing", "tabSize",
] as const;

/** Viewport position of the text caret inside an input/textarea (mirror-div technique). */
function caretPoint(el: HTMLInputElement | HTMLTextAreaElement) {
  const rect = el.getBoundingClientRect();
  const cs = getComputedStyle(el);
  const mirror = document.createElement("div");
  const isInput = el.tagName === "INPUT";
  for (const p of MIRROR_PROPS) mirror.style[p] = cs[p];
  Object.assign(mirror.style, {
    position: "fixed",
    visibility: "hidden",
    top: "0",
    left: "-9999px",
    whiteSpace: isInput ? "pre" : "pre-wrap",
    wordWrap: isInput ? "normal" : "break-word",
    overflow: "hidden",
  });
  const pos = el.selectionEnd ?? el.value.length;
  mirror.textContent = el.value.slice(0, pos);
  const mark = document.createElement("span");
  mark.textContent = el.value.slice(pos) || ".";
  mirror.appendChild(mark);
  document.body.appendChild(mirror);
  const lineH = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.3;
  const x = rect.left + mark.offsetLeft - el.scrollLeft;
  const y = rect.top + mark.offsetTop - el.scrollTop + lineH / 2;
  document.body.removeChild(mirror);
  return {
    x: Math.max(rect.left + 4, Math.min(rect.right - 4, x)),
    y: Math.max(rect.top + 4, Math.min(rect.bottom - 4, y)),
  };
}

/**
 * Wrap a form: every keystroke in its inputs/textareas throws a few sparks off the caret,
 * in the Contact section's flame colours. Works for touch keyboards too.
 */
export function TypingSparks({ children }: { children: React.ReactNode }) {
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    if (!wrap || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    // Mounted on <body> so ancestor transforms (reveal animations) don't offset a fixed canvas.
    const canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    Object.assign(canvas.style, { position: "fixed", inset: "0", width: "100%", height: "100%", pointerEvents: "none", zIndex: "90" });
    document.body.appendChild(canvas);
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const sparks: Spark[] = [];
    let raf = 0;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
    };
    resize();

    const draw = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.globalCompositeOperation = "lighter";
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vy += 0.09; // gravity: sparks arc up then fall
        s.vx *= 0.97;
        s.life -= s.decay;
        if (s.life <= 0) {
          sparks.splice(i, 1);
          continue;
        }
        const r = s.size * (0.35 + s.life * 0.65);
        // short streak in the direction of travel
        ctx.strokeStyle = `rgba(${s.c},${Math.min(1, s.life * 1.1).toFixed(3)})`;
        ctx.lineWidth = r;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(s.x, s.y);
        ctx.lineTo(s.x - s.vx * 2.2, s.y - s.vy * 2.2);
        ctx.stroke();
        ctx.fillStyle = `rgba(${s.c},${(s.life * 0.28).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, r * 3.5, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = sparks.length ? requestAnimationFrame(draw) : 0;
      if (!raf) ctx.clearRect(0, 0, canvas.width, canvas.height);
    };

    const onInput = (e: Event) => {
      const el = e.target;
      if (!(el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement)) return;
      const deleting = (e as InputEvent).inputType?.startsWith("delete");
      const { x, y } = caretPoint(el);
      const n = deleting ? 4 : 7 + ((Math.random() * 4) | 0);
      for (let i = 0; i < n && sparks.length < 220; i++) {
        const a = deleting ? Math.PI / 2 + (Math.random() - 0.5) * 1.2 : -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
        const sp = deleting ? 0.6 + Math.random() : 1.6 + Math.random() * 2.6;
        sparks.push({
          x,
          y,
          vx: Math.cos(a) * sp,
          vy: Math.sin(a) * sp,
          life: 1,
          decay: 0.03 + Math.random() * 0.03,
          size: 1.3 + Math.random() * 1.6,
          c: deleting ? COLORS[2] : COLORS[(Math.random() * COLORS.length) | 0],
        });
      }
      if (!raf) raf = requestAnimationFrame(draw);
    };

    wrap.addEventListener("input", onInput);
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(raf);
      wrap.removeEventListener("input", onInput);
      window.removeEventListener("resize", resize);
      canvas.remove();
    };
  }, []);

  return (
    <div ref={wrapRef} className="relative">
      {children}
    </div>
  );
}
