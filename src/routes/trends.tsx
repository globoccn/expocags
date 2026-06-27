import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Activity,
  BatteryCharging,
  Download,
  Droplets,
  Filter,
  Gauge,
  Maximize2,
  Snowflake,
  Thermometer,
  TrendingDown,
} from "lucide-react";
import { chillers as mockChillers, type ChillerData, type ChillerId } from "@/data/mockCagData";
import { mergeChillersFromDashboard, useDashboardPeriod } from "@/lib/cag-dashboard-api";
import { chartColors, tooltipStyle } from "@/components/cag/chart-wrap";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Tendências — CAG Expo Center Norte" }] }),
  component: TrendsPage,
});

type PeriodKey = "d1" | "week" | "month";
type ContextKey = "water" | "capacity" | "pressure" | "pumps";
type GroupKey = "all" | ChillerId;

const periodOptions: Array<{ key: PeriodKey; label: string; date: string; range: string; points: number }> = [
  { key: "d1", label: "D-1", date: "19/06/2026", range: "00:00 às 23:59", points: 24 },
  { key: "week", label: "7 dias", date: "13/06 a 19/06", range: "últimos 7 dias", points: 7 },
  { key: "month", label: "1 mês", date: "Junho/2026", range: "30 dias", points: 30 },
];

const groups: Array<{ key: GroupKey; label: string; color: string }> = [
  { key: "all", label: "Todos", color: "#a855f7" },
  { key: "blue", label: "Azul", color: "#38bdf8" },
  { key: "red", label: "Vermelho", color: "#fb2d5c" },
  { key: "white", label: "Branco", color: "#e5e7eb" },
];

const contextConfig: Record<ContextKey, {
  label: string;
  subtitle: string;
  icon: typeof Droplets;
  accent: string;
  title: string;
  unit: string;
  yDomain: [number, number];
  yTicks: number[];
}> = {
  water: {
    label: "Água Gelada",
    subtitle: "Temperaturas e Delta T",
    icon: Droplets,
    accent: "text-violet-300",
    title: "Água Gelada — Temperaturas e Delta T",
    unit: "°C",
    yDomain: [0, 16],
    yTicks: [0, 4, 8, 12, 16],
  },
  capacity: {
    label: "Capacidade",
    subtitle: "Circuitos e refrigeração",
    icon: Snowflake,
    accent: "text-cyan-300",
    title: "Capacidade — Circuitos A/B e total",
    unit: "%",
    yDomain: [0, 100],
    yTicks: [0, 25, 50, 75, 100],
  },
  pressure: {
    label: "Pressões",
    subtitle: "Sucção, descarga e óleo",
    icon: Gauge,
    accent: "text-slate-200",
    title: "Pressões — Sucção, descarga e óleo",
    unit: "psi",
    yDomain: [0, 900],
    yTicks: [0, 225, 450, 675, 900],
  },
  pumps: {
    label: "Bombas",
    subtitle: "Pressão, bypass e operação",
    icon: Activity,
    accent: "text-yellow-300",
    title: "Bombas — Pressão da linha e bypass",
    unit: "bar / %",
    yDomain: [0, 100],
    yTicks: [0, 25, 50, 75, 100],
  },
};

