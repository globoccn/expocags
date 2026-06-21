import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

const toneCls = {
  default: "text-foreground",
  ok: "text-status-ok",
  info: "text-status-info",
  warn: "text-status-warn",
  alert: "text-status-alert",
  crit: "text-status-crit",
  ai: "text-status-ai",
};

const spark = "M0,28 C12,22 18,30 28,24 C42,15 52,32 64,20 C78,7 88,22 100,12";

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
  const cls = toneCls[tone];
  const isPositive = trend?.includes("↑") || trend?.includes("+");
  const isNegative = trend?.includes("↓") || trend?.includes("-");
  return (
    <div className={cn("kpi-premium group relative overflow-hidden rounded-2xl border border-border/35 bg-surface-glass p-4 transition-all hover:-translate-y-0.5", className)}>
      <div className="absolute inset-x-4 bottom-2 h-10 opacity-45 transition-opacity group-hover:opacity-80">
        <svg viewBox="0 0 100 36" preserveAspectRatio="none" className="h-full w-full">
          <path d={spark} fill="none" stroke="currentColor" strokeWidth="1.6" className={cls} opacity="0.72" />
          <path d={`${spark} L100,36 L0,36 Z`} fill="currentColor" className={cls} opacity="0.08" />
        </svg>
      </div>
      <div className="relative flex items-start justify-between gap-2">
        <div className="text-[10px] font-bold uppercase tracking-[0.24em] text-muted-foreground">{label}</div>
        {Icon && <Icon className={cn("h-4 w-4", cls)} />}
      </div>
      <div className="relative mt-3 flex items-end gap-1">
        <span className={cn("font-display text-3xl font-bold leading-none tabular-nums", cls)}>{value}</span>
        {unit && <span className="mb-1 text-xs text-muted-foreground">{unit}</span>}
      </div>
      {trend && (
        <div className={cn("relative mt-2 text-[11px] font-medium", isPositive && "text-status-ok", isNegative && "text-status-crit", !isPositive && !isNegative && "text-muted-foreground")}>{trend}</div>
      )}
    </div>
  );
}
