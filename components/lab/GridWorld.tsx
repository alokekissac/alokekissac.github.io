"use client";

import { Brain, Pause, Play, RotateCcw, Shuffle, Eraser } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * A live Q-learning agent in a small grid world. Visitors paint walls and drag the
 * start/goal; the agent keeps learning and adapts. Value estimates are drawn as a
 * heatmap and the current greedy route as a glowing line.
 */

const COLS = 12;
const ROWS = 7;
const N = COLS * ROWS;
const ACTIONS: [number, number][] = [
  [0, -1], // up
  [1, 0], // right
  [0, 1], // down
  [-1, 0], // left
];
const GAMMA = 0.95;
const ALPHA = 0.5;
const STEP_R = -0.04;
const BUMP_R = -0.3;
const GOAL_R = 1;
const MAX_STEPS = 300;
const EPS_MIN = 0.03;
const SPEEDS = [
  { id: "watch", label: "Watch", steps: 0.5 },
  { id: "fast", label: "Fast", steps: 8 },
  { id: "turbo", label: "Turbo", steps: 1500 },
] as const;
type SpeedId = (typeof SPEEDS)[number]["id"];

const C = {
  cyan: "94,203,255",
  cyanHex: "#5ecbff",
  goal: "94,230,184",
  start: "182,156,255",
};

const idx = (x: number, y: number) => y * COLS + x;
const xy = (s: number) => [s % COLS, Math.floor(s / COLS)] as const;

function defaultWalls() {
  const w = new Uint8Array(N);
  for (let y = 0; y <= 4; y++) w[idx(3, y)] = 1;
  for (let y = 2; y <= 6; y++) w[idx(7, y)] = 1;
  w[idx(9, 1)] = w[idx(10, 1)] = w[idx(9, 5)] = 1;
  return w;
}

/** Shortest route length from start to goal (BFS), or -1 if unreachable. */
function shortest(walls: Uint8Array, start: number, goal: number) {
  const dist = new Int16Array(N).fill(-1);
  dist[start] = 0;
  const q = [start];
  while (q.length) {
    const s = q.shift()!;
    if (s === goal) return dist[s];
    const [x, y] = xy(s);
    for (const [dx, dy] of ACTIONS) {
      const nx = x + dx;
      const ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS) continue;
      const n = idx(nx, ny);
      if (walls[n] || dist[n] >= 0) continue;
      dist[n] = dist[s] + 1;
      q.push(n);
    }
  }
  return -1;
}

type Stats = { episode: number; lastSteps: number; eps: number; optimal: number; greedy: number; solved: boolean };

