import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  unit,
  icon: Icon,
  trend,
  tone = "default",
  className,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  trend?: string;
  tone?: "default" | "ok" | "warn" | "alert" | "crit" | "info" | "ai";
  className?: string;
}) {
  const toneCls = {
    default: "text-foreground",
    ok: "text-status-ok",
    info: "text-status-info",
    warn: "text-status-warn",
    alert: "text-status-alert",
    crit: "text-status-crit",
    ai: "text-status-ai",
  }[tone];

  return (
    <div className={cn("glass-card relative overflow-hidden p-4 transition-all hover:translate-y-[-2px]", className)}>
      <div className="flex items-start justify-between">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        {Icon && <Icon className={cn("h-4 w-4", toneCls)} />}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span className={cn("font-display text-2xl font-bold tabular-nums", toneCls)}>{value}</span>
        {unit && <span className="text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trend && <div className="mt-1 text-[11px] text-muted-foreground">{trend}</div>}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
    </div>
  );
}