import type { ProjectVisual as VisualKind } from "@/data/projects";

/**
 * Abstract, code-drawn cover art for each project (no screenshots yet).
 * Replace with real screenshots via next/image when available.
 */
export function ProjectVisual({ kind, hue }: { kind: VisualKind; hue: number }) {
  const c = (l: number, a = 1) => `hsl(${hue} 90% ${l}% / ${a})`;

  return (
    <svg viewBox="0 0 400 300" className="h-full w-full" aria-hidden="true" focusable="false"preserveAspectRatio="xMidYMid slice">
      <defs>
        <radialGradient id={`glow-${kind}`} cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor={c(60, 0.45)} />
          <stop offset="100%" stopColor={c(20, 0)} />
        </radialGradient>
        <linearGradient id={`line-${kind}`} x1="0" x2="1">
          <stop offset="0%" stopColor={c(70, 0)} />
          <stop offset="50%" stopColor={c(75, 0.9)} />
          <stop offset="100%" stopColor={c(70, 0)} />
        </linearGradient>
        <pattern id={`grid-${kind}`} width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0H0V20" fill="none" stroke="white" strokeOpacity="0.05" />
        </pattern>
      </defs>
      <rect width="400" height="300" fill="#0b0b12" />
      <rect width="400" height="300" fill={`url(#grid-${kind})`} />
      <rect width="400" height="300" fill={`url(#glow-${kind})`} />

      {kind === "rag" && (
        <g>
          {/* Document stack */}
          {[0, 1, 2].map((i) => (
            <g key={i} transform={`translate(${70 + i * 10} ${80 + i * 10})`}>
              <rect width="90" height="116" rx="8" fill="#12121c" stroke={c(70, 0.35)} />
              {[0, 1, 2, 3, 4].map((l) => (
                <rect key={l} x="14" y={20 + l * 16} width={l % 2 ? 48 : 62} height="4" rx="2" fill="white" fillOpacity="0.14" />
              ))}
            </g>
          ))}
          {/* Chunks → vectors */}
          <path d="M190 150 C 230 150, 230 110, 270 110" stroke={`url(#line-${kind})`} strokeWidth="1.5" fill="none" />
          <path d="M190 150 C 230 150, 230 190, 270 190" stroke={`url(#line-${kind})`} strokeWidth="1.5" fill="none" />
          <path d="M190 150 L 270 150" stroke={`url(#line-${kind})`} strokeWidth="1.5" fill="none" />
          {Array.from({ length: 22 }).map((_, i) => {
            const x = 280 + ((i * 37) % 80);
            const y = 90 + ((i * 53) % 120);
            return <circle key={i} cx={x} cy={y} r={i % 5 === 0 ? 3.5 : 2} fill={c(i % 5 === 0 ? 75 : 65, i % 5 === 0 ? 1 : 0.6)} />;
          })}
          <circle cx="320" cy="150" r="34" fill="none" stroke={c(75, 0.5)} strokeDasharray="3 4" />
        </g>
      )}

      {kind === "waste" && (
        <g>
          {/* Illustrative trend — not real data */}
          {Array.from({ length: 12 }).map((_, i) => {
            const h = 40 + ((i * 29) % 70) + i * 3;
            return <rect key={i} x={60 + i * 24} y={230 - h} width="12" height={h} rx="3" fill="white" fillOpacity="0.08" />;
          })}
          <path
            d="M66 190 C 110 170, 140 180, 180 150 S 250 120, 280 128"
            stroke={c(70, 0.95)}
            strokeWidth="2"
            fill="none"
          />
          <path d="M280 128 C 310 118, 330 100, 350 92" stroke={c(70, 0.9)} strokeWidth="2" strokeDasharray="5 6" fill="none" />
          <path d="M280 128 C 310 100, 330 76, 350 64 L 350 120 C 330 124, 310 136, 280 128 Z" fill={c(60, 0.15)} />
          <circle cx="280" cy="128" r="5" fill={c(75)} />
          <line x1="280" y1="60" x2="280" y2="240" stroke="white" strokeOpacity="0.15" strokeDasharray="2 4" />
          <line x1="50" y1="231" x2="360" y2="231" stroke="white" strokeOpacity="0.15" />
        </g>
      )}

      {kind === "tour" && (
        <g>
          {/* Stylised map + route */}
          <path d="M40 220 C 90 200, 80 140, 140 130 S 220 170, 250 120 S 320 60, 360 80" stroke={c(65, 0.9)} strokeWidth="2" strokeDasharray="6 7" fill="none" />
          <path d="M20 80 Q 120 40 200 70 T 390 50" stroke="white" strokeOpacity="0.06" strokeWidth="30" fill="none" />
          <path d="M0 260 Q 140 230 260 250 T 400 240" stroke="white" strokeOpacity="0.05" strokeWidth="40" fill="none" />
          {[
            [40, 220],
            [140, 130],
            [250, 120],
            [360, 80],
          ].map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <circle r="14" fill={c(60, 0.15)} />
              <circle r="5" fill={i === 3 ? c(75) : "#fff"} fillOpacity={i === 3 ? 1 : 0.85} />
            </g>
          ))}
          <g transform="translate(250 170)">
            <rect width="110" height="56" rx="10" fill="#12121c" stroke="white" strokeOpacity="0.1" />
            <rect x="12" y="14" width="56" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
            <rect x="12" y="27" width="80" height="4" rx="2" fill="white" fillOpacity="0.15" />
            <rect x="12" y="38" width="40" height="4" rx="2" fill={c(65, 0.8)} />
          </g>
        </g>
      )}

      {kind === "travelogue" && (
        <g>
          {/* Journal cards + sparkle */}
          {[
            { x: 70, y: 70, r: -8 },
            { x: 150, y: 60, r: 3 },
            { x: 230, y: 78, r: 10 },
          ].map((card, i) => (
            <g key={i} transform={`translate(${card.x} ${card.y}) rotate(${card.r} 50 70)`}>
              <rect width="100" height="140" rx="10" fill="#12121c" stroke="white" strokeOpacity="0.12" />
              <rect x="10" y="10" width="80" height="62" rx="6" fill={c(40 + i * 10, 0.35)} />
              <rect x="10" y="84" width="60" height="5" rx="2.5" fill="white" fillOpacity="0.5" />
              <rect x="10" y="97" width="76" height="4" rx="2" fill="white" fillOpacity="0.14" />
              <rect x="10" y="108" width="50" height="4" rx="2" fill="white" fillOpacity="0.14" />
            </g>
          ))}
          <g transform="translate(320 80)" fill={c(80)}>
            <path d="M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3 Z" />
          </g>
          <g transform="translate(300 230) scale(0.6)" fill={c(80, 0.7)}>
            <path d="M0 -14 L3 -3 L14 0 L3 3 L0 14 L-3 3 L-14 0 L-3 -3 Z" />
          </g>
        </g>
      )}

      {kind === "rl" && (
        <g>
          {/* Intersection with signals and queues */}
          <rect x="170" y="0" width="60" height="300" fill="white" fillOpacity="0.05" />
          <rect x="0" y="120" width="400" height="60" fill="white" fillOpacity="0.05" />
          <line x1="200" y1="0" x2="200" y2="120" stroke="white" strokeOpacity="0.15" strokeDasharray="8 8" />
          <line x1="0" y1="150" x2="170" y2="150" stroke="white" strokeOpacity="0.15" strokeDasharray="8 8" />
          {[0, 1, 2].map((i) => (
            <rect key={`ns${i}`} x="207" y={196 + i * 30} width="16" height="24" rx="4" fill={c(70, 0.85)} />
          ))}
          {[0, 1, 2, 3].map((i) => (
            <rect key={`ew${i}`} x={140 - i * 32} y="157" width="24" height="16" rx="4" fill="white" fillOpacity="0.7" />
          ))}
          <g transform="translate(244 188)">
            <rect width="14" height="36" rx="4" fill="#12121c" stroke="white" strokeOpacity="0.15" />
            <circle cx="7" cy="9" r="4" fill="#ff5f57" fillOpacity="0.25" />
            <circle cx="7" cy="27" r="4" fill={c(70)} />
          </g>
          {/* Q-value bars */}
          <g transform="translate(270 40)">
            <rect width="110" height="62" rx="10" fill="#12121c" stroke="white" strokeOpacity="0.1" />
            <rect x="12" y="14" width="80" height="6" rx="3" fill={c(70, 0.9)} />
            <rect x="12" y="28" width="56" height="6" rx="3" fill="white" fillOpacity="0.2" />
            <rect x="12" y="42" width="40" height="4" rx="2" fill="white" fillOpacity="0.12" />
          </g>
        </g>
      )}

      {kind === "coverage" && (
        <g>
          {/* Street grid, covered streets and planned route */}
          {[70, 130, 190, 250].map((y) => (
            <line key={`h${y}`} x1="40" y1={y} x2="360" y2={y} stroke="white" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" />
          ))}
          {[70, 150, 230, 310].map((x) => (
            <line key={`v${x}`} x1={x} y1="40" x2={x} y2="270" stroke="white" strokeOpacity="0.1" strokeWidth="8" strokeLinecap="round" />
          ))}
          <path d="M70 250 V190 H150 V130 H70 V70" stroke={c(60, 0.95)} strokeWidth="5" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M70 70 H230 V190 H310 V250" stroke={c(80, 0.9)} strokeWidth="3" strokeDasharray="8 7" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M50 55 L345 45 L355 265 L45 275 Z" fill="none" stroke={c(70, 0.35)} strokeDasharray="4 5" />
          <circle cx="70" cy="70" r="7" fill="#fff" stroke={c(70)} strokeWidth="3" />
          <circle cx="70" cy="70" r="16" fill={c(70, 0.15)} />
        </g>
      )}
    </svg>
  );
}
