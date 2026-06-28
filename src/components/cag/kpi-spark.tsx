import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { KpiSpark } from "@/data/cagTypes";
import { Sparkline } from "./sparkline";

const toneText: Record<string, string> = {
  ok: "text-status-ok",
  info: "text-status-info",
  warn: "text-status-warn",
  alert: "text-status-alert",
  crit: "text-status-crit",
  ai: "text-status-ai",
  default: "text-foreground",
};

export function KpiSparkCard({ kpi, icon: Icon, className }: { kpi: KpiSpark; icon?: LucideIcon; className?: string }) {
  const TrendIcon = kpi.trend === "up" ? ArrowUpRight : kpi.trend === "down" ? ArrowDownRight : Minus;
  return (
    <div className={cn("glass-card group relative overflow-hidden p-3 transition-all hover:translate-y-[-2px] hover:border-primary/40", className)}>
      <div className="flex items-start justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-[0.18em] text-muted-foreground">{kpi.label}</div>
        {Icon ? <Icon className={cn("h-3.5 w-3.5", toneText[kpi.tone])} /> : null}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className={cn("font-display text-2xl font-bold tabular-nums leading-none", toneText[kpi.tone])}>{kpi.value}</span>
        {kpi.unit ? <span className="text-[11px] text-muted-foreground">{kpi.unit}</span> : null}
      </div>
      <div className="mt-1 flex items-center gap-1 text-[10px] text-muted-foreground">
        <TrendIcon className={cn("h-3 w-3", toneText[kpi.tone])} />
        <span className="truncate">{kpi.delta}</span>
      </div>
      <div className="-mx-1 mt-1.5">
        <Sparkline data={kpi.spark} tone={kpi.tone} height={28} />
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent opacity-60" />
    </div>
  );
}