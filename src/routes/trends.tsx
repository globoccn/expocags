import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Activity, Download, Droplets, Gauge, Snowflake } from "lucide-react";
import { apiIdToUi, asNum, getTrendGroups, useDashboard } from "@/lib/dashboard-api";
import { chartColors, tooltipStyle } from "@/components/cag/chart-wrap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Tendências — CAG Expo Center Norte" }] }),
  component: TrendsPage,
});

type ContextKey = "water" | "capacity" | "pressure" | "pumps";
type GroupKey = "all" | "blue" | "red" | "white";

const groups: Array<{ key: GroupKey; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "blue", label: "Azul" },
  { key: "red", label: "Vermelho" },
  { key: "white", label: "Branco" },
];

const contextConfig: Record<ContextKey, { apiKey: string; label: string; subtitle: string; icon: typeof Droplets; title: string; unit: string; yDomain: [number, number]; yTicks: number[]; accent: string; lines: Array<{ key: string; label: string; color: string; dashed?: boolean }> }> = {
  water: {
    apiKey: "agua_gelada",
    label: "Água Gelada",
    subtitle: "Temperaturas e Delta T",
    icon: Droplets,
    title: "Água Gelada — Temperaturas e Delta T",
    unit: "°C",
    yDomain: [0, 45],
    yTicks: [0, 10, 20, 30, 40],
    accent: "text-violet-300",
    lines: [
      { key: "entrada", label: "Entrada (°C)", color: "#38bdf8" },
      { key: "saida", label: "Saída (°C)", color: "#22d3ee" },
      { key: "setpoint", label: "Setpoint (°C)", color: "#a855f7", dashed: true },
      { key: "delta_t", label: "Delta T (°C)", color: "#fb2d5c" },
      { key: "externa", label: "Temp. externa (°C)", color: "#facc15" },
    ],
  },
  capacity: {
    apiKey: "capacidade",
    label: "Capacidade",
    subtitle: "Circuitos e refrigeração",
    icon: Snowflake,
    title: "Capacidade — Circuitos A/B e total",
    unit: "%",
    yDomain: [0, 100],
    yTicks: [0, 25, 50, 75, 100],
    accent: "text-cyan-300",
    lines: [
      { key: "total", label: "Capacidade total (%)", color: "#38bdf8" },
      { key: "circuito_a", label: "Circuito A (%)", color: "#22c55e" },
      { key: "circuito_b", label: "Circuito B (%)", color: "#fb2d5c" },
    ],
  },
  pressure: {
    apiKey: "pressoes",
    label: "Pressões",
    subtitle: "Sucção e descarga",
    icon: Gauge,
    title: "Pressões — Sucção e descarga",
    unit: "psi",
    yDomain: [0, 1000],
    yTicks: [0, 250, 500, 750, 1000],
    accent: "text-slate-200",
    lines: [
      { key: "succao_a", label: "Sucção A (psi)", color: "#22c55e" },
      { key: "succao_b", label: "Sucção B (psi)", color: "#84cc16" },
      { key: "descarga_a", label: "Descarga A (psi)", color: "#fb7185" },
      { key: "descarga_b", label: "Descarga B (psi)", color: "#f97316" },
    ],
  },
  pumps: {
    apiKey: "bombas",
    label: "Bombas",
    subtitle: "Pressão, bypass e operação",
    icon: Activity,
    title: "Bombas — Pressão da linha e bypass",
    unit: "bar / %",
    yDomain: [0, 100],
    yTicks: [0, 25, 50, 75, 100],
    accent: "text-yellow-300",
    lines: [
      { key: "linha", label: "Pressão linha (bar)", color: "#fb2d5c" },
      { key: "setpoint", label: "Setpoint pressão (bar)", color: "#e5e7eb", dashed: true },
      { key: "abertura", label: "Bypass (%)", color: "#facc15" },
      { key: "bag1", label: "BAG1", color: "#22c55e" },
      { key: "bag2", label: "BAG2", color: "#38bdf8" },
      { key: "bag3", label: "BAG3", color: "#a855f7" },
      { key: "bag4", label: "BAG4", color: "#fb7185" },
    ],
  },
};