export function GridWorld() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState<SpeedId>("fast");
  const [stats, setStats] = useState<Stats>({ episode: 0, lastSteps: 0, eps: 0.9, optimal: 0, greedy: -1, solved: false });
  const [history, setHistory] = useState<number[]>([]);

  // Mutable simulation state lives in a ref so the rAF loop never re-renders React.
  const sim = useRef({
    walls: defaultWalls(),
    start: idx(0, 3),
    goal: idx(11, 3),
    Q: new Float32Array(N * 4),
    agent: idx(0, 3),
    steps: 0,
    episode: 0,
    eps: 0.9,
    optimal: 0,
    greedyPath: [] as number[],
    solved: false,
    trail: [] as number[],
    history: [] as number[],
    acc: 0,
    dirty: true,
    visible: false,
  });
  const playingRef = useRef(playing);
  const speedRef = useRef(speed);
  useEffect(() => {
    playingRef.current = playing;
  }, [playing]);
  useEffect(() => {
    speedRef.current = speed;
  }, [speed]);

  const recomputeOptimal = useCallback(() => {
    const s = sim.current;
    s.optimal = shortest(s.walls, s.start, s.goal);
  }, []);

  /** Something about the world changed: keep the brain, but explore again so it can adapt. */
  const worldChanged = useCallback(() => {
    const s = sim.current;
    recomputeOptimal();
    s.eps = Math.max(s.eps, 0.35);
    s.solved = false;
    s.agent = s.start;
    s.steps = 0;
    s.trail = [];
    s.dirty = true;
  }, [recomputeOptimal]);

  const resetBrain = useCallback(() => {
    const s = sim.current;
    s.Q.fill(0);
    s.episode = 0;
    s.eps = 0.9;
    s.history = [];
    s.agent = s.start;
    s.steps = 0;
    s.trail = [];
    s.solved = false;
    s.greedyPath = [];
    recomputeOptimal();
    setHistory([]);
    setPlaying(true);
  }, [recomputeOptimal]);

  const randomMaze = useCallback(() => {
    const s = sim.current;
    for (let tries = 0; tries < 50; tries++) {
      const w = new Uint8Array(N);
      for (let i = 0; i < N; i++) if (i !== s.start && i !== s.goal && Math.random() < 0.27) w[i] = 1;
      if (shortest(w, s.start, s.goal) > 0) {
        s.walls = w;
        break;
      }
    }
    worldChanged();
  }, [worldChanged]);

  const clearWalls = useCallback(() => {
    sim.current.walls = new Uint8Array(N);
    worldChanged();
  }, [worldChanged]);

  useEffect(() => {
    recomputeOptimal();
    const wrap = wrapRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!wrap || !canvas || !ctx) return;
    const s = sim.current;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let cell = 40;
    let dpr = 1;
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      cell = wrap.clientWidth / COLS;
      canvas.width = Math.round(wrap.clientWidth * dpr);
      canvas.height = Math.round(cell * ROWS * dpr);
      canvas.style.height = `${cell * ROWS}px`;
      s.dirty = true;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);

    const io = new IntersectionObserver(([e]) => (s.visible = e.isIntersecting), { threshold: 0.15 });
    io.observe(canvas);

    // ---------------------------------------------------------------- learning
    const greedy = (st: number) => {
      const base = st * 4;
      let best = -Infinity;
      let pick = 0;
      let ties = 0;
      for (let a = 0; a < 4; a++) {
        const v = s.Q[base + a];
        if (v > best + 1e-9) {
          best = v;
          pick = a;
          ties = 1;
        } else if (Math.abs(v - best) <= 1e-9 && Math.random() < 1 / ++ties) pick = a;
      }
      return pick;
    };
    const maxQ = (st: number) => Math.max(s.Q[st * 4], s.Q[st * 4 + 1], s.Q[st * 4 + 2], s.Q[st * 4 + 3]);

    const endEpisode = () => {
      s.history.push(s.steps);
      if (s.history.length > 160) s.history.shift();
      s.episode++;
      s.eps = Math.max(EPS_MIN, s.eps * 0.965);
      s.agent = s.start;
      s.steps = 0;
      s.trail = [];
    };

    const step = () => {
      const st = s.agent;
      const a = Math.random() < s.eps ? (Math.random() * 4) | 0 : greedy(st);
      const [x, y] = xy(st);
      const nx = x + ACTIONS[a][0];
      const ny = y + ACTIONS[a][1];
      let next = st;
      let r = BUMP_R;
      if (nx >= 0 && ny >= 0 && nx < COLS && ny < ROWS && !s.walls[idx(nx, ny)]) {
        next = idx(nx, ny);
        r = STEP_R;
      }
      const done = next === s.goal;
      if (done) r = GOAL_R;
      const target = done ? r : r + GAMMA * maxQ(next);
      s.Q[st * 4 + a] += ALPHA * (target - s.Q[st * 4 + a]);
      s.agent = next;
      s.steps++;
      if (!reduce) {
        s.trail.push(next);
        if (s.trail.length > 18) s.trail.shift();
      }
      if (done || s.steps >= MAX_STEPS) endEpisode();
    };

    const computeGreedyPath = () => {
      const path = [s.start];
      const seen = new Set([s.start]);
      let cur = s.start;
      for (let i = 0; i < N && cur !== s.goal; i++) {
        const base = cur * 4;
        let a = 0;
        for (let k = 1; k < 4; k++) if (s.Q[base + k] > s.Q[base + a]) a = k;
        if (!s.Q[base] && !s.Q[base + 1] && !s.Q[base + 2] && !s.Q[base + 3]) break; // untrained
        const [x, y] = xy(cur);
        const nx = x + ACTIONS[a][0];
        const ny = y + ACTIONS[a][1];
        if (nx < 0 || ny < 0 || nx >= COLS || ny >= ROWS || s.walls[idx(nx, ny)]) break;
        cur = idx(nx, ny);
        if (seen.has(cur)) break;
        seen.add(cur);
        path.push(cur);
      }
      s.greedyPath = path;
      const reached = path[path.length - 1] === s.goal;
      s.solved = reached && s.optimal > 0 && path.length - 1 === s.optimal;
      return reached ? path.length - 1 : -1;
    };

    // ---------------------------------------------------------------- drawing
    const center = (st: number) => {
      const [x, y] = xy(st);
      return [(x + 0.5) * cell, (y + 0.5) * cell] as const;
    };

    const draw = (t: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const W = cell * COLS;
      const H = cell * ROWS;
      ctx.clearRect(0, 0, W, H);

      // value heatmap
      let vmin = Infinity;
      let vmax = -Infinity;
      for (let i = 0; i < N; i++) {
        if (s.walls[i]) continue;
        const v = maxQ(i);
        if (v < vmin) vmin = v;
        if (v > vmax) vmax = v;
      }
      const span = vmax - vmin || 1;
      for (let i = 0; i < N; i++) {
        const [x, y] = xy(i);
        const px = x * cell;
        const py = y * cell;
        if (s.walls[i]) {
          ctx.fillStyle = "#1b1b27";
          ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
          ctx.fillStyle = "rgba(255,255,255,0.06)";
          ctx.fillRect(px + 1, py + 1, cell - 2, 2);
          continue;
        }
        const trained = s.Q[i * 4] || s.Q[i * 4 + 1] || s.Q[i * 4 + 2] || s.Q[i * 4 + 3];
        const v = trained ? (maxQ(i) - vmin) / span : 0;
        ctx.fillStyle = `rgba(${C.cyan},${(0.03 + v * v * 0.32).toFixed(3)})`;
        ctx.fillRect(px + 1, py + 1, cell - 2, cell - 2);
        ctx.strokeStyle = "rgba(255,255,255,0.045)";
        ctx.strokeRect(px + 0.5, py + 0.5, cell - 1, cell - 1);

        // learned direction arrow
        if (trained && i !== s.goal) {
          let a = 0;
          for (let k = 1; k < 4; k++) if (s.Q[i * 4 + k] > s.Q[i * 4 + a]) a = k;
          const [cx, cy] = center(i);
          const len = cell * 0.17;
          const [dx, dy] = ACTIONS[a];
          ctx.strokeStyle = `rgba(255,255,255,${(0.12 + v * 0.3).toFixed(3)})`;
          ctx.lineWidth = 1.25;
          const tx = cx + dx * len;
          const ty = cy + dy * len;
          const bx = tx - dx * len * 0.75;
          const by = ty - dy * len * 0.75;
          ctx.beginPath();
          ctx.moveTo(cx - dx * len, cy - dy * len);
          ctx.lineTo(tx, ty);
          ctx.moveTo(bx - dy * len * 0.5, by + dx * len * 0.5);
          ctx.lineTo(tx, ty);
          ctx.lineTo(bx + dy * len * 0.5, by - dx * len * 0.5);
          ctx.stroke();
        }
      }

      // greedy route
      if (s.greedyPath.length > 1) {
        ctx.save();
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.shadowColor = s.solved ? `rgb(${C.goal})` : `rgb(${C.cyan})`;
        ctx.shadowBlur = s.solved ? 14 : 6;
        ctx.strokeStyle = s.solved ? `rgba(${C.goal},0.9)` : `rgba(${C.cyan},0.45)`;
        ctx.lineWidth = s.solved ? 3 : 2;
        ctx.setLineDash(s.solved ? [] : [4, 6]);
        ctx.beginPath();
        s.greedyPath.forEach((st, i) => {
          const [cx, cy] = center(st);
          if (i) ctx.lineTo(cx, cy);
          else ctx.moveTo(cx, cy);
        });
        ctx.stroke();
        ctx.restore();
      }

      // start pad
      {
        const [cx, cy] = center(s.start);
        ctx.strokeStyle = `rgba(${C.start},0.8)`;
        ctx.lineWidth = 1.5;
        ctx.setLineDash([3, 3]);
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.32, 0, Math.PI * 2);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // goal: pulsing star
      {
        const [cx, cy] = center(s.goal);
        const pulse = reduce ? 1 : 1 + Math.sin(t / 300) * 0.08;
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.7);
        g.addColorStop(0, `rgba(${C.goal},0.45)`);
        g.addColorStop(1, `rgba(${C.goal},0)`);
        ctx.fillStyle = g;
        ctx.fillRect(cx - cell, cy - cell, cell * 2, cell * 2);
        ctx.fillStyle = `rgb(${C.goal})`;
        ctx.beginPath();
        const R = cell * 0.26 * pulse;
        for (let k = 0; k < 10; k++) {
          const ang = -Math.PI / 2 + (k * Math.PI) / 5;
          const rr = k % 2 ? R * 0.45 : R;
          ctx.lineTo(cx + Math.cos(ang) * rr, cy + Math.sin(ang) * rr);
        }
        ctx.closePath();
        ctx.fill();
      }

      // trail + agent
      s.trail.forEach((st, i) => {
        const [cx, cy] = center(st);
        const f = (i + 1) / s.trail.length;
        ctx.fillStyle = `rgba(${C.cyan},${(f * 0.35).toFixed(3)})`;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.1 * f + 1, 0, Math.PI * 2);
        ctx.fill();
      });
      {
        const [cx, cy] = center(s.agent);
        const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, cell * 0.55);
        g.addColorStop(0, "rgba(255,255,255,0.95)");
        g.addColorStop(0.25, `rgba(${C.cyan},0.85)`);
        g.addColorStop(1, `rgba(${C.cyan},0)`);
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.55, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(cx, cy, cell * 0.12, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    // ---------------------------------------------------------------- loop
    let raf = 0;
    let frame = 0;
    const loop = (t: number) => {
      frame++;
      if (s.visible) {
        if (playingRef.current && s.optimal > 0) {
          const per = SPEEDS.find((x) => x.id === speedRef.current)!.steps;
          s.acc += per;
          while (s.acc >= 1) {
            step();
            s.acc -= 1;
          }
        }
        if (frame % 6 === 0) {
          const g = computeGreedyPath();
          setStats({
            episode: s.episode,
            lastSteps: s.history[s.history.length - 1] ?? 0,
            eps: s.eps,
            optimal: s.optimal,
            greedy: g,
            solved: s.solved,
          });
          if (frame % 18 === 0) setHistory([...s.history]);
        }
        draw(t);
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    // ---------------------------------------------------------------- editing
    let mode: "wall" | "erase" | "start" | "goal" | null = null;
    const cellAt = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      const x = Math.floor(((e.clientX - r.left) / r.width) * COLS);
      const y = Math.floor(((e.clientY - r.top) / r.height) * ROWS);
      if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return -1;
      return idx(x, y);
    };
    const apply = (c: number) => {
      if (c < 0) return;
      if (mode === "start" || mode === "goal") {
        if (s.walls[c] || c === (mode === "start" ? s.goal : s.start)) return;
        if (mode === "start" && c !== s.start) {
          s.start = c;
          worldChanged();
        }
        if (mode === "goal" && c !== s.goal) {
          s.goal = c;
          worldChanged();
        }
        return;
      }
      if (c === s.start || c === s.goal) return;
      const want = mode === "wall" ? 1 : 0;
      if (s.walls[c] !== want) {
        s.walls[c] = want;
        worldChanged();
      }
    };
    const onDown = (e: PointerEvent) => {
      const c = cellAt(e);
      if (c < 0) return;
      canvas.setPointerCapture(e.pointerId);
      mode = c === s.goal ? "goal" : c === s.start ? "start" : s.walls[c] ? "erase" : "wall";
      apply(c);
    };
    const onMove = (e: PointerEvent) => {
      if (mode) apply(cellAt(e));
    };
    const onUp = () => (mode = null);
    canvas.addEventListener("pointerdown", onDown);
    canvas.addEventListener("pointermove", onMove);
    canvas.addEventListener("pointerup", onUp);
    canvas.addEventListener("pointercancel", onUp);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onUp);
    };
  }, [recomputeOptimal, worldChanged]);

  // ---------------------------------------------------------------- UI
  const blocked = stats.optimal < 0;
  const status = blocked
    ? { text: "No route to the goal — clear a wall", tone: "text-amber-300" }
    : stats.solved
      ? { text: `Solved — found the shortest route (${stats.optimal} steps)`, tone: "text-signal" }
      : stats.greedy > 0
        ? { text: `Reaches the goal in ${stats.greedy} steps — still optimising`, tone: "text-[#5ecbff]" }
        : stats.episode === 0
          ? { text: "Exploring at random…", tone: "text-muted" }
          : { text: "Learning which moves lead to the goal…", tone: "text-muted" };

  return (
    <div className="overflow-hidden rounded-[28px] border border-line bg-ink-2">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-4 py-3 md:px-6">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setPlaying((p) => !p)}
            className="btn-glow inline-flex h-9 items-center gap-2 rounded-full bg-fg px-4 text-sm font-medium text-ink transition-shadow"
            aria-pressed={playing}
          >
            {playing ? <Pause size={14} aria-hidden="true" /> : <Play size={14} aria-hidden="true" />}
            {playing ? "Pause" : "Train"}
          </button>
          <div role="group" aria-label="Training speed" className="flex rounded-full border border-line p-0.5">
            {SPEEDS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSpeed(sp.id)}
                aria-pressed={speed === sp.id}
                className={cn(
                  "h-8 rounded-full px-3 font-mono text-[11px] tracking-wider uppercase transition-colors",
                  speed === sp.id ? "bg-white/10 text-fg" : "text-subtle hover:text-fg",
                )}
              >
                {sp.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          {[
            { label: "Random maze", icon: Shuffle, on: randomMaze },
            { label: "Clear walls", icon: Eraser, on: clearWalls },
            { label: "Reset brain", icon: RotateCcw, on: resetBrain },
          ].map(({ label, icon: Icon, on }) => (
            <button
              key={label}
              type="button"
              onClick={on}
              className="btn-glow inline-flex h-9 items-center gap-1.5 rounded-full border border-line px-3 text-xs text-muted transition-[color,box-shadow,border-color] hover:text-fg"
            >
              <Icon size={13} aria-hidden="true" />
              <span className="hidden sm:inline">{label}</span>
              <span className="sr-only sm:hidden">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-0 lg:grid-cols-[1fr_260px]">
        {/* Board */}
        <div className="p-3 md:p-5">
          <div ref={wrapRef} className="w-full">
            <canvas
              ref={canvasRef}
              className="block w-full cursor-crosshair touch-none rounded-xl"
              role="img"
              aria-label="Grid world: a reinforcement-learning agent learning to reach a goal. Click or drag to add or remove walls; drag the star or the start ring to move them."
            />
          </div>
          <p className="mt-3 text-xs text-subtle">
            <span className="text-fg/80">Click or drag</span> to build walls · drag the{" "}
            <span className="text-signal">★ goal</span> or <span className="text-accent-2">◌ start</span> to move them. The
            agent keeps its memory and adapts.
          </p>
        </div>

        {/* Readout */}
        <aside className="flex flex-col gap-5 border-t border-line p-5 lg:border-t-0 lg:border-l">
          <div>
            <p className="eyebrow flex items-center gap-2">
              <Brain size={12} aria-hidden="true" /> Agent status
            </p>
            <p className={cn("mt-2 text-sm leading-snug", status.tone)} aria-live="polite">
              {status.text}
            </p>
          </div>

          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-xs">
            <div>
              <dt className="text-subtle">Episodes</dt>
              <dd className="mt-0.5 text-lg text-fg tabular-nums">{stats.episode.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-subtle">Last run</dt>
              <dd className="mt-0.5 text-lg text-fg tabular-nums">{stats.lastSteps || "—"}</dd>
            </div>
            <div>
              <dt className="text-subtle">Exploration ε</dt>
              <dd className="mt-0.5 text-lg text-fg tabular-nums">{stats.eps.toFixed(2)}</dd>
            </div>
            <div>
              <dt className="text-subtle">Shortest</dt>
              <dd className="mt-0.5 text-lg text-fg tabular-nums">{stats.optimal > 0 ? stats.optimal : "—"}</dd>
            </div>
          </dl>

          <LearningCurve history={history} optimal={stats.optimal} />

          <p className="text-xs leading-relaxed text-subtle">
            Tabular Q-learning: −0.04 per move, −0.3 for bumping a wall, +1 at the goal, γ = 0.95. Brighter cells are
            ones the agent values more; arrows are its current best move.
          </p>
        </aside>
      </div>
    </div>
  );
}

/** Steps per episode, falling as the agent learns; dashed line = shortest possible. */
function LearningCurve({ history, optimal }: { history: number[]; optimal: number }) {
  const W = 220;
  const H = 70;
  if (history.length < 2) {
    return (
      <div>
        <p className="font-mono text-[11px] text-subtle">Steps per episode</p>
        <div className="mt-2 flex h-[70px] items-center justify-center rounded-lg border border-dashed border-line text-[11px] text-subtle">
          collecting episodes…
        </div>
      </div>
    );
  }
  const max = Math.max(...history, optimal, 10);
  const scaleY = (v: number) => H - 4 - (Math.log(v + 1) / Math.log(max + 1)) * (H - 8);
  // light smoothing so the trend reads clearly
  const smooth = history.map((_, i) => {
    const w = history.slice(Math.max(0, i - 4), i + 1);
    return w.reduce((a, b) => a + b, 0) / w.length;
  });
  const pts = smooth.map((v, i) => `${((i / (smooth.length - 1)) * W).toFixed(1)},${scaleY(v).toFixed(1)}`).join(" ");
  const last = smooth[smooth.length - 1];
  return (
    <div>
      <p className="flex justify-between font-mono text-[11px] text-subtle">
        <span>Steps per episode</span>
        <span className="text-fg/80 tabular-nums">{Math.round(last)}</span>
      </p>
      <svg viewBox={`0 0 ${W} ${H}`} className="mt-2 h-[70px] w-full" preserveAspectRatio="none" aria-hidden="true">
        {optimal > 0 && (
          <line x1="0" x2={W} y1={scaleY(optimal)} y2={scaleY(optimal)} stroke="#5ee6b8" strokeOpacity="0.6" strokeDasharray="3 4" strokeWidth="1" vectorEffect="non-scaling-stroke" />
        )}
        <polyline points={pts} fill="none" stroke="#5ecbff" strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
      </svg>
      <p className="mt-1 flex items-center gap-1.5 text-[10px] text-subtle">
        <span className="inline-block h-px w-3 border-t border-dashed border-signal" aria-hidden="true" /> shortest possible
      </p>
    </div>
  );
}
