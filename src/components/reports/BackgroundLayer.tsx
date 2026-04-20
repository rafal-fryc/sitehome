import type { BgStyle } from "@/types/reports";
import { BG_PALETTES, TOPIC_ANCHORS, VBH, VBW } from "./tokens";
import { rand } from "./layoutEngine";

interface Props {
  bgStyle: BgStyle;
}

const X = -VBW * 2;
const Y = -VBH * 2;
const W = VBW * 5;
const H = VBH * 5;

export function BackgroundLayer({ bgStyle }: Props) {
  const P = BG_PALETTES[bgStyle];

  if (bgStyle === "parchment") {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id="bg-parch-vig" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#f5ecd4" />
            <stop offset="70%" stopColor="#efe4cc" />
            <stop offset="100%" stopColor="#d7c59a" />
          </radialGradient>
          <pattern id="bg-parch-fibers" x="0" y="0" width="160" height="160" patternUnits="userSpaceOnUse">
            {Array.from({ length: 90 }, (_, i) => {
              const r = rand(500 + i);
              return (
                <circle
                  key={i}
                  cx={r() * 160}
                  cy={r() * 160}
                  r={0.3 + r() * 0.5}
                  fill="#8a7346"
                  opacity={0.1 + r() * 0.1}
                />
              );
            })}
          </pattern>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-parch-vig)" />
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-parch-fibers)" opacity={0.55} />
        {[
          { cx: 180, cy: 90, rx: 40, ry: 28, o: 0.1 },
          { cx: 880, cy: 460, rx: 60, ry: 42, o: 0.09 },
          { cx: 520, cy: 520, rx: 28, ry: 20, o: 0.08 },
        ].map((s, i) => (
          <ellipse key={i} cx={s.cx} cy={s.cy} rx={s.rx} ry={s.ry} fill="#9a7a3b" opacity={s.o} />
        ))}
      </g>
    );
  }

  if (bgStyle === "ledger") {
    return (
      <g pointerEvents="none">
        <rect x={X} y={Y} width={W} height={H} fill="#f6efd9" />
        <defs>
          <pattern id="bg-ledger-rules" x="0" y="0" width="400" height="24" patternUnits="userSpaceOnUse">
            <line x1="0" y1="23.5" x2="400" y2="23.5" stroke="#8aa6c4" strokeWidth="0.5" opacity="0.55" />
          </pattern>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-ledger-rules)" />
        <line x1={50} y1={Y} x2={50} y2={Y + H} stroke="#b4292f" strokeWidth="0.7" opacity="0.45" />
        <line x1={58} y1={Y} x2={58} y2={Y + H} stroke="#b4292f" strokeWidth="0.7" opacity="0.45" />
      </g>
    );
  }

  if (bgStyle === "blueprint") {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id="bg-blue-vig" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#124268" />
            <stop offset="60%" stopColor="#0f3555" />
            <stop offset="100%" stopColor="#0a2740" />
          </radialGradient>
          <pattern id="bg-blue-grid-minor" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#8ec0e6" strokeWidth="0.3" opacity="0.22" />
          </pattern>
          <pattern id="bg-blue-grid-major" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
            <path d="M 100 0 L 0 0 0 100" fill="none" stroke="#a8d2f2" strokeWidth="0.6" opacity="0.35" />
          </pattern>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-blue-vig)" />
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-blue-grid-minor)" />
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-blue-grid-major)" />
      </g>
    );
  }

  if (bgStyle === "map") {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id="bg-map-vig" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#f4ead0" />
            <stop offset="65%" stopColor="#ead9b4" />
            <stop offset="100%" stopColor="#cbb684" />
          </radialGradient>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-map-vig)" />
        {Object.values(TOPIC_ANCHORS).flatMap((a, ti) =>
          [1, 2, 3, 4, 5].map((k) => (
            <circle
              key={`c-${ti}-${k}`}
              cx={a.cx}
              cy={a.cy}
              r={a.lobeR + 18 + k * 24}
              fill="none"
              stroke="#8c6a2d"
              strokeWidth={0.5}
              opacity={0.22 - k * 0.025}
            />
          ))
        )}
      </g>
    );
  }

  if (bgStyle === "dossier") {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id="bg-doss-vig" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="#edd9a8" />
            <stop offset="70%" stopColor="#e7d2a0" />
            <stop offset="100%" stopColor="#c6ac78" />
          </radialGradient>
          <pattern id="bg-doss-grid" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
            <path d="M 32 0 L 0 0 0 32" fill="none" stroke="#6b4e2a" strokeWidth="0.25" strokeDasharray="2 3" opacity="0.25" />
          </pattern>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-doss-vig)" />
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-doss-grid)" />
        <g transform="translate(500 300) rotate(-14)" opacity="0.12" style={{ userSelect: "none" }}>
          <rect x={-240} y={-40} width={480} height={80} fill="none" stroke="#7a1e12" strokeWidth="2" />
          <text
            x="0"
            y="14"
            textAnchor="middle"
            fontFamily="EB Garamond, serif"
            fontSize="44"
            fontWeight="700"
            fill="#7a1e12"
            letterSpacing="14"
          >
            CONFIDENTIAL
          </text>
        </g>
      </g>
    );
  }

  if (bgStyle === "marble") {
    return (
      <g pointerEvents="none">
        <defs>
          <radialGradient id="bg-marble-vig" cx="50%" cy="50%" r="75%">
            <stop offset="0%" stopColor="#f1eee6" />
            <stop offset="70%" stopColor="#eae7df" />
            <stop offset="100%" stopColor="#c9c5bc" />
          </radialGradient>
        </defs>
        <rect x={X} y={Y} width={W} height={H} fill="url(#bg-marble-vig)" />
        {Array.from({ length: 14 }, (_, i) => {
          const r = rand(900 + i);
          const x1 = X + r() * W;
          const y1 = Y + r() * H;
          const x2 = x1 + 400 * (r() - 0.5);
          const y2 = y1 + 400 * (r() - 0.5);
          const mx = (x1 + x2) / 2 + 80 * (r() - 0.5);
          const my = (y1 + y2) / 2 + 80 * (r() - 0.5);
          return (
            <path
              key={i}
              d={`M ${x1} ${y1} Q ${mx} ${my} ${x2} ${y2}`}
              fill="none"
              stroke="#7a7269"
              strokeWidth={0.4 + r() * 0.5}
              opacity={0.12 + r() * 0.08}
            />
          );
        })}
      </g>
    );
  }

  return <rect x={X} y={Y} width={W} height={H} fill={P.paper} />;
}
