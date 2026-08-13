import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CheckCircle2,
  Info,
  Thermometer,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { chillerTheme, type ChillerData, type ChillerId } from "@/data/mockCagData";
import { labelForPeriod, legacyChillers, useDashboard, text, textInt } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";
import { EnterpriseLineChart } from "@/components/cag/enterprise-line-chart";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "Chillers — CAG Expo Center Norte" }] }),
  component: ChillersPage,
});

type PeriodKey = "d1" | "week" | "month";
type TrendContext = "water" | "capacity" | "pressure";

const periodOptions: Array<{ key: PeriodKey; label: string; date: string }> = [
  { key: "d1", label: "D-1", date: "19/06/2026" },
  { key: "week", label: "Semana", date: "13/06 a 19/06" },
  { key: "month", label: "Mês", date: "Junho/2026" },
];

const chillerImages: Record<ChillerId, string> = {
  blue: chillerBlue,
  red: chillerRed,
  white: chillerWhite,
};

const chillerColors: Record<ChillerId, { dot: string; text: string; border: string; glow: string; soft: string }> = {
  blue: {
    dot: "bg-sky-400",
    text: "text-sky-300",
    border: "border-sky-400/45",
    glow: "shadow-[0_0_32px_rgba(56,189,248,0.18)]",
    soft: "from-sky-500/14 via-sky-400/4 to-transparent",
  },
  red: {
    dot: "bg-rose-500",
    text: "text-rose-300",
    border: "border-rose-500/45",
    glow: "shadow-[0_0_34px_rgba(244,63,94,0.18)]",
    soft: "from-rose-500/16 via-rose-400/4 to-transparent",
  },
  white: {
    dot: "bg-slate-100",
    text: "text-slate-100",
    border: "border-slate-300/35",
    glow: "shadow-[0_0_32px_rgba(226,232,240,0.12)]",
    soft: "from-slate-300/12 via-slate-300/4 to-transparent",
  },
};

function fmt(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || !Number.isFinite(Number(value))) return "--";
  return Number(value).toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function chillerStatus(chiller: ChillerData) {
  if (chiller.risk === "ok") return { label: "Normal", tone: "ok" as const, occurrence: "Sem ocorrências relevantes" };
  if (chiller.risk === "info") return { label: "Normal", tone: "info" as const, occurrence: "Operação estável em acompanhamento" };
  return { label: "Atenção", tone: "warn" as const, occurrence: chiller.activeAlarms[0] || "Ponto de atenção operacional" };
}

function circuitSummary(chiller: ChillerData, circuitId: "A" | "B") {
  const circuit = chiller.circuits.find((c) => c.id === circuitId) || chiller.circuits[0];
  const hasAttention = chiller.risk !== "ok" && circuitId === "B" && chiller.id === "red";
  return {
    title: `Circuito ${circuitId}`,
    capacity: circuitId === "A" ? chiller.capacityA : chiller.capacityB,
    suction: textInt(circuit.lowPressure, " psi"),
    discharge: textInt(circuit.highPressure, " psi"),
    oil: hasAttention ? "Atenção" : "Normal",
    fans: "4/4",
    compressor1: text((circuit as any).compressor1Hours, " h", 1),
    compressor2: text((circuit as any).compressor2Hours, " h", 1),
    hasAttention,
  };
}

function periodPointCount(period: PeriodKey) {
  if (period === "d1") return 24;
  if (period === "week") return 7;
  return 30;
}

function periodTickLabel(period: PeriodKey, index: number) {
  if (period === "d1") return `${String(index).padStart(2, "0")}h`;
  if (period === "week") return [`D-6`, `D-5`, `D-4`, `D-3`, `D-2`, `D-1`, `Hoje`][index] || `D-${6 - index}`;
  return `${String(index + 1).padStart(2, "0")}/06`;
}

function sampleSeries<T>(series: T[], index: number, total: number) {
  if (!series.length) return null;
  if (total <= 1) return series[0];
  const sourceIndex = Math.round((index / (total - 1)) * (series.length - 1));
  return series[Math.min(series.length - 1, Math.max(0, sourceIndex))];
}

