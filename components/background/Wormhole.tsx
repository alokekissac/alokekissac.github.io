"use client";

import { useEffect, useRef } from "react";

/**
 * Live 3D wormhole — an Einstein–Rosen bridge "embedding diagram" rendered with
 * raw WebGL2 (no Three.js).
 *
 * Geometry: a catenoid surface of revolution (throat radius 1) that flares out
 * into two near-flat sheets above and below. Everything else happens in the
 * fragment shader: an anti-aliased grid whose rings flow down through the
 * throat, twinkling speckles riding the flow, rim lighting and a white-hot throat.
 *
 * Interaction: the pointer orbits/tilts the camera; scrolling out of the hero
 * pitches the camera down and dollies into the throat and speeds up the flow.
 *
 * Performance: rendered below native resolution with additive blending (no depth
 * buffer), resolution drops automatically on slow frames, animation starts once
 * the page is idle, pauses off-screen / in background tabs, and draws a single
 * still frame with reduced motion. `onUnsupported` fires when WebGL2 isn't
 * available or would run on the CPU, so the caller can use the 2D fallback.
 */

const V_MAX = 3.0; // catenoid parameter range: radius at the rim = cosh(3) ≈ 10
const Y_SCALE = 1.25; // stretch the throat vertically
const SEG_V = 180;
const SEG_T = 160;

const VERTEX = /* glsl */ `#version 300 es
in vec2 aUV;                 // x: v in [-V_MAX, V_MAX], y: theta in [0, 2π]
uniform mat4 uViewProj;
uniform vec2 uShift;         // clip-space lens shift (places the wormhole beside the text)
out vec2 vUV;
out vec3 vPos;
out vec3 vNormal;

void main() {
  float v = aUV.x;
  float th = aUV.y;
  float ch = cosh(v);
  vec3 p = vec3(ch * cos(th), v * ${Y_SCALE.toFixed(2)}, ch * sin(th));
  vec3 n = normalize(vec3(cos(th) * ${Y_SCALE.toFixed(2)}, -sinh(v), sin(th) * ${Y_SCALE.toFixed(2)}));
  vUV = aUV;
  vPos = p;
  vNormal = n;
  vec4 clip = uViewProj * vec4(p, 1.0);
  clip.xy += uShift * clip.w;
  gl_Position = clip;
}
`;

const FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

in vec2 vUV;
in vec3 vPos;
in vec3 vNormal;
uniform float uTime;
uniform float uFlow;         // accumulated flow distance
uniform vec3  uCam;
uniform float uIntensity;
out vec4 outColor;

const float TAU = 6.2831853;
const float V_MAX = ${V_MAX.toFixed(2)};

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

// Anti-aliased grid line at integer x; fades out where lines get denser than pixels.
float gridLine(float x) {
  float w = fwidth(x);
  float d = abs(fract(x + 0.5) - 0.5);
  float line = 1.0 - smoothstep(0.0, w * 1.3, d);
  return line * (1.0 - smoothstep(0.25, 0.6, w));
}

