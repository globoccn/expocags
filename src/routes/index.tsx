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
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { chartColors, tooltipStyle } from "@/components/cag/chart-wrap";
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

type HomeKpi = { label: string; value: string; detail: string; previous: string; delta: string; deltaTone: "up" | "down" | "neutral"; icon: typeof CircuitBoard; tone: Tone };
type HomeChillerStatus = { id: "azul" | "vermelho" | "branco"; name: string; status: "Normal" | "Atenção"; hours: string; deltaT: string; capacity: string; setpoint: string; note: string; tone: Tone };

const periodConfig: Record<PeriodKey, { comparison: string }> = {
  d1: { comparison: "vs ontem anterior" },
  week: { comparison: "vs semana anterior" },
  month: { comparison: "vs mês anterior" },
};

const toneClasses: Record<Tone, { text: string; border: string; bg: string; glow: string; soft: string }> = {
  info: { text: "text-primary", border: "border-primary/35", bg: "bg-primary/10", glow: "shadow-[0_0_34px_rgba(0,180,255,0.16)]", soft: "from-primary/22" },
  ok: { text: "text-status-ok", border: "border-status-ok/35", bg: "bg-status-ok/10", glow: "shadow-[0_0_34px_oklch(0.82_0.22_150_/_0.12)]", soft: "from-status-ok/18" },
  warn: { text: "text-status-warn", border: "border-status-warn/35", bg: "bg-status-warn/10", glow: "shadow-[0_0_34px_oklch(0.88_0.2_95_/_0.12)]", soft: "from-status-warn/20" },
  crit: { text: "text-status-crit", border: "border-status-crit/35", bg: "bg-status-crit/10", glow: "shadow-[0_0_34px_oklch(0.7_0.28_22_/_0.12)]", soft: "from-status-crit/18" },
  ai: { text: "text-status-ai", border: "border-status-ai/40", bg: "bg-status-ai/10", glow: "shadow-[0_0_40px_oklch(0.75_0.24_300_/_0.16)]", soft: "from-status-ai/22" },
};

const chillerAccent = {
  azul: "oklch(0.82 0.22 230)",
  vermelho: "oklch(0.72 0.28 22)",
  branco: "oklch(0.9 0.02 240)",
};

const chillerImages = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite };

function Delta({ tone, value }: { tone: "up" | "down" | "neutral"; value: string }) {
  const classes = tone === "up" ? "text-status-ok" : tone === "down" ? "text-status-ok" : "text-muted-foreground";
  const symbol = tone === "up" ? "▲" : tone === "down" ? "▼" : "—";
  return <span className={cn("font-mono font-semibold", classes)}>{symbol} {value}</span>;
}

function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = toneClasses[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2 py-1 text-[10px] font-bold", t.border, t.bg, t.text)}>{children}</span>;
}

