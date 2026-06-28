import { cn } from "@/lib/utils";
import { healthFactors } from "@/data/cagTypes";

function classify(score: number) {
  if (score >= 90) return { label: "Excelente", color: "var(--status-ok)" };
  if (score >= 75) return { label: "Bom", color: "var(--status-info)" };
  if (score >= 60) return { label: "Atenção", color: "var(--status-warn)" };
  return { label: "Crítico", color: "var(--status-crit)" };
}

export function HealthRing({ score, size = 96, label = "Health Score" }: { score: number; size?: number; label?: string }) {
  const { label: cls, color } = classify(score);
  const r = size / 2 - 8;
  const c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="flex items-center gap-3">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${dash} ${c}`}
            style={{ filter: `drop-shadow(0 0 6px ${color})` }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-display text-2xl font-bold tabular-nums" style={{ color }}>
            {Math.round(score)}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">/ 100</span>
        </div>
      </div>
      <div className="flex flex-col">
        <span className="text-xs uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-display text-lg font-semibold" style={{ color }}>
          {cls}
        </span>
      </div>
    </div>
  );
}

export function HealthFactors({ className }: { className?: string }) {
  return (
    <div className={cn("space-y-2", className)}>
      {healthFactors.map((f) => (
        <div key={f.label} className="flex items-center justify-between rounded-md border border-border/50 bg-surface-2/40 px-3 py-1.5 text-xs">
          <span className="text-muted-foreground">{f.label}</span>
          <span className="font-mono font-semibold text-status-alert">{f.points} pts</span>
        </div>
      ))}
    </div>
  );
}