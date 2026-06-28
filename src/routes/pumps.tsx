import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Download,
  Info,
  Settings,
  Wrench,
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
import pumpBlue from "@/assets/pump-blue.png";
import pumpRed from "@/assets/pump-red.png";
import pumpWhite from "@/assets/pump-white.png";
import { type ChillerData, type ChillerId, type PumpData } from "@/data/mockCagData";
import { legacyChillers, useDashboard, text, textInt, cardValue, cardRaw } from "@/lib/dashboard-api";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pumps")({
  head: () => ({ meta: [{ title: "Bombas — CAG Expo Center Norte" }] }),
  component: PumpsPage,
});

type PeriodKey = "d1" | "week" | "month";
type PumpTrendContext = "pressure" | "pumps" | "bypass";

const periodOptions: Array<{ key: PeriodKey; label: string; date: string }> = [
  { key: "d1", label: "D-1", date: "19/06/2026" },
  { key: "week", label: "Semana", date: "13/06 a 19/06" },
  { key: "month", label: "Mês", date: "Junho/2026" },
];

const pumpImages: Record<ChillerId, string> = {
  blue: pumpBlue,
  red: pumpRed,
  white: pumpWhite,
};

const groupLabels: Record<ChillerId, string> = {
  blue: "Bombas Azul",
  red: "Bombas Vermelho",
  white: "Bombas Branco",
};

const groupColors: Record<ChillerId, { dot: string; text: string; border: string; glow: string; soft: string; accent: string }> = {
  blue: {
    dot: "bg-sky-400",
    text: "text-sky-300",
    border: "border-sky-400/45",
    glow: "shadow-[0_0_32px_rgba(56,189,248,0.18)]",
    soft: "from-sky-500/14 via-sky-400/4 to-transparent",
    accent: "#38bdf8",
  },
  red: {
    dot: "bg-rose-500",
    text: "text-rose-300",
    border: "border-rose-500/45",
    glow: "shadow-[0_0_34px_rgba(244,63,94,0.18)]",
    soft: "from-rose-500/16 via-rose-400/4 to-transparent",
    accent: "#f43f5e",
  },
  white: {
    dot: "bg-slate-100",
    text: "text-slate-100",
    border: "border-slate-300/35",
    glow: "shadow-[0_0_32px_rgba(226,232,240,0.12)]",
    soft: "from-slate-300/12 via-slate-300/4 to-transparent",
    accent: "#e2e8f0",
  },
};

const trendContexts: Record<
  PumpTrendContext,
  { label: string; subtitle: string; unit: string; lines: Array<{ key: string; label: string; color: string; dashed?: boolean }> }
> = {
  pressure: {
    label: "Pressão",
    subtitle: "Pressão da linha e setpoint",
    unit: "bar",
    lines: [
      { key: "pressure", label: "Pressão linha", color: "#fb7185" },
      { key: "setpoint", label: "Setpoint", color: "#94a3b8", dashed: true },
    ],
  },
  pumps: {
    label: "Bombas",
    subtitle: "Estado operacional BAG1 a BAG4",
    unit: "status",
    lines: [
      { key: "bag1", label: "BAG1", color: "#22c55e" },
      { key: "bag2", label: "BAG2", color: "#38bdf8" },
      { key: "bag3", label: "BAG3", color: "#facc15" },
      { key: "bag4", label: "BAG4", color: "#a78bfa" },
    ],
  },
  bypass: {
    label: "Bypass",
    subtitle: "Abertura da válvula bypass",
    unit: "%",
    lines: [{ key: "bypass", label: "Bypass", color: "#f97316" }],
  },
};

function fmt(value: number, digits = 1) {
  return value.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits });
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

function trendPeriodLabel(period: PeriodKey) {
  if (period === "d1") return "24 horas";
  if (period === "week") return "7 dias";
  return "30 dias";
}

function groupStatus(group: ChillerData) {
  const ui = (group as any).pumpUi || {};
  const tone = String(ui.status || "normal").toLowerCase().includes("crit") || String(ui.status || "").toLowerCase().includes("alert")
    ? "warn"
    : String(ui.status || "normal").toLowerCase().includes("aten") || String(ui.status || "").toLowerCase().includes("warn")
      ? "warn"
      : "ok";
  return {
    label: ui.statusLabel || (tone === "ok" ? "Normal" : "Atenção"),
    tone: tone as "ok" | "warn",
    occurrence: ui.subtitle || "--",
    description: ui.subtitle || "--",
    pumpsOn: cardRaw(ui.cards, "bombas_ligadas") ?? "--",
  };
}

function pumpStatusLabel(pump: PumpData) {
  const label = (pump as any).statusLabel || "--";
  if (pump.status === "fault" || pump.alarm) return { label, tone: "alert" as const };
  if (pump.status === "on") return { label, tone: "ok" as const };
  return { label, tone: "muted" as const };
}