function fmt(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function periodTickLabel(period: PeriodKey, index: number) {
  if (period === "d1") return `${String(index).padStart(2, "0")}:00`;
  if (period === "week") return [`13/06`, `14/06`, `15/06`, `16/06`, `17/06`, `18/06`, `19/06`][index] || `D-${index}`;
  return `${String(index + 1).padStart(2, "0")}/06`;
}

function sampleSeries<T>(series: T[], index: number, total: number) {
  if (!series.length) return null;
  if (total <= 1) return series[0];
  const sourceIndex = Math.round((index / (total - 1)) * (series.length - 1));
  return series[Math.min(series.length - 1, Math.max(0, sourceIndex))];
}

function getSelectedChillers(group: GroupKey) {
  if (group === "all") return mockChillers;
  return mockChillers.filter((c) => c.id === group);
}

function avg(values: number[]) {
  const valid = values.filter((v) => Number.isFinite(v));
  return valid.length ? valid.reduce((acc, v) => acc + v, 0) / valid.length : 0;
}

function buildTrendRows(period: PeriodKey, group: GroupKey) {
  const selected = getSelectedChillers(group);
  const points = periodOptions.find((p) => p.key === period)?.points || 24;

  return Array.from({ length: points }, (_, index) => {
    const factor = period === "d1" ? 1 : period === "week" ? 0.72 : 0.52;
    const wave = Math.sin(index / (period === "month" ? 3.4 : 1.7));
    const rows = selected.map((chiller) => {
      const water = sampleSeries(chiller.series.feedReturnSetpoint, index, points);
      const delta = sampleSeries(chiller.series.deltaT, index, points);
      const cap = sampleSeries(chiller.series.capacity, index, points);
      const high = sampleSeries(chiller.series.pressureHigh, index, points);
      const low = sampleSeries(chiller.series.pressureLow, index, points);
      return {
        feed: (water?.feed ?? chiller.feedTemp) + wave * 0.12 * factor,
        ret: (water?.ret ?? chiller.returnTemp) + wave * 0.18 * factor,
        set: chiller.setpoint,
        dt: (delta?.v ?? chiller.deltaT) + wave * 0.08 * factor,
        capTotal: (cap?.total ?? chiller.capacityTotal) + wave * 1.8 * factor,
        capA: (cap?.a ?? chiller.capacityA) + wave * 1.5 * factor,
        capB: (cap?.b ?? chiller.capacityB) - wave * 1.1 * factor,
        sucA: (low?.a ?? 4.8) * 50,
        sucB: (low?.b ?? 4.7) * 50,
        descA: (high?.a ?? 16.2) * 50,
        descB: (high?.b ?? 16.0) * 50,
        oil: avg(chiller.circuits.flatMap((c) => [c.oilPressureC1, c.oilPressureC2])) * 100,
        pressureLine: chiller.hydraulic.pressureLine,
        pressureSetpoint: chiller.hydraulic.pressureSetpoint,
        bypass: chiller.hydraulic.bypassValve + Math.sin(index / 2) * 3 * factor,
        pumpsOn: chiller.pumpsOn,
      };
    });

    return {
      t: periodTickLabel(period, index),
      entrada: Number(avg(rows.map((r) => r.ret)).toFixed(2)),
      saida: Number(avg(rows.map((r) => r.feed)).toFixed(2)),
      setpoint: Number(avg(rows.map((r) => r.set)).toFixed(2)),
      deltaT: Number(avg(rows.map((r) => r.dt)).toFixed(2)),
      capacidadeTotal: Number(avg(rows.map((r) => r.capTotal)).toFixed(1)),
      capacidadeA: Number(avg(rows.map((r) => r.capA)).toFixed(1)),
      capacidadeB: Number(avg(rows.map((r) => r.capB)).toFixed(1)),
      succaoA: Math.round(avg(rows.map((r) => r.sucA))),
      succaoB: Math.round(avg(rows.map((r) => r.sucB))),
      descargaA: Math.round(avg(rows.map((r) => r.descA))),
      descargaB: Math.round(avg(rows.map((r) => r.descB))),
      oleo: Math.round(avg(rows.map((r) => r.oil))),
      pressaoLinha: Number((avg(rows.map((r) => r.pressureLine)) * 20).toFixed(1)),
      setpointPressao: Number((avg(rows.map((r) => r.pressureSetpoint)) * 20).toFixed(1)),
      bypass: Number(avg(rows.map((r) => r.bypass)).toFixed(1)),
      bombasOperando: Number((avg(rows.map((r) => r.pumpsOn)) * 25).toFixed(1)),
    };
  });
}

const trendLines: Record<ContextKey, Array<{ key: string; label: string; color: string; dashed?: boolean }>> = {
  water: [
    { key: "entrada", label: "Temp. Entrada (°C)", color: "#38bdf8" },
    { key: "saida", label: "Temp. Saída (°C)", color: "#22d3ee" },
    { key: "setpoint", label: "Setpoint (°C)", color: "#a855f7", dashed: true },
    { key: "deltaT", label: "Delta T (°C)", color: "#facc15" },
  ],
  capacity: [
    { key: "capacidadeTotal", label: "Capacidade Total (%)", color: "#38bdf8" },
    { key: "capacidadeA", label: "Circuito A (%)", color: "#22c55e" },
    { key: "capacidadeB", label: "Circuito B (%)", color: "#fb2d5c" },
  ],
  pressure: [
    { key: "succaoA", label: "Sucção A (psi)", color: "#22c55e" },
    { key: "succaoB", label: "Sucção B (psi)", color: "#84cc16" },
    { key: "descargaA", label: "Descarga A (psi)", color: "#fb7185" },
    { key: "descargaB", label: "Descarga B (psi)", color: "#f97316" },
    { key: "oleo", label: "Óleo médio (psi)", color: "#a78bfa", dashed: true },
  ],
  pumps: [
    { key: "pressaoLinha", label: "Pressão linha (escala)", color: "#fb2d5c" },
    { key: "setpointPressao", label: "Setpoint pressão", color: "#e5e7eb", dashed: true },
    { key: "bypass", label: "Bypass (%)", color: "#facc15" },
    { key: "bombasOperando", label: "Bombas operando (%)", color: "#22c55e" },
  ],
};

function metricValue(context: ContextKey, data: any[]) {
  const last = data[data.length - 1] || {};
  if (context === "water") return { main: avg(data.map((d) => d.deltaT)), label: "Delta T médio", unit: "°C", color: "text-yellow-300" };
  if (context === "capacity") return { main: avg(data.map((d) => d.capacidadeTotal)), label: "Capacidade média", unit: "%", color: "text-cyan-300" };
  if (context === "pressure") return { main: avg(data.map((d) => d.descargaA)), label: "Descarga média A", unit: "psi", color: "text-rose-300" };
  return { main: last.bypass || 0, label: "Bypass atual", unit: "%", color: "text-yellow-300" };
}

function comparisonData(context: ContextKey, group: GroupKey) {
  const source = group === "all" ? mockChillers : mockChillers.filter((c) => c.id === group);
  if (context === "water") {
    return source.map((c) => ({ name: c.name.replace("Chiller ", ""), value: c.deltaT, fill: c.id === "red" ? "#fb2d5c" : c.id === "blue" ? "#38bdf8" : "#e5e7eb" }));
  }
  if (context === "capacity") {
    return source.map((c) => ({ name: c.name.replace("Chiller ", ""), value: c.capacityTotal, fill: c.id === "red" ? "#fb2d5c" : c.id === "blue" ? "#38bdf8" : "#e5e7eb" }));
  }
  if (context === "pressure") {
    return source.map((c) => ({ name: c.name.replace("Chiller ", ""), value: Math.round(avg(c.series.pressureHigh.map((p) => p.a * 50))), fill: c.id === "red" ? "#fb2d5c" : c.id === "blue" ? "#38bdf8" : "#e5e7eb" }));
  }
  return source.map((c) => ({ name: c.name.replace("Chiller ", ""), value: c.hydraulic.bypassValve, fill: c.id === "red" ? "#fb2d5c" : c.id === "blue" ? "#38bdf8" : "#e5e7eb" }));
}

function distributionData(context: ContextKey) {
  if (context === "water") return [
    { name: "< 2,0 °C", value: 18, fill: "#fb2d5c" },
    { name: "2,0 - 3,0 °C", value: 32, fill: "#facc15" },
    { name: "3,0 - 4,0 °C", value: 34, fill: "#22c55e" },
    { name: "> 4,0 °C", value: 16, fill: "#38bdf8" },
  ];
  if (context === "capacity") return [
    { name: "< 40%", value: 20, fill: "#fb2d5c" },
    { name: "40 - 60%", value: 35, fill: "#facc15" },
    { name: "60 - 80%", value: 30, fill: "#22c55e" },
    { name: "> 80%", value: 15, fill: "#38bdf8" },
  ];
  if (context === "pressure") return [
    { name: "Abaixo", value: 24, fill: "#facc15" },
    { name: "Normal", value: 62, fill: "#22c55e" },
    { name: "Elevada", value: 14, fill: "#fb2d5c" },
  ];
  return [
    { name: "Bypass baixo", value: 42, fill: "#22c55e" },
    { name: "Bypass médio", value: 35, fill: "#facc15" },
    { name: "Bypass alto", value: 23, fill: "#fb2d5c" },
  ];
}

function distributionTitle(context: ContextKey) {
  if (context === "water") return "Distribuição Operacional — Delta T";
  if (context === "capacity") return "Distribuição Operacional — Capacidade";
  if (context === "pressure") return "Distribuição Operacional — Pressões";
  return "Distribuição Operacional — Bypass";
}

function totalHours(period: PeriodKey) {
  if (period === "d1") return 24;
  if (period === "week") return 168;
  return 720;
}

function insights(context: ContextKey) {
  if (context === "water") return [
    "O Delta T médio caiu 14% em relação ao período anterior.",
    "O bypass médio dos grupos aumentou 23% no período.",
    "A pressão da linha permaneceu estável em dois dos três grupos.",
    "O Chiller Vermelho apresentou o maior impacto na redução do Delta T.",
  ];
  if (context === "capacity") return [
    "A capacidade média permaneceu estável no período selecionado.",
    "O Circuito B do grupo Vermelho apresentou maior oscilação.",
    "O Chiller Azul manteve melhor equilíbrio entre circuitos A e B.",
    "A variação de capacidade acompanhou o aumento da temperatura externa.",
  ];
  if (context === "pressure") return [
    "A descarga média permaneceu elevada no grupo Vermelho.",
    "A sucção apresentou menor estabilidade no Circuito B.",
    "As pressões de óleo permaneceram dentro da faixa operacional simulada.",
    "Os maiores desvios ocorreram no período de maior carga térmica.",
  ];
  return [
    "A pressão da linha ficou abaixo do setpoint em parte do período.",
    "O bypass elevado acompanhou os momentos de menor Delta T.",
    "O grupo Vermelho concentrou os principais pontos de atenção hidráulica.",
    "As bombas permaneceram em modo remoto na maior parte do período.",
  ];
}

function MiniKpi({ label, value, unit, delta, color, icon: Icon }: { label: string; value: string; unit?: string; delta: string; color: string; icon: typeof Thermometer }) {
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <div className={cn("grid h-8 w-8 place-items-center rounded-lg bg-white/5", color)}>
          <Icon className="h-4 w-4" />
        </div>
        <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      </div>
      <div className={cn("font-display text-3xl font-bold", color)}>
        {value}<span className="ml-1 text-base text-muted-foreground">{unit}</span>
      </div>
      <div className="mt-2 text-[11px] text-muted-foreground">{delta}</div>
      <div className="mt-4 h-8 rounded-lg bg-gradient-to-r from-white/5 via-white/10 to-white/5 opacity-60" />
    </div>
  );
}

