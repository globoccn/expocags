import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowRight,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Thermometer,
  Waves,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Line,
  LineChart as ReLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { aiInsights, chillerTheme, chillers, events, type ChillerData, type ChillerId } from "@/data/mockCagData";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "Chillers — CAG Expo Center Norte" }] }),
  component: ChillersPage,
});

type PeriodKey = "d1" | "week" | "month";

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

function fmt(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
}

function psi(value: number) {
  return Math.round(value * 50);
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
    suction: psi(circuit.lowPressure),
    discharge: psi(circuit.highPressure),
    oil: hasAttention ? "Atenção" : "Normal",
    fans: "4/4",
    compressor1: circuit.compressor1Status === "on" ? "Operando" : "Standby",
    compressor2: hasAttention ? "Atenção" : circuit.compressor2Status === "on" ? "Operando" : "Standby",
    hasAttention,
  };
}

function buildTrendData(chiller: ChillerData) {
  return chiller.series.deltaT.map((point, index) => ({
    t: point.t,
    deltaT: point.v,
    saida: chiller.series.feedReturnSetpoint[index]?.feed ?? chiller.feedTemp,
    setpoint: chiller.setpoint,
    capacidade: chiller.series.capacity[index]?.total ?? chiller.capacityTotal,
  }));
}

