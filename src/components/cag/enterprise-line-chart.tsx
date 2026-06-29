import { useMemo } from "react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipProps,
} from "recharts";
import { cn } from "@/lib/utils";

type AxisId = "left" | "right";
type Tone = "cyan" | "pink" | "yellow" | "green" | "blue" | "red" | "violet" | "slate";

export type EnterpriseSeries = {
  key: string;
  label: string;
  unit?: string;
  axis?: AxisId;
  color?: string;
  tone?: Tone;
  dashed?: boolean;
  fill?: boolean;
  valueFormatter?: (value: number) => string;
};

type EnterpriseLineChartProps = {
  data: Array<Record<string, any>>;
  series: EnterpriseSeries[];
  xKey?: string;
  height?: number | string;
  leftDomain?: [number, number] | ["auto", "auto"];
  rightDomain?: [number, number] | ["auto", "auto"];
  leftTicks?: number[];
  rightTicks?: number[];
  leftUnit?: string;
  rightUnit?: string;
  className?: string;
  chartClassName?: string;
  showLegend?: boolean;
  showFooterStats?: boolean;
};

const toneColors: Record<Tone, string> = {
  cyan: "#22d3ee",
  pink: "#fb2d5c",
  yellow: "#facc15",
  green: "#22c55e",
  blue: "#38bdf8",
  red: "#ef4444",
  violet: "#a855f7",
  slate: "#cbd5e1",
};

function colorFor(s: EnterpriseSeries) {
  return s.color || toneColors[s.tone || "cyan"];
}