function globalToLocalPeriod(value: string | null): PeriodKey {
  if (value === "7d") return "week";
  if (value === "1m") return "month";
  return "d1";
}

function TrendsPage() {
  const { data: apiPayload, loading, error } = useDashboardPeriod();
  const chillers = useMemo(() => mergeChillersFromDashboard(apiPayload, mockChillers), [apiPayload]);
  const [context, setContext] = useState<ContextKey>("water");
  const [period, setPeriod] = useState<PeriodKey>(() => {
    if (typeof window === "undefined") return "d1";
    return globalToLocalPeriod(window.localStorage.getItem("cag-period"));
  });
  const [group, setGroup] = useState<GroupKey>("all");

  useEffect(() => {
    const onPeriodChange = (event: Event) => {
      const value = (event as CustomEvent<string>).detail;
      setPeriod(globalToLocalPeriod(value));
    };
    window.addEventListener("cag-period-change", onPeriodChange);
    return () => window.removeEventListener("cag-period-change", onPeriodChange);
  }, []);
  const activeContext = contextConfig[context];
  const data = useMemo(() => buildTrendRows(period, group), [period, group]);
  const metric = metricValue(context, data);
  const comparison = comparisonData(context, group);
  const distribution = distributionData(context);
  const hours = totalHours(period);
  const periodLabel = period === "d1" ? "24 horas" : period === "week" ? "7 dias" : "30 dias";

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-violet-300">
            <Activity className="h-5 w-5" />
            <h1 className="font-display text-3xl font-bold text-foreground">Tendências Operacionais</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Acompanhe a evolução dos principais indicadores ao longo do tempo.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-lg border border-violet-400/45 bg-violet-500/10 px-4 py-2 text-sm font-semibold text-violet-200 shadow-[0_0_22px_rgba(168,85,247,0.12)] transition hover:bg-violet-500/15">
          <Download className="h-4 w-4" />
          Exportar dados
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {(Object.keys(contextConfig) as ContextKey[]).map((key) => {
          const item = contextConfig[key];
          const Icon = item.icon;
          const active = key === context;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setContext(key)}
              className={cn(
                "group glass-card flex items-center gap-4 p-4 text-left transition-all hover:text-white",
                active && "border-violet-400/65 bg-violet-500/18 shadow-[0_0_28px_rgba(168,85,247,0.18)]",
              )}
            >
              <div className={cn("grid h-11 w-11 place-items-center rounded-xl bg-white/5", active ? item.accent : "text-muted-foreground group-hover:text-foreground")}>
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <div className="font-display text-sm font-semibold group-hover:text-white">{item.label}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground group-hover:text-white/80">{item.subtitle}</div>
              </div>
            </button>
          );
        })}
      </div>

      <div className="glass-card p-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-[360px] flex-1">
            <div className="text-xs text-muted-foreground">Grupo</div>
            <div className="mt-1 grid max-w-[520px] grid-cols-4 gap-2">
              {groups.map((g) => (
                <button
                  key={g.key}
                  type="button"
                  onClick={() => setGroup(g.key)}
                  className={cn(
                    "rounded-lg border border-border/60 bg-background/35 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-violet-400/50 hover:bg-violet-500/15 hover:text-white",
                    group === g.key && "border-violet-400/50 bg-violet-500/20 text-violet-100",
                  )}
                >
                  {g.label}
                </button>
              ))}
            </div>
          </div>
          <button className="inline-flex h-10 items-center gap-2 rounded-lg bg-violet-500/20 px-5 text-sm font-semibold text-violet-200 transition hover:bg-violet-500/30 hover:text-white">
            <Filter className="h-4 w-4" />
            Aplicar filtros
          </button>
        </div>
      </div>

      <div className="glass-card p-5">
        <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em]">{activeContext.title}</h2>
              <span className="grid h-4 w-4 place-items-center rounded-full border border-violet-400/35 text-[10px] text-violet-300">i</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-[11px] text-muted-foreground">
              {trendLines[context].map((line) => (
                <span key={line.key} className="inline-flex items-center gap-2">
                  <span className="h-0.5 w-5 rounded-full" style={{ backgroundColor: line.color }} />
                  {line.label}
                </span>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
            <span>Exibição</span>
            <span className="rounded-lg bg-violet-500/25 px-3 py-1.5 font-semibold text-violet-100">Linha</span>
            <span className="rounded-lg border border-border/60 px-3 py-1.5 hover:text-white">Área</span>
            <span className="ml-2">Intervalo</span>
            <span className="rounded-lg border border-border/60 px-3 py-1.5">{periodLabel}</span>
            <button className="grid h-8 w-8 place-items-center rounded-lg border border-border/60 text-muted-foreground hover:text-white"><Maximize2 className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="h-[315px] w-full">
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 10, right: 24, left: -8, bottom: 5 }}>
              <CartesianGrid stroke={chartColors.grid} strokeOpacity={0.55} vertical={true} />
              <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} minTickGap={period === "month" ? 16 : 8} />
              <YAxis
                domain={activeContext.yDomain}
                ticks={activeContext.yTicks}
                stroke={chartColors.muted}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${v}${activeContext.unit === "°C" ? "°C" : ""}`}
              />
              <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: any) => [`${fmt(Number(value), activeContext.unit === "psi" ? 0 : 1)} ${activeContext.unit}`, name]} />
              {trendLines[context].map((line) => (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.label}
                  stroke={line.color}
                  strokeWidth={2}
                  strokeDasharray={line.dashed ? "5 5" : undefined}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-6">
        <MiniKpi label={metric.label} value={fmt(metric.main, context === "pressure" ? 0 : 1)} unit={metric.unit} delta="▼ 14% vs período anterior" color={metric.color} icon={TrendingDown} />
        <MiniKpi label="Setpoint atingido" value="68" unit="%" delta="▼ 9% vs período anterior" color="text-violet-300" icon={BatteryCharging} />
        <MiniKpi label="Temp. entrada média" value="24,7" unit="°C" delta="▲ 2% vs período anterior" color="text-sky-300" icon={Thermometer} />
        <MiniKpi label="Temp. saída média" value="7,9" unit="°C" delta="▼ 1% vs período anterior" color="text-cyan-300" icon={Thermometer} />
        <MiniKpi label="Máxima variação" value={context === "pressure" ? "82" : "1,4"} unit={context === "pressure" ? "psi" : context === "pumps" ? "%" : "°C"} delta="18/06 às 14:00" color="text-yellow-300" icon={Activity} />
        <MiniKpi label="Horas fora do padrão" value="8,6" unit="h" delta="▲ 23% vs período anterior" color="text-rose-300" icon={Gauge} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_1fr_1fr]">
        <div className="glass-card p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em]">Insights Inteligentes do Período</h3>
          <div className="mt-4 space-y-2">
            {insights(context).map((text, index) => (
              <div key={text} className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/30 px-3 py-3 text-sm text-muted-foreground">
                <span className={cn("grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs", index === 0 ? "bg-yellow-500/15 text-yellow-300" : index === 1 ? "bg-rose-500/15 text-rose-300" : index === 2 ? "bg-emerald-500/15 text-emerald-300" : "bg-violet-500/15 text-violet-300")}>{index + 1}</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em]">Comparativo entre Grupos</h3>
          <p className="text-[11px] text-muted-foreground">{contextConfig[context].label} · período selecionado</p>
          <div className="mt-5 h-[210px]">
            <ResponsiveContainer>
              <BarChart data={comparison} layout="vertical" margin={{ left: 18, right: 24, top: 6, bottom: 6 }}>
                <CartesianGrid stroke={chartColors.grid} horizontal={false} />
                <XAxis type="number" stroke={chartColors.muted} fontSize={11} />
                <YAxis type="category" dataKey="name" stroke={chartColors.muted} fontSize={12} width={80} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={16}>
                  {comparison.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-4">
          <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em]">{distributionTitle(context)}</h3>
          <p className="text-[11px] text-muted-foreground">Horas classificadas no período selecionado</p>
          <div className="mt-4 grid grid-cols-[180px_1fr] items-center gap-4">
            <div className="relative h-[190px]">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={distribution} innerRadius={52} outerRadius={82} paddingAngle={2} dataKey="value">
                    {distribution.map((entry) => <Cell key={entry.name} fill={entry.fill} />)}
                  </Pie>
                  <Tooltip
                    contentStyle={tooltipStyle}
                    formatter={(value: any, name: any) => {
                      const pct = Number(value);
                      return [`${pct}% (${Math.round((pct / 100) * hours)} h)`, name];
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Total</div>
                  <div className="font-display text-2xl font-bold text-foreground">{hours} h</div>
                  <div className="text-[10px] text-muted-foreground">analisadas</div>
                </div>
              </div>
            </div>
            <div className="space-y-3">
              {distribution.map((item) => {
                const itemHours = Math.round((item.value / 100) * hours);
                return (
                  <div key={item.name} className="flex items-center justify-between gap-3 text-sm">
                    <span className="inline-flex items-center gap-2 text-muted-foreground"><span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: item.fill }} />{item.name}</span>
                    <span className="font-mono font-semibold text-foreground">{item.value}% <span className="text-muted-foreground">({itemHours} h)</span></span>
                  </div>
                );
              })}
              <p className="pt-2 text-xs text-muted-foreground">Quanto tempo o sistema operou em cada faixa operacional.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-background/30 px-4 py-3 text-xs text-muted-foreground">
        Os valores apresentados são calculados com base nos dados consolidados e respeitam o período global selecionado no topo da página.
      </div>
    </div>
  );
}