void main() {
  float v = vUV.x;
  float av = abs(v);
  float th = vUV.y;

  float ringCoord = v * 7.0 - uFlow;          // rings travel top → bottom through the throat
  float merCoord  = th / TAU * 56.0;          // meridians

  float rings = gridLine(ringCoord);
  float mers  = gridLine(merCoord);

  float throat   = exp(-av * 1.35);                               // 1 at the throat → 0 at the rim
  float edgeFade = 1.0 - smoothstep(0.5, 1.0, av / V_MAX);
  vec3  V = normalize(uCam - vPos);
  float rim = 1.0 - abs(dot(normalize(vNormal), V));              // grazing angles glow

  vec3 deep  = vec3(0.03, 0.07, 0.24);
  vec3 blue  = vec3(0.22, 0.42, 1.00);
  vec3 ice   = vec3(0.62, 0.78, 1.00);
  vec3 white = vec3(0.95, 0.97, 1.00);

  // Translucent surface body
  vec3 col = deep * (0.35 + 1.1 * throat) * (0.35 + 0.9 * rim);

  // Flowing grid — blue on the sheets, white-hot near the throat
  float pulse = pow(0.5 + 0.5 * sin(ringCoord * 0.45 - uTime * 0.8), 10.0);
  vec3 lineCol = mix(blue, white, smoothstep(0.1, 0.85, throat));
  float lines = max(rings, mers * 0.7);
  col += lineCol * lines * (0.16 + 0.9 * throat + 0.55 * pulse * (0.25 + throat)) * (0.6 + 0.6 * rim);
  col += white * rings * mers * (0.3 + 0.9 * throat);              // lattice nodes sparkle

  // Speckles riding the flow (like matter streaming through)
  vec2 sc = vec2(ringCoord * 2.0, merCoord * 1.5);
  vec2 cell = floor(sc);
  float h = hash(cell);
  vec2 f = fract(sc) - 0.5;
  float star = step(0.86, h) * (1.0 - smoothstep(0.05, 0.32, length(f)));
  float twinkle = 0.55 + 0.45 * sin(uTime * 2.5 + h * 50.0);
  col += mix(ice, white, h) * star * twinkle * (0.25 + 1.2 * throat);

  // White-hot throat band
  col += white * exp(-av * av * 10.0) * 0.55;
  col += ice * exp(-av * av * 2.5) * 0.12;

  col *= edgeFade * uIntensity;
  // Additive, premultiplied: alpha follows brightness so CSS backgrounds show through.
  outColor = vec4(col, clamp(max(col.r, max(col.g, col.b)), 0.0, 1.0));
}
`;

type WormholeProps = {
  className?: string;
  /** Called once if WebGL2 can't be used (or would run on the CPU). */
  onUnsupported?: () => void;
  /** 0–1, e.g. hero scroll progress: flies the camera into the throat. */
  getBoost?: () => number;
};

// ---------- tiny mat4 helpers (column-major) ----------
type Vec3 = [number, number, number];

function perspective(fovy: number, aspect: number, near: number, far: number) {
  const f = 1 / Math.tan(fovy / 2);
  const nf = 1 / (near - far);
  return new Float32Array([f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0]);
}

function lookAt(eye: Vec3, target: Vec3, up: Vec3) {
  const [ex, ey, ez] = eye;
  let zx = ex - target[0], zy = ey - target[1], zz = ez - target[2];
  let len = Math.hypot(zx, zy, zz);
  zx /= len; zy /= len; zz /= len;
  let xx = up[1] * zz - up[2] * zy, xy = up[2] * zx - up[0] * zz, xz = up[0] * zy - up[1] * zx;
  len = Math.hypot(xx, xy, xz);
  xx /= len; xy /= len; xz /= len;
  const yx = zy * xz - zz * xy, yy = zz * xx - zx * xz, yz = zx * xy - zy * xx;
  return new Float32Array([
    xx, yx, zx, 0,
    xy, yy, zy, 0,
    xz, yz, zz, 0,
    -(xx * ex + xy * ey + xz * ez), -(yx * ex + yy * ey + yz * ez), -(zx * ex + zy * ey + zz * ez), 1,
  ]);
}

function multiply(a: Float32Array, b: Float32Array) {
  const out = new Float32Array(16);
  for (let c = 0; c < 4; c++)
    for (let r = 0; r < 4; r++)
      out[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
  return out;
}

function compile(gl: WebGL2RenderingContext, type: number, src: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.warn("[wormhole] shader error:", gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function buildMesh() {
  const uv = new Float32Array((SEG_V + 1) * (SEG_T + 1) * 2);
  let k = 0;
  for (let i = 0; i <= SEG_V; i++) {
    const v = -V_MAX + (2 * V_MAX * i) / SEG_V;
    for (let j = 0; j <= SEG_T; j++) {
      uv[k++] = v;
      uv[k++] = (Math.PI * 2 * j) / SEG_T;
    }
  }
  const indices = new Uint16Array(SEG_V * SEG_T * 6);
  k = 0;
  const row = SEG_T + 1;
  for (let i = 0; i < SEG_V; i++) {
    for (let j = 0; j < SEG_T; j++) {
      const a = i * row + j;
      const b = a + row;
      indices[k++] = a; indices[k++] = b; indices[k++] = a + 1;
      indices[k++] = b; indices[k++] = b + 1; indices[k++] = a + 1;
    }
  }
  return { uv, indices };
}

export default function Wormhole({ className, onUnsupported, getBoost }: WormholeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const boostRef = useRef(getBoost);
  boostRef.current = getBoost;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext("webgl2", {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      powerPreference: "low-power",
    });
    if (!gl) {
      onUnsupported?.();
      return;
    }
    // No GPU (software rasteriser): the shader would run on the CPU, so use the 2D fallback.
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : "";
    if (/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)) {
      onUnsupported?.();
      return;
    }

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!vs || !fs || !program) {
      onUnsupported?.();
      return;
    }
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      onUnsupported?.();
      return;
    }
    gl.useProgram(program);

    const { uv, indices } = buildMesh();
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const vbo = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
    gl.bufferData(gl.ARRAY_BUFFER, uv, gl.STATIC_DRAW);
    const aUV = gl.getAttribLocation(program, "aUV");
    gl.enableVertexAttribArray(aUV);
    gl.vertexAttribPointer(aUV, 2, gl.FLOAT, false, 0, 0);
    const ibo = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.CULL_FACE);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE); // additive: front and back walls glow through each other
    gl.clearColor(0, 0, 0, 0);

    const u = {
      viewProj: gl.getUniformLocation(program, "uViewProj"),
      shift: gl.getUniformLocation(program, "uShift"),
      time: gl.getUniformLocation(program, "uTime"),
      flow: gl.getUniformLocation(program, "uFlow"),
      cam: gl.getUniformLocation(program, "uCam"),
      intensity: gl.getUniformLocation(program, "uIntensity"),
    };

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

    let width = 1;
    let height = 1;
    let aspect = 1;
    let mobile = false;
    let quality = 1;
    const pointer = { x: 0, y: 0 };
    const smooth = { x: 0, y: 0, boost: 0 };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      mobile = rect.width < 768;
      aspect = rect.width / Math.max(rect.height, 1);
      const scale = Math.min(window.devicePixelRatio || 1, 1.5) * (mobile ? 0.55 : 0.75) * quality;
      width = Math.max(1, Math.round(rect.width * scale));
      height = Math.max(1, Math.round(rect.height * scale));
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
    };

    let raf = 0;
    let ready = false;
    let running = false;
    let inView = false;
    let last = performance.now();
    let time = 8;
    let flow = 0;
    let yaw = 0.6;

    const draw = () => {
      const k = 0.05;
      smooth.x += (pointer.x - smooth.x) * k;
      smooth.y += (pointer.y - smooth.y) * k;
      smooth.boost += ((boostRef.current?.() ?? 0) - smooth.boost) * 0.1;
      const b = smooth.boost;

      // Camera: side view of the throat, slightly above; pointer orbits, scroll dives in.
      const pitch = 0.2 + smooth.y * 0.22 + b * 0.6;
      const theta = yaw + smooth.x * 0.55;
      const dist = (mobile ? 16 : 13.5) - b * 4.5;
      const eye: Vec3 = [
        dist * Math.cos(pitch) * Math.sin(theta),
        dist * Math.sin(pitch),
        dist * Math.cos(pitch) * Math.cos(theta),
      ];
      const proj = perspective((mobile ? 50 : 40) * (Math.PI / 180), aspect, 0.1, 100);
      const view = lookAt(eye, [0, 0, 0], [0, 1, 0]);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniformMatrix4fv(u.viewProj, false, multiply(proj, view));
      // Desktop: to the right of the headline. Mobile: centred, raised above the copy.
      gl.uniform2f(u.shift, mobile ? 0.05 : 0.47 * (1 - b * 0.5), mobile ? 0.6 : 0.3);
      gl.uniform1f(u.time, time);
      gl.uniform1f(u.flow, flow);
      gl.uniform3f(u.cam, eye[0], eye[1], eye[2]);
      gl.uniform1f(u.intensity, mobile ? 0.7 : 1);
      gl.drawElements(gl.TRIANGLES, indices.length, gl.UNSIGNED_SHORT, 0);
    };

    let slowFrames = 0;
    let sampled = 0;
    const loop = (now: number) => {
      const rawDt = (now - last) / 1000;
      const dt = Math.min(rawDt, 0.05);
      last = now;
      time += dt;
      flow += dt * (0.55 + smooth.boost * 2.5);
      yaw += dt * 0.04;
      // Adaptive quality: if most recent frames miss ~30fps, render fewer pixels.
      if (quality > 0.45) {
        sampled += 1;
        if (rawDt > 0.034) slowFrames += 1;
        if (sampled === 45) {
          if (slowFrames > 30) {
            quality = Math.max(0.45, quality * 0.75);
            resize();
          }
          sampled = 0;
          slowFrames = 0;
        }
      }
      draw();
      raf = requestAnimationFrame(loop);
    };

    const start = () => {
      if (running || reduce || !ready) return;
      running = true;
      last = performance.now();
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const onPointer = (e: PointerEvent) => {
      if (!finePointer) return;
      pointer.x = e.clientX / window.innerWidth - 0.5;
      pointer.y = e.clientY / window.innerHeight - 0.5;
    };

    resize();
    draw();

    // Don't compete with page load: begin animating once the browser is idle.
    const hasIdle = typeof window.requestIdleCallback === "function";
    const idle = (cb: () => void) =>
      hasIdle ? window.requestIdleCallback(cb, { timeout: 1500 }) : globalThis.setTimeout(cb, 600);
    const idleId = idle(() => {
      ready = true;
      if (inView && !document.hidden) start();
    });

    const resizeObserver = new ResizeObserver(() => {
      resize();
      if (!running) draw();
    });
    resizeObserver.observe(canvas);

    const visibility = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting;
      if (inView && !document.hidden) start();
      else stop();
    });
    visibility.observe(canvas);

    const onVisibility = () => (document.hidden ? stop() : inView && start());
    const onLost = (e: Event) => {
      e.preventDefault();
      stop();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pointermove", onPointer, { passive: true });
    canvas.addEventListener("webglcontextlost", onLost);

    return () => {
      stop();
      if (hasIdle) window.cancelIdleCallback(idleId as number);
      else globalThis.clearTimeout(idleId);
      resizeObserver.disconnect();
      visibility.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("pointermove", onPointer);
      canvas.removeEventListener("webglcontextlost", onLost);
      gl.deleteBuffer(vbo);
      gl.deleteBuffer(ibo);
      gl.deleteVertexArray(vao);
      gl.deleteProgram(program);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [onUnsupported]);

  return <canvas ref={canvasRef} className={className} aria-hidden="true" />;
}