function KpiCard({ item }: { item: HomeKpi }) {
  const Icon = item.icon;
  const t = toneClasses[item.tone];
  return (
    <article className={cn("glass-card group relative min-h-[138px] overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5", t.border, t.glow)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70", t.soft)} />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-current opacity-[0.08] blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl border", t.border, t.bg, t.text)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("text-[10px] font-bold uppercase tracking-[0.14em]", t.text)}>{item.label}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl font-bold leading-none tracking-tight tabular-nums">{item.value}</span>
            <span className="mb-1 text-sm text-muted-foreground">{item.detail}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/35 pt-2 text-[11px] text-muted-foreground">
            <span>{item.previous}</span>
            <Delta tone={item.deltaTone} value={item.delta} />
          </div>
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
    <Link to="/chillers/$id" params={{ id: item.id }} className="group relative min-h-[300px] overflow-hidden rounded-xl border border-border/45 bg-surface-2/35 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 18% 38%, ${color.replace(")", " / 0.26)")}, transparent 36%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <div className="font-display text-sm font-bold uppercase tracking-wide">{item.name}</div>
        </div>
        <StatusPill tone={item.tone}>{item.status}</StatusPill>
      </div>
      <div className="relative mt-5 h-40 overflow-visible rounded-xl border border-border/35 bg-black/20">
        <div className="absolute inset-0 rounded-xl opacity-70" style={{ background: `radial-gradient(circle at 50% 52%, ${color.replace(")", " / 0.34)")}, transparent 72%)` }} />
        <div className="absolute inset-x-3 bottom-4 h-7 rounded-[50%] bg-black/35 blur-sm" />
        <img src={image} alt={item.name} className="absolute left-1/2 top-1/2 z-10 h-[150px] w-[112%] max-w-none -translate-x-1/2 -translate-y-1/2 object-contain drop-shadow-[0_16px_24px_rgba(0,0,0,0.62)] transition-transform duration-500 group-hover:scale-[1.04]" />
      </div>
      <div className="relative mt-5 grid grid-cols-3 gap-3 border-t border-border/35 pt-4 text-xs">
        <div><span className="text-muted-foreground">Capacidade média</span><strong className="mt-1 block text-xl text-foreground">{item.capacity}</strong></div>
        <div><span className="text-muted-foreground">Delta T médio</span><strong className={cn("mt-1 block text-xl", isWarn ? "text-status-crit" : "text-foreground")}>{item.deltaT}</strong></div>
        <div><span className="text-muted-foreground">Setpoint atingido</span><strong className={cn("mt-1 block text-xl", isWarn ? "text-status-crit" : "text-foreground")}>{item.setpoint}</strong></div>
      </div>
    </Link>
  );
}

function UnifiedEvolutionChart({ data }: { data: any[] }) {
  return (
    <section className="glass-card overflow-hidden p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">Evolução dos principais indicadores</h2>
          <p className="text-sm text-muted-foreground">Visão unificada do período selecionado</p>
        </div>
        <div className="flex flex-wrap gap-2 text-[11px] text-muted-foreground">
          <span className="rounded-full border border-primary/35 bg-primary/10 px-3 py-1.5 text-primary">Capacidade média utilizada (%)</span>
          <span className="rounded-full border border-status-crit/35 bg-status-crit/10 px-3 py-1.5 text-status-crit">Delta T médio (°C)</span>
          <span className="rounded-full border border-status-warn/35 bg-status-warn/10 px-3 py-1.5 text-status-warn">Temperatura externa (°C)</span>
          <span className="rounded-full border border-status-ok/35 bg-status-ok/10 px-3 py-1.5 text-status-ok">Cobertura das leituras (%)</span>
        </div>
      </div>
      <div className="h-[430px] w-full">
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 15, right: 24, left: -8, bottom: 5 }}>
            <CartesianGrid stroke={chartColors.grid} strokeOpacity={0.55} vertical />
            <XAxis dataKey="x" stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} />
            <YAxis yAxisId="pct" domain={[0, 100]} stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
            <YAxis yAxisId="temp" orientation="right" domain={[0, 45]} stroke={chartColors.muted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}°C`} />
            <Tooltip contentStyle={tooltipStyle} formatter={(value: any, name: any) => [value === null || value === undefined ? "--" : `${Number(value).toLocaleString("pt-BR", { maximumFractionDigits: 1 })}${String(name).includes("Capacidade") || String(name).includes("Cobertura") ? "%" : "°C"}`, name]} />
            <Line yAxisId="pct" type="monotone" dataKey="capacidade_media" name="Capacidade média utilizada" stroke="#38bdf8" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="temp" type="monotone" dataKey="delta_t_medio" name="Delta T médio" stroke="#fb2d5c" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="temp" type="monotone" dataKey="temperatura_externa" name="Temperatura externa" stroke="#facc15" strokeWidth={2.4} dot={false} activeDot={{ r: 4 }} />
            <Line yAxisId="pct" type="monotone" dataKey="cobertura_leituras" name="Cobertura das leituras" stroke="#22c55e" strokeWidth={2} strokeDasharray="5 5" dot={false} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
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
          {data.chillers.map((item) => <ChillerStatusCard key={item.id} item={item} />)}
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