function buildTrendData(chiller: ChillerData, _period: PeriodKey) {
  const water = chiller.series.feedReturnSetpoint || [];
  const delta = chiller.series.deltaT || [];
  const capacity = chiller.series.capacity || [];
  const high = chiller.series.pressureHigh || [];
  const low = chiller.series.pressureLow || [];
  const total = Math.max(water.length, delta.length, capacity.length, high.length, low.length);
  return Array.from({ length: total }, (_, index) => ({
    t: water[index]?.t || delta[index]?.t || capacity[index]?.t || high[index]?.t || low[index]?.t || "--",
    entrada: water[index]?.ret ?? null,
    saida: water[index]?.feed ?? null,
    setpoint: water[index]?.set ?? null,
    deltaT: delta[index]?.v ?? null,
    capacidadeA: capacity[index]?.a ?? null,
    capacidadeB: capacity[index]?.b ?? null,
    succaoA: low[index]?.a ?? null,
    succaoB: low[index]?.b ?? null,
    descargaA: high[index]?.a ?? null,
    descargaB: high[index]?.b ?? null,
  }));
}

const trendContexts: Record<TrendContext, { label: string; unit: string; subtitle: string; lines: Array<{ key: string; label: string; color: string; dashed?: boolean }> }> = {
  water: {
    label: "Água Gelada",
    unit: "°C",
    subtitle: "Entrada, saída, setpoint e Delta T",
    lines: [
      { key: "entrada", label: "Entrada", color: "#60a5fa" },
      { key: "saida", label: "Saída", color: "#38bdf8" },
      { key: "setpoint", label: "Setpoint", color: "#4ade80", dashed: true },
      { key: "deltaT", label: "Delta T", color: "#fb7185" },
    ],
  },
  capacity: {
    label: "Capacidade",
    unit: "%",
    subtitle: "Capacidade média dos circuitos A e B",
    lines: [
      { key: "capacidadeA", label: "Circuito A", color: "#38bdf8" },
      { key: "capacidadeB", label: "Circuito B", color: "#a78bfa" },
    ],
  },
  pressure: {
    label: "Pressões",
    unit: "psi",
    subtitle: "Sucção e descarga por circuito",
    lines: [
      { key: "succaoA", label: "Sucção A", color: "#22c55e" },
      { key: "succaoB", label: "Sucção B", color: "#84cc16" },
      { key: "descargaA", label: "Descarga A", color: "#fb7185" },
      { key: "descargaB", label: "Descarga B", color: "#f97316" },
    ],
  },
};

function trendPeriodLabel(period: PeriodKey) {
  if (period === "d1") return "24 horas";
  if (period === "week") return "7 dias";
  return "30 dias";
}

function trendYAxisConfig(context: TrendContext) {
  if (context === "water") {
    return {
      domain: [0, 16] as [number, number],
      ticks: [0, 4, 8, 12, 16],
    };
  }
  if (context === "capacity") {
    return {
      domain: [0, 100] as [number, number],
      ticks: [0, 25, 50, 75, 100],
    };
  }
  return {
    domain: [0, 900] as [number, number],
    ticks: [0, 225, 450, 675, 900],
  };
}

