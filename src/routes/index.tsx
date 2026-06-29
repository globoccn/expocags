import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  CircuitBoard,
  Droplets,
  Gauge,
  Info,
  LineChart as LineChartIcon,
  Sparkles,
  ThermometerSun,
} from "lucide-react";
import { type ReactNode } from "react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { Sparkline } from "@/components/cag/sparkline";
import { EnterpriseLineChart } from "@/components/cag/enterprise-line-chart";
import { cn } from "@/lib/utils";
import { homePageData, labelForPeriod, useDashboard } from "@/lib/dashboard-api";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — CAG Expo Center Norte" },
      { name: "description", content: "Centro de inteligência operacional para chillers e bombas do CAG." },
    ],
  }),
  component: Index,
});

type PeriodKey = "d1" | "week" | "month";
type Tone = "info" | "ok" | "warn" | "crit" | "ai";

type HomeKpi = {
  label: string;
  value: string;
  detail: string;
  previous: string;
  delta: string;
  deltaTone: "up" | "down" | "neutral";
  sparkline?: { i: number; v: number }[];
  icon: typeof CircuitBoard;
  tone: Tone;
};
type HomeChillerStatus = { id: "azul" | "vermelho" | "branco"; name: string; status: "Normal" | "Atenção"; hours: string; deltaT: string; capacity: string; setpoint: string; note: string; tone: Tone };

const periodConfig: Record<PeriodKey, { comparison: string }> = {
  d1: { comparison: "vs ontem anterior" },
  week: { comparison: "vs semana anterior" },
  month: { comparison: "vs mês anterior" },
};

const toneClasses: Record<Tone, { text: string; border: string; bg: string; glow: string; soft: string }> = {
  info: { text: "text-primary", border: "border-primary/20", bg: "bg-primary/[0.06]", glow: "shadow-[0_0_50px_-12px_rgba(0,180,255,0.25)]", soft: "from-primary/[0.08]" },
  ok: { text: "text-status-ok", border: "border-status-ok/20", bg: "bg-status-ok/[0.06]", glow: "shadow-[0_0_50px_-12px_oklch(0.82_0.22_150_/_0.22)]", soft: "from-status-ok/[0.07]" },
  warn: { text: "text-status-warn", border: "border-status-warn/22", bg: "bg-status-warn/[0.06]", glow: "shadow-[0_0_50px_-12px_oklch(0.88_0.2_95_/_0.22)]", soft: "from-status-warn/[0.07]" },
  crit: { text: "text-status-crit", border: "border-status-crit/22", bg: "bg-status-crit/[0.06]", glow: "shadow-[0_0_50px_-12px_oklch(0.7_0.28_22_/_0.22)]", soft: "from-status-crit/[0.07]" },
  ai: { text: "text-status-ai", border: "border-status-ai/25", bg: "bg-status-ai/[0.07]", glow: "shadow-[0_0_55px_-12px_oklch(0.75_0.24_300_/_0.28)]", soft: "from-status-ai/[0.08]" },
};

const chillerAccent = {
  azul: "oklch(0.82 0.22 230)",
  vermelho: "oklch(0.72 0.28 22)",
  branco: "oklch(0.9 0.02 240)",
};

const chillerImages = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite };

function Delta({ tone, value }: { tone: "up" | "down" | "neutral"; value: string }) {
  const clean = value && value !== "--";
  const classes = tone === "up" ? "text-status-ok" : tone === "down" ? "text-status-warn" : "text-muted-foreground";
  const symbol = tone === "up" ? "↗" : tone === "down" ? "↘" : "—";
  return <span className={cn("font-mono text-[11px] font-semibold tabular-nums", classes)}>{clean ? `${symbol} ${value}` : "—"}</span>;
}

function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = toneClasses[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-[3px] text-[9px] font-bold uppercase tracking-[0.14em]", t.border, t.bg, t.text)}>{children}</span>;
}

function KpiCard({ item }: { item: HomeKpi }) {
  const Icon = item.icon;
  const t = toneClasses[item.tone];
  const spark = Array.isArray(item.sparkline) ? item.sparkline.filter((p) => Number.isFinite(Number(p?.v))) : [];
  return (
    <article className={cn("glass-card group relative min-h-[170px] overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5", t.border, t.glow)}>
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent" />
      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-lg border", t.border, t.bg, t.text)}>
            <Icon className="h-[18px] w-[18px]" />
          </div>
          <div className={cn("rounded-full border px-2 py-[3px] text-[8.5px] font-bold uppercase tracking-[0.18em]", t.border, t.bg, t.text)}>
            Consolidado
          </div>
        </div>
        <div className="mt-3 min-w-0 flex-1">
          <div className={cn("text-[10px] font-semibold uppercase tracking-[0.18em]", t.text)}>{item.label}</div>
          <div className="mt-1.5 flex items-end gap-2">
            <span className="font-display text-[34px] font-bold leading-none tracking-tight tabular-nums text-foreground">{item.value}</span>
            <span className="mb-1 text-[11px] text-muted-foreground">{item.detail}</span>
          </div>
          <div className="mt-2 flex items-center justify-between gap-3 text-[10.5px] uppercase tracking-[0.1em] text-muted-foreground">
            <span className="truncate">{item.previous || "Período anterior"}</span>
            <Delta tone={item.deltaTone} value={item.delta} />
          </div>
        </div>
        <div className="-mx-1 mt-1.5 h-[40px] opacity-95">
          {spark.length ? <Sparkline data={spark} tone={item.tone} height={40} /> : <div className="h-full rounded-md border border-border/15" />}
        </div>
      </div>
    </article>
  );
}