function fmt(value: any, unit?: string, formatter?: (value: number) => string) {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || Number.isNaN(n)) return "--";
  if (formatter) return formatter(n);
  const digits = unit === "%" || unit === "°C" ? 1 : 0;
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: digits })}${unit ? ` ${unit}` : ""}`;
}

function chartId() {
  return Math.random().toString(36).slice(2, 9);
}

function PremiumTooltip({ active, payload, label, series }: TooltipProps<number, string> & { series: EnterpriseSeries[] }) {
  if (!active || !payload?.length) return null;
  const seen = new Set<string>();
  const rows = payload.filter((item) => {
    const key = String(item.dataKey || item.name || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return series.some((s) => s.key === key);
  });

  return (
    <div className="min-w-[230px] rounded-2xl border border-primary/35 bg-[#07101c]/95 px-4 py-3 text-xs shadow-[0_24px_80px_rgba(0,0,0,0.55),0_0_34px_rgba(34,211,238,0.16)] backdrop-blur-xl">
      <div className="mb-2 font-display text-sm font-bold text-primary">{String(label ?? "")}</div>
      <div className="space-y-2">
        {rows.map((item) => {
          const config = series.find((s) => s.key === item.dataKey);
          if (!config) return null;
          const color = colorFor(config);
          return (
            <div key={config.key} className="flex items-center justify-between gap-5">
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_12px_currentColor]" style={{ color, backgroundColor: color }} />
                <span className="truncate text-muted-foreground">{config.label}</span>
              </div>
              <span className="font-mono font-bold tabular-nums" style={{ color }}>
                {fmt(item.value, config.unit, config.valueFormatter)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SummaryStats({ data, series }: { data: Array<Record<string, any>>; series: EnterpriseSeries[] }) {
  return (
    <div className="mt-4 grid gap-3 border-t border-white/8 pt-4 md:grid-cols-2 xl:grid-cols-4">
      {series.slice(0, 4).map((s) => {
        const values = data.map((row) => Number(row[s.key])).filter((v) => Number.isFinite(v));
        const avg = values.length ? values.reduce((acc, v) => acc + v, 0) / values.length : null;
        const color = colorFor(s);
        return (
          <div key={s.key} className="flex items-center gap-3 rounded-2xl border border-white/8 bg-white/[0.025] px-3 py-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border bg-black/20" style={{ borderColor: `${color}55`, color, boxShadow: `0 0 24px ${color}25` }}>
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
            </span>
            <div className="min-w-0">
              <div className="truncate text-xs font-semibold text-foreground/90">{s.label}</div>
              <div className="mt-0.5 text-[11px] text-muted-foreground">Média: {avg === null ? "--" : fmt(avg, s.unit, s.valueFormatter)}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function EnterpriseLineChart({
  data,
  series,
  xKey = "x",
  height = 360,
  leftDomain = [0, 100],
  rightDomain = [0, 45],
  leftTicks,
  rightTicks,
  leftUnit = "%",
  rightUnit = "°C",
  className,
  chartClassName,
  showLegend = true,
  showFooterStats = false,
}: EnterpriseLineChartProps) {
  const uid = useMemo(chartId, []);
  const safeData = Array.isArray(data) ? data : [];
  const hasRight = series.some((s) => (s.axis || "left") === "right");

  return (
    <div className={cn("relative overflow-hidden rounded-2xl border border-primary/10 bg-[#07111e]/35", className)}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(34,211,238,0.13),transparent_45%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_34%)]" />
      <div className="pointer-events-none absolute inset-x-8 top-10 h-24 rounded-full bg-primary/5 blur-3xl" />
      {showLegend && (
        <div className="relative z-10 flex flex-wrap gap-2 px-4 pt-4">
          {series.map((s) => {
            const color = colorFor(s);
            return (
              <span key={s.key} className="inline-flex items-center gap-2 rounded-full border bg-black/20 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.1em]" style={{ color, borderColor: `${color}55`, boxShadow: `inset 0 0 18px ${color}10` }}>
                <span className={cn("h-0.5 w-4 rounded-full", s.dashed && "border-t border-dashed bg-transparent")} style={{ backgroundColor: s.dashed ? "transparent" : color, borderColor: color }} />
                {s.label}
              </span>
            );
          })}
        </div>
      )}
      <div className={cn("relative z-10 px-4 pb-3", showLegend ? "pt-3" : "pt-4", chartClassName)} style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={safeData} margin={{ top: 18, right: hasRight ? 36 : 16, left: 4, bottom: 12 }}>
            <defs>
              {series.map((s) => {
                const color = colorFor(s);
                return (
                  <linearGradient key={s.key} id={`${uid}-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.24} />
                    <stop offset="55%" stopColor={color} stopOpacity={0.08} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid stroke="rgba(148,163,184,0.10)" strokeDasharray="3 8" vertical={false} />
            <XAxis dataKey={xKey} tick={{ fill: "rgba(203,213,225,0.72)", fontSize: 11 }} axisLine={false} tickLine={false} dy={8} />
            <YAxis yAxisId="left" domain={leftDomain as any} ticks={leftTicks} tick={{ fill: "rgba(203,213,225,0.72)", fontSize: 11 }} axisLine={false} tickLine={false} width={38} tickFormatter={(v) => `${v}${leftUnit}`} />
            {hasRight && <YAxis yAxisId="right" orientation="right" domain={rightDomain as any} ticks={rightTicks} tick={{ fill: "rgba(203,213,225,0.72)", fontSize: 11 }} axisLine={false} tickLine={false} width={42} tickFormatter={(v) => `${v}${rightUnit}`} />}
            <Tooltip cursor={{ stroke: "rgba(34,211,238,0.45)", strokeDasharray: "3 5", strokeWidth: 1 }} content={<PremiumTooltip series={series} />} />
            {series.map((s) => {
              const color = colorFor(s);
              const axis = s.axis || "left";
              return s.fill || !s.dashed ? (
                <Area key={`${s.key}-area`} yAxisId={axis} type="monotone" dataKey={s.key} fill={`url(#${uid}-${s.key})`} stroke="none" isAnimationActive={false} legendType="none" activeDot={false} />
              ) : null;
            })}
            {series.map((s) => {
              const color = colorFor(s);
              const axis = s.axis || "left";
              return <Line key={`${s.key}-glow`} yAxisId={axis} type="monotone" dataKey={s.key} stroke={color} strokeWidth={8} strokeOpacity={s.dashed ? 0.08 : 0.12} strokeDasharray={s.dashed ? "5 6" : undefined} dot={false} activeDot={false} legendType="none" isAnimationActive={false} />;
            })}
            {series.map((s) => {
              const color = colorFor(s);
              const axis = s.axis || "left";
              return <Line key={s.key} yAxisId={axis} type="monotone" dataKey={s.key} name={s.label} stroke={color} strokeWidth={s.dashed ? 2.2 : 2.8} strokeDasharray={s.dashed ? "5 6" : undefined} dot={false} activeDot={{ r: 6, strokeWidth: 2, stroke: "#07111e", fill: color }} isAnimationActive animationDuration={700} />;
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {showFooterStats && <SummaryStats data={safeData} series={series} />}
    </div>
  );
}