function ChillersPage() {
  const [activeId, setActiveId] = useState<ChillerId>("blue");
  const { period, setPeriod, payload } = useDashboard();
  const [trendContext, setTrendContext] = useState<TrendContext>("water");
  const chillers = legacyChillers(payload) as ChillerData[];
  const active = chillers.find((c) => c.id === activeId) || chillers[0];
  const selectedPeriod = labelForPeriod(payload, period);
  const status = chillerStatus(active);
  const trendData = useMemo(() => buildTrendData(active, period), [active, period]);
  const activeTrend = trendContexts[trendContext];
  const activeYAxis = trendYAxisConfig(trendContext);
  const color = chillerColors[active.id];

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Chillers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumo operacional dos grupos de água gelada</p>
        </div>

      </section>

      <section className="glass-card p-2">
        <div className="grid gap-3 md:grid-cols-3">
          {chillers.map((chiller) => {
            const tabColor = chillerColors[chiller.id];
            const activeTab = activeId === chiller.id;
            return (
              <button
                key={chiller.id}
                type="button"
                onClick={() => setActiveId(chiller.id)}
                className={cn(
                  "group flex h-14 items-center justify-center gap-3 rounded-xl border bg-surface-2/45 text-sm font-semibold transition-all",
                  activeTab
                    ? cn(tabColor.border, tabColor.glow, "bg-primary/8")
                    : "border-border/50 text-muted-foreground hover:border-primary/25 hover:text-foreground",
                )}
              >
                <span className={cn("h-3 w-3 rounded-full shadow-[0_0_16px_currentColor]", tabColor.dot)} />
                <span className={activeTab ? tabColor.text : ""}>{chiller.name}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn("glass-card overflow-hidden border p-0", color.border, color.glow)}>
        <div className={cn("grid gap-0 bg-gradient-to-r p-5", color.soft, "xl:grid-cols-[1.05fr_1.1fr_0.72fr]")}> 
          <div className="flex items-center gap-5 border-b border-border/40 pb-5 xl:border-b-0 xl:border-r xl:pb-0 xl:pr-5">
            <div className="relative grid h-44 w-80 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/10">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", color.soft)} />
              <img src={chillerImages[active.id]} alt={active.name} className="relative z-10 h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Resumo do período</div>
                  <h2 className={cn("font-display text-xl font-bold", color.text)}>{active.name}</h2>
                </div>
                <StatusPill tone={status.tone}>{status.label}</StatusPill>
              </div>
              <div className="rounded-xl border border-border/45 bg-background/30 p-3">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Principal ocorrência</div>
                <div className="mt-2 flex items-center gap-2 font-semibold">
                  {status.tone === "ok" ? <CheckCircle2 className="h-4 w-4 text-status-ok" /> : <Info className="h-4 w-4 text-status-warn" />}
                  <span>{status.occurrence}</span>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 text-sm">
                <Metric label="Horas de operação" value={text(active.operatingHours === null || active.operatingHours === undefined ? null : active.operatingHours / 1000, " h", 1)} />
              </div>
            </div>
          </div>

          <div className="border-b border-border/40 py-5 xl:border-b-0 xl:border-r xl:px-5 xl:py-0">
            <SectionTitle>Resumo Água Gelada</SectionTitle>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Metric label="Saída média" value={text(active.feedTemp, " °C", 1)} />
              <Metric label="Entrada média" value={text(active.returnTemp, " °C", 1)} />
              <Metric label="Delta T médio" value={text(active.deltaT, " °C", 1)} valueClassName={status.tone === "ok" ? "text-status-ok" : "text-status-crit"} />
              <Metric label="Setpoint" value={text(active.setpoint, " °C", 1)} />
              <Metric label="Setpoint atingido" value={textInt((active as any).setpointAtingido, "%")} />
            </div>
          </div>

          <div className="py-5 xl:pl-5 xl:py-0">
            <SectionTitle>Resumo de Capacidade</SectionTitle>
            <div className="mt-5 flex items-center gap-6">
              <CapacityRing value={active.capacityTotal ?? 0} color={active.id} />
              <div className="flex-1 space-y-4 text-sm">
                <CapacityLine label="Circuito A" value={active.capacityA ?? null} />
                <CapacityLine label="Circuito B" value={active.capacityB ?? null} />
                <CapacityLine label="Capacidade instalada" value={100} />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-2">
        <CircuitCard chiller={active} circuitId="A" />
        <CircuitCard chiller={active} circuitId="B" />
      </section>

      <section className="grid gap-4">
        <div className="glass-card p-5">
          <div className="mb-4 flex flex-col gap-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <SectionTitle>Tendências Operacionais</SectionTitle>
                <p className="mt-1 text-xs text-muted-foreground">{activeTrend.subtitle} · {trendPeriodLabel(period)}</p>
              </div>
              <div className="flex rounded-xl border border-border/45 bg-background/25 p-1 text-xs font-semibold">
                {(Object.keys(trendContexts) as TrendContext[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setTrendContext(key)}
                    className={cn(
                      "rounded-lg px-3 py-1.5 transition",
                      trendContext === key
                        ? "bg-primary/18 text-primary shadow-[0_0_18px_rgba(56,189,248,0.16)]"
                        : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                    )}
                  >
                    {trendContexts[key].label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[10px] text-muted-foreground">
              {activeTrend.lines.map((line) => (
                <Legend key={line.key} color={line.color} dashed={line.dashed} label={`${line.label} (${activeTrend.unit})`} />
              ))}
            </div>
          </div>
          <EnterpriseLineChart
            data={trendData}
            xKey="t"
            height={256}
            leftDomain={activeYAxis.domain}
            leftTicks={activeYAxis.ticks}
            leftUnit={activeTrend.unit === "status" ? "" : ` ${activeTrend.unit}`}
            showLegend={false}
            className="border-border/30 bg-background/20"
            series={activeTrend.lines.map((line, index) => ({
              key: line.key,
              label: line.label,
              unit: activeTrend.unit === "status" ? "" : activeTrend.unit,
              axis: "left" as const,
              color: line.color,
              dashed: line.dashed,
              fill: index === 0 && !line.dashed,
            }))}
          />
        </div>

      </section>
    </div>
  );
}

function StatusPill({ tone, children }: { tone: "ok" | "info" | "warn"; children: string }) {
  const cls = tone === "ok" || tone === "info"
    ? "border-status-ok/40 bg-status-ok/12 text-status-ok"
    : "border-status-warn/45 bg-status-warn/12 text-status-warn";
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-bold", cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {children}
    </span>
  );
}

function SectionTitle({ children }: { children: string }) {
  return <h3 className="font-display text-sm font-bold uppercase tracking-[0.12em] text-foreground/90">{children}</h3>;
}

function Metric({ label, value, valueClassName }: { label: string; value: string; valueClassName?: string }) {
  return (
    <div className="rounded-xl border border-border/35 bg-background/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-lg font-bold", valueClassName)}>{value}</div>
    </div>
  );
}

function CapacityRing({ value, color }: { value: number; color: ChillerId }) {
  const ringColor = color === "red" ? "#fb7185" : color === "white" ? "#e2e8f0" : "#38bdf8";
  return (
    <div className="relative grid h-28 w-28 shrink-0 place-items-center rounded-full" style={{ background: `conic-gradient(${ringColor} ${value * 3.6}deg, rgba(148,163,184,0.16) 0deg)` }}>
      <div className="grid h-[78px] w-[78px] place-items-center rounded-full bg-background/95 shadow-[inset_0_0_18px_rgba(255,255,255,0.04)]">
        <div className="text-center">
          <div className="font-display text-2xl font-bold" style={{ color: ringColor }}>{value}%</div>
          <div className="text-[10px] text-muted-foreground">Capacidade média</div>
        </div>
      </div>
    </div>
  );
}

function CapacityLine({ label, value }: { label: string; value: number | null }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{textInt(value, "%")}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value ?? 0}%` }} />
      </div>
    </div>
  );
}

function CircuitCard({ chiller, circuitId }: { chiller: ChillerData; circuitId: "A" | "B" }) {
  const circuit = circuitSummary(chiller, circuitId);
  return (
    <div className={cn("glass-card border p-5", circuit.hasAttention ? "border-status-warn/45" : "border-primary/35")}>
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-display text-lg font-bold uppercase text-primary">{circuit.title}</h3>
        <StatusPill tone={circuit.hasAttention ? "warn" : "ok"}>{circuit.hasAttention ? "Atenção" : "Operou no período"}</StatusPill>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Capacidade média</div>
          <div className="mt-1 font-display text-2xl font-bold">{textInt(circuit.capacity, "%")}</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full rounded-full", circuit.hasAttention ? "bg-status-warn" : "bg-primary")} style={{ width: `${circuit.capacity ?? 0}%` }} />
          </div>
        </div>
        <CircuitMetric label="Sucção média" value={circuit.suction} />
        <CircuitMetric label="Descarga média" value={circuit.discharge} />
        <CircuitMetric label="Óleo CP1/CP2" value={circuit.oil} tone={circuit.hasAttention ? "warn" : "ok"} />
        <CircuitMetric label="Ventiladores" value={circuit.fans} />
      </div>
      <div className="mt-5 grid gap-3 border-t border-border/40 pt-4 md:grid-cols-2">
        <CircuitMetric label="Compressor 1" value={circuit.compressor1} tone="ok" />
        <CircuitMetric label="Compressor 2" value={circuit.compressor2} tone={circuit.hasAttention ? "warn" : "ok"} />
      </div>
    </div>
  );
}

function CircuitMetric({ label, value, tone }: { label: string; value: string; tone?: "ok" | "warn" }) {
  return (
    <div className="rounded-xl border border-border/30 bg-background/20 p-3">
      <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className={cn("mt-1 font-display text-lg font-bold", tone === "ok" && "text-status-ok", tone === "warn" && "text-status-warn")}>{value}</div>
    </div>
  );
}

function Legend({ color, dashed, label }: { color: string; dashed?: boolean; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={cn("h-0.5 w-5 rounded-full", dashed && "bg-[length:6px_2px]")}
        style={dashed ? { backgroundImage: `linear-gradient(to right, ${color} 55%, transparent 55%)` } : { backgroundColor: color }}
      />
      {label}
    </span>
  );
}

function recentEvents(chiller: ChillerData) {
  return (((chiller as any).eventos_recentes || []) as any[]).slice(0, 4).map((event) => ({
    time: event.time || event.hora || "--",
    text: event.text || event.title || event.titulo || event.detail || event.detalhe || "Ocorrência operacional",
  }));
}

function recommendedActions(chiller: ChillerData) {
  return ((chiller as any).acoes_recomendadas || []).slice(0, 3);
}
