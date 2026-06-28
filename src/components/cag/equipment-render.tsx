import { cn } from "@/lib/utils";
import type { ChillerId } from "@/data/cagTypes";

const palette: Record<ChillerId, { main: string; glow: string; accent: string }> = {
  blue: { main: "oklch(0.78 0.22 230)", glow: "oklch(0.85 0.22 220)", accent: "oklch(0.9 0.18 200)" },
  red: { main: "oklch(0.7 0.28 22)", glow: "oklch(0.78 0.26 18)", accent: "oklch(0.85 0.22 30)" },
  white: { main: "oklch(0.92 0.01 240)", glow: "oklch(0.85 0.02 240)", accent: "oklch(0.95 0.01 240)" },
};

export function EquipmentRender({
  chillerId,
  size = "md",
  highlight,
  className,
}: {
  chillerId: ChillerId;
  size?: "sm" | "md" | "lg";
  highlight?: "compressor" | "pump" | "circuit" | "none";
  className?: string;
}) {
  const p = palette[chillerId];
  const dims = size === "lg" ? { w: 520, h: 320 } : size === "sm" ? { w: 220, h: 140 } : { w: 360, h: 220 };
  const hl = highlight ?? "none";
  const hlColor = "oklch(0.78 0.22 50)";

  return (
    <div className={cn("relative", className)} style={{ width: "100%", maxWidth: dims.w }}>
      <svg viewBox="0 0 520 320" className="w-full h-auto" style={{ filter: `drop-shadow(0 0 24px ${p.glow}55)` }}>
        <defs>
          <linearGradient id={`body-${chillerId}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="oklch(0.25 0.04 260)" />
            <stop offset="50%" stopColor="oklch(0.18 0.03 260)" />
            <stop offset="100%" stopColor="oklch(0.12 0.02 260)" />
          </linearGradient>
          <linearGradient id={`accent-${chillerId}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={p.main} stopOpacity="0.2" />
            <stop offset="50%" stopColor={p.glow} stopOpacity="0.9" />
            <stop offset="100%" stopColor={p.main} stopOpacity="0.2" />
          </linearGradient>
          <radialGradient id={`pipe-${chillerId}`}>
            <stop offset="0%" stopColor={p.accent} />
            <stop offset="100%" stopColor={p.main} stopOpacity="0.3" />
          </radialGradient>
          <filter id={`glow-${chillerId}`}>
            <feGaussianBlur stdDeviation="4" />
          </filter>
        </defs>

        {/* Base / chassis */}
        <rect x="40" y="80" width="440" height="180" rx="10" fill={`url(#body-${chillerId})`} stroke={p.main} strokeOpacity="0.4" strokeWidth="1.5" />
        {/* Top crown */}
        <rect x="60" y="60" width="400" height="24" rx="4" fill="oklch(0.2 0.03 260)" stroke={p.main} strokeOpacity="0.5" />
        {/* Neon accent stripe */}
        <rect x="60" y="92" width="400" height="3" fill={`url(#accent-${chillerId})`} />
        <rect x="60" y="244" width="400" height="3" fill={`url(#accent-${chillerId})`} />

        {/* Compressors (2 per circuit) */}
        {[110, 200, 310, 400].map((x, i) => {
          const isHl = hl === "compressor" && i === 0;
          const col = isHl ? hlColor : p.main;
          return (
            <g key={x}>
              <circle cx={x} cy={170} r="34" fill="oklch(0.16 0.025 260)" stroke={col} strokeOpacity="0.7" strokeWidth="1.5" />
              <circle cx={x} cy={170} r="22" fill="none" stroke={col} strokeOpacity="0.4" />
              <circle cx={x} cy={170} r="10" fill={col} fillOpacity="0.25" />
              <circle cx={x} cy={170} r="3" fill={col} style={{ filter: `drop-shadow(0 0 6px ${col})` }} />
            </g>
          );
        })}

        {/* Pipes top */}
        <path d="M 60 120 L 460 120" stroke={`url(#pipe-${chillerId})`} strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M 60 130 L 460 130" stroke={p.main} strokeWidth="1" strokeOpacity="0.3" />

        {/* Pipes bottom */}
        <path d="M 60 230 L 460 230" stroke={`url(#pipe-${chillerId})`} strokeWidth="6" strokeLinecap="round" opacity="0.85" />
        <path d="M 60 220 L 460 220" stroke={p.main} strokeWidth="1" strokeOpacity="0.3" />

        {/* Vertical drops */}
        {[110, 200, 310, 400].map((x) => (
          <g key={`v-${x}`}>
            <line x1={x} y1="123" x2={x} y2="140" stroke={p.glow} strokeWidth="3" opacity="0.7" />
            <line x1={x} y1="200" x2={x} y2="227" stroke={p.glow} strokeWidth="3" opacity="0.7" />
          </g>
        ))}

        {/* Side panels with vents */}
        <g>
          {[100, 110, 120, 130, 140].map((y) => (
            <line key={y} x1="50" y1={y + 40} x2="68" y2={y + 40} stroke={p.main} strokeOpacity="0.5" />
          ))}
          {[100, 110, 120, 130, 140].map((y) => (
            <line key={`r-${y}`} x1="452" y1={y + 40} x2="470" y2={y + 40} stroke={p.main} strokeOpacity="0.5" />
          ))}
        </g>

        {/* HMI display */}
        <rect x="220" y="68" width="80" height="14" rx="2" fill="oklch(0.1 0.02 260)" stroke={p.main} strokeOpacity="0.6" />
        <text x="260" y="78" textAnchor="middle" fontSize="8" fill={p.glow} fontFamily="monospace">
          CAG · {chillerId.toUpperCase()}
        </text>

        {/* Bottom legs */}
        <rect x="70" y="260" width="14" height="20" fill="oklch(0.14 0.02 260)" />
        <rect x="436" y="260" width="14" height="20" fill="oklch(0.14 0.02 260)" />

        {/* Circuit labels */}
        <text x="155" y="295" textAnchor="middle" fontSize="9" fill={p.main} fillOpacity="0.7" fontFamily="monospace">CIRCUITO A</text>
        <text x="355" y="295" textAnchor="middle" fontSize="9" fill={p.main} fillOpacity="0.7" fontFamily="monospace">CIRCUITO B</text>

        {/* Scanning line effect */}
        <rect x="40" y="80" width="440" height="2" fill={p.glow} opacity="0.6">
          <animate attributeName="y" from="80" to="258" dur="4s" repeatCount="indefinite" />
        </rect>
      </svg>
    </div>
  );
}