function buildPumpTrendData(group: ChillerData, _period: PeriodKey) {
  const pressure = (group as any).pumpSeries?.pressao || [];
  const pumps = (group as any).pumpSeries?.bombas || [];
  const bypass = (group as any).pumpSeries?.bypass || [];
  const total = Math.max(pressure.length, pumps.length, bypass.length);
  return Array.from({ length: total }, (_, index) => ({
    t: pressure[index]?.x || pumps[index]?.x || bypass[index]?.x || "--",
    pressure: pressure[index]?.linha ?? null,
    setpoint: pressure[index]?.setpoint ?? null,
    bypass: bypass[index]?.abertura ?? null,
    bag1: pumps[index]?.bag1 ?? null,
    bag2: pumps[index]?.bag2 ?? null,
    bag3: pumps[index]?.bag3 ?? null,
    bag4: pumps[index]?.bag4 ?? null,
  }));
}

function yAxisConfig(context: PumpTrendContext, _group: ChillerData) {
  if (context === "pressure") return { domain: [0, 10] as [number, number], ticks: [0, 5, 10] };
  if (context === "pumps") return { domain: [-0.1, 1.1] as [number, number], ticks: [0, 1] };
  return { domain: [0, 100] as [number, number], ticks: [0, 25, 50, 75, 100] };
}

function statusPill(tone: "ok" | "warn" | "alert" | "muted", label: string) {
  return cn(
    "inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-bold",
    tone === "ok" && "border-status-ok/45 bg-status-ok/10 text-status-ok",
    tone === "warn" && "border-status-warn/55 bg-status-warn/10 text-status-warn",
    tone === "alert" && "border-status-alert/55 bg-status-alert/10 text-status-alert",
    tone === "muted" && "border-border/70 bg-surface-2/60 text-muted-foreground",
  );
}

function getEvents(group: ChillerData) {
  const events = ((group as any).pumpUi?.eventos || []) as any[];
  return events.map((event) => ({
    time: event.time || event.hora || "--",
    label: event.label || event.text || event.title || event.titulo || event.detail || event.detalhe || "--",
    tone: String(event.severidade || event.severity || event.tone || "").toLowerCase().includes("aten") ? "warn" as const : "info" as const,
  }));
}

function getRecommendations(group: ChillerData) {
  const actions = ((group as any).pumpUi?.acoes || []) as any[];
  return actions.map((item) => typeof item === "string" ? { title: item, detail: "" } : { title: item.title || item.titulo || "--", detail: item.detail || item.detalhe || item.desc || "" });
}