function ChillersPage() {
  const [activeId, setActiveId] = useState<ChillerId>("blue");
  const [period, setPeriod] = useState<PeriodKey>("d1");
  const active = chillers.find((c) => c.id === activeId) || chillers[0];
  const selectedPeriod = periodOptions.find((p) => p.key === period) || periodOptions[0];
  const status = chillerStatus(active);
  const trendData = useMemo(() => buildTrendData(active), [active]);
  const color = chillerColors[active.id];

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Chillers</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumo operacional dos grupos de água gelada</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/55 px-3 py-2 text-xs text-muted-foreground">
            <span className="grid h-8 w-8 place-items-center rounded-lg border border-primary/25 bg-primary/10 text-primary">
              <CalendarDays className="h-4 w-4" />
            </span>
            <span>
              <span className="block text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Atualização dos dados</span>
              <span className="font-semibold text-foreground">Diariamente às 07:00</span>
            </span>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-border/60 bg-surface-2/55 px-3 py-2 text-xs">
            <span className="text-muted-foreground">Período analisado</span>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as PeriodKey)}
              className="rounded-lg border border-border/50 bg-background/65 px-3 py-1.5 font-semibold text-foreground outline-none"
            >
              {periodOptions.map((p) => (
                <option key={p.key} value={p.key}>{p.label} · {p.date}</option>
              ))}
            </select>
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          </div>
          <button className="inline-flex items-center gap-2 rounded-xl border border-status-ai/45 bg-status-ai/10 px-4 py-2 text-sm font-semibold text-status-ai transition hover:bg-status-ai/15">
            <Download className="h-4 w-4" />
            Exportar relatório
          </button>
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
            <div className="relative grid h-36 w-60 shrink-0 place-items-center overflow-hidden rounded-2xl bg-black/10">
              <div className={cn("absolute inset-0 bg-gradient-to-br opacity-70", color.soft)} />
              <img src={chillerImages[active.id]} alt={active.name} className="relative z-10 h-full w-full object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.35)]" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <div className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Status geral</div>
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
              <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <Metric label="Horas de operação" value={`${fmt(active.operatingHours / 1000, 1)} h`} />
                <Metric label="Última atualização" value="19/06/2026 06:55" />
              </div>
            </div>
          </div>

          <div className="border-b border-border/40 py-5 xl:border-b-0 xl:border-r xl:px-5 xl:py-0">
            <SectionTitle>Resumo Água Gelada</SectionTitle>
            <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-3">
              <Metric label="Saída média" value={`${fmt(active.feedTemp, 1)} °C`} />
              <Metric label="Entrada média" value={`${fmt(active.returnTemp, 1)} °C`} />
              <Metric label="Delta T médio" value={`${fmt(active.deltaT, 1)} °C`} valueClassName={status.tone === "ok" ? "text-status-ok" : "text-status-crit"} />
              <Metric label="Setpoint" value={`${fmt(active.setpoint, 1)} °C`} />
              <Metric label="Setpoint atingido" value={active.id === "red" ? "18%" : active.id === "white" ? "88%" : "92%"} />
              <Metric label="Vazão estimada" value={active.id === "red" ? "430 m³/h" : active.id === "white" ? "390 m³/h" : "410 m³/h"} />
            </div>
          </div>

          <div className="py-5 xl:pl-5 xl:py-0">
            <SectionTitle>Resumo de Capacidade</SectionTitle>
            <div className="mt-5 flex items-center gap-6">
              <CapacityRing value={active.capacityTotal} color={active.id} />
              <div className="flex-1 space-y-4 text-sm">
                <CapacityLine label="Circuito A" value={active.capacityA} />
                <CapacityLine label="Circuito B" value={active.capacityB} />
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

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr_0.8fr]">
        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between gap-3">
            <SectionTitle>Tendências — últimas 24 horas</SectionTitle>
            <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
              <Legend className="bg-rose-400" label="Delta T (°C)" />
              <Legend className="bg-sky-400" label="Saída (°C)" />
              <Legend className="bg-emerald-400" label="Setpoint (°C)" />
              <Legend className="bg-yellow-400" label="Capacidade (%)" />
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={trendData} margin={{ left: -20, right: 10, top: 5, bottom: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} interval={3} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "rgba(10,17,30,0.92)",
                    border: "1px solid rgba(56,189,248,0.22)",
                    borderRadius: 12,
                    color: "#e2e8f0",
                  }}
                  labelStyle={{ color: "#bae6fd" }}
                />
                <Line type="monotone" dataKey="deltaT" name="Delta T" stroke="#fb7185" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="saida" name="Saída" stroke="#38bdf8" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="setpoint" name="Setpoint" stroke="#4ade80" strokeWidth={2} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="capacidade" name="Capacidade" stroke="#facc15" strokeWidth={2} dot={false} />
              </ReLineChart>
            </ResponsiveContainer>
          </div>
          <button className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl border border-status-ai/40 bg-status-ai/8 px-4 py-2 text-sm font-semibold text-status-ai transition hover:bg-status-ai/12">
            Ver mais tendências
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <SectionTitle>Eventos recentes</SectionTitle>
            <button className="text-xs font-semibold text-status-ai">Ver todos</button>
          </div>
          <div className="space-y-3">
            {recentEvents(active.id).map((event) => (
              <div key={event.time + event.text} className="flex items-center gap-3 rounded-xl border border-border/35 bg-background/25 p-3 text-xs">
                <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/12 text-primary">
                  <Info className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="font-mono font-semibold text-foreground">{event.time}</div>
                  <div className="truncate text-muted-foreground">{event.text}</div>
                </div>
                <span className="rounded-full border border-status-info/30 bg-status-info/10 px-2 py-0.5 text-[10px] text-status-info">Informação</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <SectionTitle>Ações recomendadas</SectionTitle>
          <div className="mt-6 flex min-h-48 flex-col justify-center gap-5">
            {recommendedActions(active).length ? (
              recommendedActions(active).map((action, index) => (
                <div key={action} className="flex gap-3 rounded-xl border border-border/35 bg-background/25 p-3">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary/15 text-xs font-bold text-primary">{index + 1}</span>
                  <p className="text-sm font-semibold">{action}</p>
                </div>
              ))
            ) : (
              <div className="text-center">
                <CheckCircle2 className="mx-auto h-7 w-7 text-status-ok" />
                <p className="mt-3 font-semibold">Nenhuma ação crítica no momento</p>
                <p className="mt-1 text-sm text-muted-foreground">Continue monitorando os parâmetros operacionais.</p>
              </div>
            )}
          </div>
          <button className="mt-6 flex w-full items-center justify-between rounded-xl border border-status-ai/35 bg-status-ai/8 px-4 py-3 text-sm font-semibold text-status-ai transition hover:bg-status-ai/12">
            Ver todas as ações
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </section>

      <div className="glass-card flex items-center gap-3 px-5 py-3 text-xs text-muted-foreground">
        <Info className="h-4 w-4 text-primary" />
        <span>Os dados apresentados são baseados no período selecionado: {selectedPeriod.label} ({selectedPeriod.date}).</span>
      </div>
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

function CapacityLine({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex items-center justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-semibold text-foreground">{value}%</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-primary" style={{ width: `${value}%` }} />
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
        <StatusPill tone={circuit.hasAttention ? "warn" : "ok"}>{circuit.hasAttention ? "Atenção" : "Operando"}</StatusPill>
      </div>
      <div className="grid gap-3 md:grid-cols-5">
        <div className="md:col-span-1">
          <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Capacidade média</div>
          <div className="mt-1 font-display text-2xl font-bold">{circuit.capacity}%</div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">
            <div className={cn("h-full rounded-full", circuit.hasAttention ? "bg-status-warn" : "bg-primary")} style={{ width: `${circuit.capacity}%` }} />
          </div>
        </div>
        <CircuitMetric label="Sucção média" value={`${circuit.suction} psi`} />
        <CircuitMetric label="Descarga média" value={`${circuit.discharge} psi`} />
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

function Legend({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn("h-0.5 w-5 rounded-full", className)} />
      {label}
    </span>
  );
}

function recentEvents(chillerId: ChillerId) {
  const filtered = events.filter((e) => e.chiller === chillerId).slice(0, 4);
  if (filtered.length) return filtered;
  return [
    { time: "06:45", text: "Delta T dentro do esperado" },
    { time: "06:20", text: "Capacidade circuito B normalizada" },
    { time: "05:40", text: "Início do período de operação" },
    { time: "05:15", text: "Sistema em partida" },
  ];
}

function recommendedActions(chiller: ChillerData) {
  if (chiller.id !== "red") return [];
  return aiInsights
    .filter((insight) => insight.chiller === chiller.id && insight.status === "ativo")
    .slice(0, 3)
    .map((insight) => insight.recommendation);
}