function fmt(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function normalizeSeries(group: any, context: ContextKey) {
  if (context !== "pumps") return Array.isArray(group.series) ? group.series : [];
  const pressao = Array.isArray(group.series?.pressao) ? group.series.pressao : [];
  const bypass = Array.isArray(group.series?.bypass) ? group.series.bypass : [];
  const bombas = Array.isArray(group.series?.bombas) ? group.series.bombas : [];
  const max = Math.max(pressao.length, bypass.length, bombas.length);
  return Array.from({ length: max }, (_, index) => ({
    x: pressao[index]?.x || bypass[index]?.x || bombas[index]?.x || "--",
    timestamp: pressao[index]?.timestamp || bypass[index]?.timestamp || bombas[index]?.timestamp,
    linha: asNum(pressao[index]?.linha),
    setpoint: asNum(pressao[index]?.setpoint),
    abertura: asNum(bypass[index]?.abertura),
    bag1: asNum(bombas[index]?.bag1),
    bag2: asNum(bombas[index]?.bag2),
    bag3: asNum(bombas[index]?.bag3),
    bag4: asNum(bombas[index]?.bag4),
  }));
}

function buildRows(payload: any, context: ContextKey, group: GroupKey) {
  const cfg = contextConfig[context];
  const selected = getTrendGroups(payload, cfg.apiKey).filter((g: any) => group === "all" || apiIdToUi[g.id] === group);
  const seriesLists = selected.map((g: any) => normalizeSeries(g, context));
  const max = Math.max(0, ...seriesLists.map((s: any[]) => s.length));
  return Array.from({ length: max }, (_, index) => {
    const rows = seriesLists.map((list: any[]) => list[index] || {});
    const out: Record<string, any> = { t: rows.find((r) => r.x || r.date || r.timestamp)?.x || rows.find((r) => r.date)?.date || "--" };
    for (const line of cfg.lines) {
      const vals = rows.map((r) => asNum(r[line.key])).filter((v): v is number => v !== null);
      out[line.key] = vals.length ? Number((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : null;
    }
    return out;
  });
}

function TrendsPage() {
  const [context, setContext] = useState<ContextKey>("water");
  const [group, setGroup] = useState<GroupKey>("all");
  const { period, payload } = useDashboard();
  const activeContext = contextConfig[context];
  const data = useMemo(() => buildRows(payload, context, group), [payload, context, group]);
  const periodLabel = period === "d1" ? "24 horas" : period === "week" ? "7 dias" : "30 dias";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Activity className="h-5 w-5" />
            <h1 className="font-display text-3xl font-bold text-foreground">Tendências Operacionais</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Evolução dos indicadores consolidados do período selecionado.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-violet-400/45 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 shadow-[0_0_22px_rgba(168,85,247,0.12)] transition hover:bg-violet-500/15">
          <Download className="h-4 w-4" /> Exportar dados
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(contextConfig) as ContextKey[]).map((key) => {
          const item = contextConfig[key];
          const Icon = item.icon;
          const active = key === context;
          return (
            <button key={key} type="button" onClick={() => setContext(key)} className={cn("group glass-card flex items-center gap-4 p-4 text-left transition-all hover:text-white", active && "border-violet-400/65 bg-violet-500/18 shadow-[0_0_28px_rgba(168,85,247,0.18)]")}>
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl bg-white/5", active ? item.accent : "text-muted-foreground group-hover:text-foreground")}><Icon className="h-5 w-5" /></div>
              <div><div className="font-display text-sm font-semibold group-hover:text-white">{item.label}</div><div className="mt-0.5 text-[11px] text-muted-foreground group-hover:text-white/80">{item.subtitle}</div></div>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="text-xs text-muted-foreground">Grupo</div>
        <div className="mt-2 grid max-w-[520px] grid-cols-4 gap-2">
          {groups.map((g) => (
            <button key={g.key} type="button" onClick={() => setGroup(g.key)} className={cn("rounded-lg border border-border/60 bg-background/35 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white", group === g.key && "border-violet-400/50 bg-violet-500/20 text-violet-100")}>{g.label}</button>
          ))}
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em]">{activeContext.title}</h2>
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
              {activeContext.lines.map((line) => <span key={line.key} className="inline-flex items-center gap-2"><span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: line.color }} />{line.label}</span>)}
            </div>
          </div>
          <div className="rounded-lg border border-border/60 px-3 py-1.5 text-[11px] text-muted-foreground">Intervalo: {periodLabel}</div>
        </div>
        <div className="h-[520px] w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 24, left: -8, bottom: 5 }}>
              <CartesianGrid stroke={chartColors.grid} strokeOpacity={0.55} vertical />
              <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={activeContext.yDomain} ticks={activeContext.yTicks} stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: any) => [value === null || value === undefined ? "--" : `${fmt(Number(value), activeContext.unit === "psi" ? 0 : 1)} ${activeContext.unit}`, name]} />
              {activeContext.lines.map((line) => (
                <Line key={line.key} type="monotone" dataKey={line.key} name={line.label} stroke={line.color} strokeWidth={2} strokeDasharray={line.dashed ? "5 5" : undefined} dot={false} activeDot={{ r: 4 }} />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