function PumpCard({ pump, index }: { pump: PumpData; index: number }) {
  const status = pumpStatusLabel(pump);
  const hasAttention = status.tone !== "ok" || pump.mode === "local" || pump.alarm;

  return (
    <article className={cn("rounded-2xl border border-border/55 bg-surface-2/35 p-4", hasAttention && "border-status-warn/45 bg-status-warn/5")}> 
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg font-bold">BAG {index + 1}</h3>
          <p className="mt-1 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Bomba de água gelada</p>
        </div>
        <span className={statusPill(status.tone, status.label)}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {status.label}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Modo</p>
          <p className={cn("mt-1 font-bold", pump.mode === "local" ? "text-status-warn" : "text-foreground")}>{(pump as any).modeLabel || "--"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Status</p>
          <p className={cn("mt-1 font-bold", pump.status === "on" ? "text-status-ok" : "text-muted-foreground")}>{(pump as any).statusLabel || "--"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Horas ligada</p>
          <p className="mt-1 font-mono text-base font-bold">{(pump as any).horasLigadaLabel || "--"}</p>
        </div>
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Partidas est.</p>
          <p className="mt-1 font-mono text-base font-bold">{(pump as any).partidasLabel || "--"}</p>
        </div>
      </div>

      <div className="mt-5 border-t border-border/50 pt-3">
        <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Última ocorrência</p>
        <div className={cn("mt-2 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold", hasAttention ? "border-status-warn/45 bg-status-warn/10 text-status-warn" : "border-status-ok/35 bg-status-ok/10 text-status-ok")}>
          {hasAttention ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {pump.lastEvent || "Sem ocorrências relevantes"}
        </div>
      </div>
    </article>
  );
}

function PumpsPage() {
  const [activeId, setActiveId] = useState<ChillerId>("blue");
  const { period, setPeriod, payload } = useDashboard();
  const [trendContext, setTrendContext] = useState<PumpTrendContext>("pressure");
  const chillers = legacyChillers(payload).map((group: any) => {
    const apiId = group.id === "blue" ? "azul" : group.id === "red" ? "vermelho" : "branco";
    const bomba = payload?.bombas?.items?.find?.((b: any) => b.id === apiId);
    return { ...group, pumpSeries: bomba?.trends || {} };
  }) as ChillerData[];
  const active = chillers.find((group) => group.id === activeId) || chillers[0];
  const status = groupStatus(active);
  const color = groupColors[active.id];
  const selectedPeriod = periodOptions.find((option) => option.key === period) || periodOptions[0];
  const trendData = useMemo(() => buildPumpTrendData(active, period), [active, period]);
  const activeTrend = trendContexts[trendContext];
  const activeYAxis = yAxisConfig(trendContext, active);
  const events = getEvents(active);
  const recommendations = getRecommendations(active);

  return (
    <div className="space-y-4">
      <section className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">Bombas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Resumo operacional dos grupos de bombeamento de água gelada</p>
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
              onChange={(event) => setPeriod(event.target.value as PeriodKey)}
              className="rounded-lg border border-border/50 bg-background/65 px-3 py-1.5 font-semibold text-foreground outline-none"
            >
              {periodOptions.map((option) => (
                <option key={option.key} value={option.key}>{option.label} · {option.date}</option>
                );
            })}
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
          {chillers.map((group) => {
            const tabColor = groupColors[group.id];
            const activeTab = activeId === group.id;
            const tabStatus = groupStatus(group);
            return (
              <button
                key={group.id}
                onClick={() => setActiveId(group.id)}
                className={cn(
                  "flex items-center justify-center gap-3 rounded-xl border px-5 py-4 text-sm font-bold text-muted-foreground transition",
                  activeTab ? `${tabColor.border} bg-surface-3/70 ${tabColor.text} ${tabColor.glow}` : "border-border/55 bg-surface-2/35 hover:border-primary/25 hover:text-foreground",
                )}
              >
                <span className={cn("h-3 w-3 rounded-full shadow-[0_0_16px_currentColor]", tabColor.dot)} />
                {groupLabels[group.id]}
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", tabStatus.tone === "ok" ? "border-status-ok/35 text-status-ok" : "border-status-warn/45 text-status-warn")}>{tabStatus.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className={cn("glass-card relative overflow-hidden border p-6", color.border, color.glow)}>
        <div className={cn("absolute inset-0 pointer-events-none bg-gradient-to-br opacity-80", color.soft)} />
        <div className="relative grid gap-6 xl:grid-cols-[1.15fr_1.85fr]">
          <div className="flex items-center gap-6">
            <div className="grid min-h-[178px] w-[285px] place-items-center rounded-2xl bg-background/25 shadow-inner">
              <img src={pumpImages[active.id]} alt={groupLabels[active.id]} className="h-[170px] w-[260px] object-contain drop-shadow-[0_0_24px_rgba(56,189,248,0.18)]" />
            </div>
            <div className="min-w-[230px] flex-1">
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Resumo do grupo</div>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <h2 className={cn("font-display text-2xl font-bold", color.text)}>{groupLabels[active.id]}</h2>
                <span className={statusPill(status.tone, status.label)}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current" />
                  {status.label}
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground">{status.description}</p>
              <div className="mt-5 rounded-xl border border-border/45 bg-background/35 p-4">
                <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Principal ocorrência</p>
                <p className={cn("mt-2 flex items-center gap-2 text-sm font-bold", status.tone === "ok" ? "text-status-ok" : "text-status-warn")}>
                  {status.tone === "ok" ? <CheckCircle2 className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                  {status.occurrence}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-5">
            {([
              { id: "pressao_linha", fallbackLabel: "Pressão média" },
              { id: "setpoint", fallbackLabel: "Setpoint" },
              { id: "bypass", fallbackLabel: "Válvula bypass" },
              { id: "bombas_ligadas", fallbackLabel: "Bombas operando" },
              { id: "status_geral", fallbackLabel: "Status geral" },
            ] as const).map((def) => {
              const card = ((active as any).pumpUi?.cards || []).find((c: any) => c.id === def.id) || {};
              const metric = { label: card.label || def.fallbackLabel, value: card.value ?? "--", detail: card.detail || "", alert: String(card.status || "").toLowerCase().includes("aten") || String(card.status || "").toLowerCase().includes("crit") };
              return (
                <div key={metric.label} className="rounded-2xl border border-border/45 bg-background/35 p-4">
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">{metric.label}</p>
                  <p className={cn("mt-3 font-display text-2xl font-bold", metric.alert && "text-status-alert")}>{metric.value}</p>
                  <p className={cn("mt-2 text-xs", metric.alert ? "text-status-warn" : "text-muted-foreground")}>{metric.detail}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">Status das bombas do grupo</h2>
          <span className="text-xs text-muted-foreground">BAG1 a BAG4 · {selectedPeriod.label}</span>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {active.pumps.map((pump, index) => (
            <PumpCard key={pump.id} pump={pump} index={index} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.8fr_0.85fr]">
        <div className="glass-card p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-lg font-bold uppercase tracking-wide">Tendências operacionais</h2>
              <p className="mt-1 text-sm text-muted-foreground">{activeTrend.subtitle} · {trendPeriodLabel(period)}</p>
            </div>
            <div className="rounded-2xl border border-border/50 bg-background/35 p-1">
              {(Object.keys(trendContexts) as PumpTrendContext[]).map((contextKey) => (
                <button
                  key={contextKey}
                  onClick={() => setTrendContext(contextKey)}
                  className={cn(
                    "rounded-xl px-4 py-2 text-xs font-bold transition",
                    trendContext === contextKey ? "bg-primary/20 text-primary shadow-[0_0_18px_rgba(14,165,233,0.15)]" : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {trendContexts[contextKey].label}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
            {activeTrend.lines.map((line) => (
              <span key={line.key} className="inline-flex items-center gap-2">
                <span className={cn("h-0.5 w-6", line.dashed && "border-t border-dashed bg-transparent")} style={{ backgroundColor: line.dashed ? "transparent" : line.color, borderColor: line.color }} />
                {line.label}{activeTrend.unit !== "status" ? ` (${activeTrend.unit})` : ""}
              </span>
            ))}
          </div>

          <div className="h-[275px] rounded-2xl border border-border/35 bg-background/20 p-4">
            <ResponsiveContainer width="100%" height="100%">
              <ReLineChart data={trendData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="t" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} interval={period === "month" ? 4 : 0} />
                <YAxis
                  domain={activeYAxis.domain}
                  ticks={activeYAxis.ticks}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  width={44}
                  tickFormatter={(value) => trendContext === "pumps" ? (Number(value) === 1 ? "Lig." : "Desl.") : `${value}`}
                />
                <Tooltip
                  contentStyle={{ background: "rgba(8,13,26,0.96)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12, color: "#e5edf8" }}
                  labelStyle={{ color: "#cbd5e1" }}
                />
                {activeTrend.lines.map((line) => (
                  <Line
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    stroke={line.color}
                    strokeWidth={2}
                    dot={false}
                    strokeDasharray={line.dashed ? "4 4" : undefined}
                    name={line.label}
                  />
                ))}
              </ReLineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">Eventos recentes</h2>
            <button className="text-xs font-bold text-status-ai hover:underline">Ver todos</button>
          </div>
          <div className="space-y-3">
            {events.map((event) => (
              <div key={`${event.time}-${event.label}`} className="flex items-center gap-3 rounded-2xl border border-border/35 bg-background/25 p-3">
                <span className={cn("grid h-8 w-8 place-items-center rounded-full border", event.tone === "warn" ? "border-status-warn/40 bg-status-warn/10 text-status-warn" : "border-primary/35 bg-primary/10 text-primary")}>
                  {event.tone === "warn" ? <AlertTriangle className="h-4 w-4" /> : <Info className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-xs font-bold text-foreground">{event.time}</p>
                  <p className="truncate text-sm text-muted-foreground">{event.label}</p>
                </div>
                <span className={cn("rounded-full border px-2 py-0.5 text-[10px]", event.tone === "warn" ? "border-status-warn/40 text-status-warn" : "border-primary/35 text-primary")}>{event.tone === "warn" ? "Atenção" : "Informação"}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-bold uppercase tracking-wide">Pontos de atenção</h2>
            <Wrench className="h-4 w-4 text-status-alert" />
          </div>
          {recommendations.length ? (
            <div className="space-y-4">
              {recommendations.map((recommendation, index) => (
                <div key={recommendation.title} className="flex gap-4">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-status-warn/40 bg-status-warn/10 font-display text-lg font-bold text-status-warn">{index + 1}</span>
                  <div>
                    <p className="font-bold text-foreground">{recommendation.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{recommendation.detail}</p>
                  </div>
                </div>
              ))}
              <button className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-status-alert/45 bg-status-alert/10 px-4 py-2.5 text-sm font-bold text-status-alert transition hover:bg-status-alert/15">
                Ver todas as recomendações
                <Settings className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex min-h-[220px] flex-col items-center justify-center text-center">
              <CheckCircle2 className="h-9 w-9 text-status-ok" />
              <p className="mt-4 font-display text-lg font-bold">Nenhuma ação crítica no momento</p>
              <p className="mt-2 max-w-[260px] text-sm text-muted-foreground">Continue monitorando pressão, bypass e operação remota das bombas.</p>
            </div>
          )}
        </div>
      </section>

      <div className="rounded-xl border border-border/55 bg-surface-2/35 px-4 py-3 text-xs text-muted-foreground">
        <Info className="mr-2 inline h-4 w-4 text-primary" />
        Os dados apresentados são baseados no período selecionado: {selectedPeriod.label} ({selectedPeriod.date}).
      </div>
    </div>
  );
}