function ChillerStatusCard({ item }: { item: HomeChillerStatus }) {
  const color = chillerAccent[item.id];
  const image = chillerImages[item.id];
  const isWarn = item.tone === "warn";
  return (
    <Link to="/chillers/$id" params={{ id: item.id }} className="glass-card group relative min-h-[300px] overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/40">
      <div className="pointer-events-none absolute inset-0 opacity-50" style={{ background: `radial-gradient(circle at 18% 30%, ${color.replace(")", " / 0.12)")}, transparent 45%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: color, boxShadow: `0 0 10px ${color}` }} />
          <div className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-foreground/90">{item.name}</div>
        </div>
        <StatusPill tone={item.tone}>{item.status}</StatusPill>
      </div>
      <div className="relative mt-5 h-44 overflow-visible rounded-xl border border-border/20 bg-black/15">
        <div className="absolute inset-0 rounded-xl opacity-55" style={{ background: `radial-gradient(circle at 50% 55%, ${color.replace(")", " / 0.22)")}, transparent 70%)` }} />
        <div className="absolute inset-x-3 bottom-3 h-8 rounded-[50%] bg-black/40 blur-md" />
        <img src={image} alt={item.name} className="absolute left-1/2 top-1/2 z-10 h-[190px] w-[132%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_18px_28px_rgba(0,0,0,0.65)] transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-border/25 pt-4">
        <div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Capacidade</span><strong className="mt-1 block font-display text-xl font-bold tabular-nums text-foreground">{item.capacity}</strong></div>
        <div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Delta T</span><strong className={cn("mt-1 block font-display text-xl font-bold tabular-nums", isWarn ? "text-status-crit" : "text-foreground")}>{item.deltaT}</strong></div>
        <div><span className="text-[10px] font-medium uppercase tracking-[0.12em] text-muted-foreground">Setpoint</span><strong className={cn("mt-1 block font-display text-xl font-bold tabular-nums", isWarn ? "text-status-crit" : "text-foreground")}>{item.setpoint}</strong></div>
      </div>
    </Link>
  );
}

function UnifiedEvolutionChart({ data }: { data: any[] }) {
  return (
    <section className="glass-card overflow-hidden p-5 shadow-[0_0_70px_oklch(0.78_0.2_220_/_0.10)]">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Evolução dos principais indicadores</h2>
          <p className="text-sm text-muted-foreground">Visão unificada do período selecionado</p>
        </div>
      </div>
      <EnterpriseLineChart
        data={data}
        height={430}
        leftDomain={[0, 100]}
        rightDomain={[0, 45]}
        leftUnit="%"
        rightUnit="°C"
        showLegend
        showFooterStats
        series={[
          { key: "capacidade_media", label: "Capacidade média", unit: "%", axis: "left", tone: "cyan", fill: true },
          { key: "delta_t_medio", label: "Delta T", unit: "°C", axis: "right", tone: "pink", fill: true },
          { key: "temperatura_externa", label: "Temp. externa", unit: "°C", axis: "right", tone: "yellow", fill: true },
          { key: "cobertura_leituras", label: "Cobertura", unit: "%", axis: "left", tone: "green", dashed: true },
        ]}
      />
    </section>
  );
}

function Index() {
  const { period, payload } = useDashboard();
  const cfg = { ...periodConfig[period], ...labelForPeriod(payload, period) };
  const data = homePageData(payload, period, { CircuitBoard, Gauge, AlertTriangle, ThermometerSun, Droplets });

  return (
    <div className="relative space-y-5 overflow-hidden pb-2">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-status-ai/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-40 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </section>

      <div className="flex items-center gap-2 rounded-xl border border-border/50 bg-background/30 px-4 py-3 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary" />
        Dados consolidados do período selecionado: <span className="text-foreground/80">{cfg.label} ({cfg.date})</span>.
      </div>

      <section className="glass-card overflow-hidden p-4">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold">Situação da Central</h2>
            <p className="text-sm text-muted-foreground">Resumo dos chillers no período analisado</p>
          </div>
          <Link to="/chillers" className="hidden items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 md:inline-flex">
            Ver detalhes dos chillers <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {data.chillers.map((item: any) => <ChillerStatusCard key={item.id} item={item} />)}
        </div>
      </section>

      <UnifiedEvolutionChart data={data.evolution} />

      <section className="glass-card relative overflow-hidden border-status-ai/45 p-5 shadow-[0_0_42px_oklch(0.75_0.24_300_/_0.14)]">
        <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-status-ai/20 blur-3xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl border border-status-ai/40 bg-status-ai/15 text-status-ai"><Sparkles className="h-5 w-5" /></div>
            <div>
              <h2 className="font-display text-base font-bold uppercase tracking-wide">Precisa entender melhor algum comportamento?</h2>
              <p className="text-sm text-muted-foreground">Converse com o Assistente IA para investigar ocorrências, tendências e relações entre clima, carga e operação.</p>
            </div>
          </div>
          <Link to="/ai" className="inline-flex items-center justify-center gap-2 rounded-xl border border-status-ai/45 bg-status-ai/12 px-5 py-3 font-display text-sm font-bold text-status-ai shadow-[0_0_28px_oklch(0.75_0.24_300_/_0.16)] hover:bg-status-ai/18">
            Abrir Assistente IA <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>
    </div>
  );
}
