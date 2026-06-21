import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CircuitBoard,
  Droplets,
  Gauge,
  Heart,
  Radio,
  ShieldAlert,
  Sparkles,
  Thermometer,
  TrendingDown,
  TrendingUp,
  Wifi,
  Zap,
} from "lucide-react";
import { KpiCard } from "@/components/cag/kpi-card";
import { ChillerCard } from "@/components/cag/chiller-card";
import { SeverityBadge } from "@/components/cag/badges";
import { chillers, plant, events, aiInsights, chillerTheme, type ChillerData } from "@/data/mockCagData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — CAG Intelligence AI" },
      { name: "description", content: "Home analítica da Central de Água Gelada com IA." },
      { property: "og:title", content: "Visão Geral — CAG Intelligence AI" },
      { property: "og:description", content: "Home analítica da Central de Água Gelada com IA." },
    ],
  }),
  component: Index,
});

type Tone = "ok" | "info" | "warn" | "alert" | "crit" | "ai";

const toneClass: Record<Tone, string> = {
  ok: "text-status-ok",
  info: "text-status-info",
  warn: "text-status-warn",
  alert: "text-status-alert",
  crit: "text-status-crit",
  ai: "text-status-ai",
};

function avg(values: number[]) {
  return +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

function pct(current: number, base: number) {
  return +(((current - base) / base) * 100).toFixed(1);
}

function MiniBar({ label, value, max = 100, color, helper, unit = "%" }: { label: string; value: number; max?: number; color: string; helper?: string; unit?: string }) {
  const width = Math.max(4, Math.min(100, (value / max) * 100));
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="truncate text-muted-foreground">{label}</span>
        <span className="font-mono font-bold tabular-nums" style={{ color }}>
          {value}{unit}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-background/60 ring-1 ring-border/35">
        <div className="h-full rounded-full" style={{ width: `${width}%`, background: color, boxShadow: `0 0 12px ${color}` }} />
      </div>
      {helper && <div className="text-[10px] text-muted-foreground">{helper}</div>}
    </div>
  );
}

function TimeMetricCard({
  label,
  value,
  unit,
  compare,
  description,
  tone,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  compare: string;
  description: string;
  tone: Tone;
  icon: LucideIcon;
}) {
  const isDown = compare.includes("-") || compare.includes("↓");
  return (
    <div className="rounded-xl border border-border/35 bg-background/30 p-3 shadow-inner shadow-black/10">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
        <Icon className={`h-4 w-4 ${toneClass[tone]}`} />
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className={`font-display text-2xl font-bold leading-none tabular-nums ${toneClass[tone]}`}>
          {value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span>
        </div>
        <div className={`flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${isDown ? "border-status-crit/30 bg-status-crit/10 text-status-crit" : "border-status-ok/30 bg-status-ok/10 text-status-ok"}`}>
          {isDown ? <ArrowDownRight className="h-3 w-3" /> : <ArrowUpRight className="h-3 w-3" />}
          {compare}
        </div>
      </div>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{description}</p>
    </div>
  );
}

function TimeChangesPanel() {
  const worstDelta = chillers.reduce((a, b) => (a.deltaT < b.deltaT ? a : b));
  const highestBypass = chillers.reduce((a, b) => (a.hydraulic.bypassValve > b.hydraulic.bypassValve ? a : b));
  const criticalChiller = chillers.reduce((a, b) => (a.healthScore < b.healthScore ? a : b));
  const avgDelta = avg(chillers.map((c) => c.deltaT));
  const avgBypass = avg(chillers.map((c) => c.hydraulic.bypassValve));
  const avgCapacity = avg(chillers.map((c) => c.capacityTotal));
  const avgSetpointError = avg(chillers.map((c) => c.feedTemp - c.setpoint));

  return (
    <section className="glass-card p-3.5">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h3 className="font-display text-base font-semibold">O que mudou no período</h3>
          <p className="text-xs text-muted-foreground">Comparação executiva: hoje × ontem × média semanal.</p>
        </div>
        <SeverityBadge severity="warn" className="text-[10px]" />
      </div>
      <div className="grid gap-2.5 md:grid-cols-2 xl:grid-cols-3">
        <TimeMetricCard label="Saúde do pior chiller" value={criticalChiller.healthScore} unit="/100" compare="↓ 19 pts / 48h" description={`${criticalChiller.name} concentrou a maior queda de saúde no período.`} tone="warn" icon={Heart} />
        <TimeMetricCard label="Delta T médio" value={avgDelta} unit="°C" compare="↓ 18% vs 7d" description={`${worstDelta.name} está puxando a média para baixo.`} tone="crit" icon={Thermometer} />
        <TimeMetricCard label="Bypass médio" value={avgBypass} unit="%" compare="↑ 42% vs semana" description={`${highestBypass.name} apresenta maior recirculação aparente.`} tone="alert" icon={Droplets} />
        <TimeMetricCard label="Capacidade média" value={avgCapacity} unit="%" compare="↑ 11% vs ontem" description="Carga operacional maior com distribuição desigual entre chillers." tone="info" icon={Gauge} />
        <TimeMetricCard label="Erro de setpoint" value={`+${avgSetpointError}`} unit="°C" compare="↑ 0,4°C" description="Saída média acima do alvo, exigindo acompanhamento térmico." tone="warn" icon={TrendingUp} />
        <TimeMetricCard label="Partidas acumuladas" value="1284" compare="↑ 27% vs 7d" description="Preparado para receber contagem real de partidas via n8n." tone="ai" icon={Zap} />
      </div>
    </section>
  );
}

function TemporalStack({
  title,
  subtitle,
  rows,
}: {
  title: string;
  subtitle: string;
  rows: { label: string; now: number; yesterday: number; week: number; month: number; unit: string; color: string }[];
}) {
  return (
    <section className="glass-card p-3.5">
      <div className="mb-3">
        <h3 className="font-display text-sm font-semibold">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      <div className="space-y-3">
        {rows.map((r) => {
          const max = Math.max(r.now, r.yesterday, r.week, r.month, 1);
          const trend = pct(r.now, r.week);
          return (
            <div key={r.label} className="rounded-xl border border-border/30 bg-background/25 p-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold">{r.label}</span>
                <span className={trend > 0 ? "font-mono text-[11px] font-bold text-status-alert" : "font-mono text-[11px] font-bold text-status-ok"}>
                  {trend > 0 ? "+" : ""}{trend}% vs 7d
                </span>
              </div>
              <div className="grid grid-cols-4 gap-1.5 text-[9px] text-muted-foreground">
                {[
                  ["Hoje", r.now],
                  ["Ontem", r.yesterday],
                  ["7d", r.week],
                  ["30d", r.month],
                ].map(([label, value]) => (
                  <div key={label as string}>
                    <div className="mb-1 flex items-center justify-between gap-1">
                      <span>{label as string}</span>
                      <span className="font-mono text-foreground">{value as number}{r.unit}</span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-background/60">
                      <div className="h-full rounded-full" style={{ width: `${Math.max(6, ((value as number) / max) * 100)}%`, background: r.color, boxShadow: `0 0 10px ${r.color}` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CrossInsightCard({ title, finding, evidence, action, tone }: { title: string; finding: string; evidence: string; action: string; tone: Tone }) {
  return (
    <div className={`rounded-xl border bg-background/30 p-3 ${tone === "alert" ? "border-status-alert/35" : tone === "crit" ? "border-status-crit/35" : "border-status-ai/35"}`}>
      <div className="mb-2 flex items-center gap-2">
        <Brain className={`h-4 w-4 ${toneClass[tone]}`} />
        <h4 className="font-display text-sm font-semibold">{title}</h4>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{finding}</p>
      <p className="mt-2 text-[11px] leading-snug text-muted-foreground">{evidence}</p>
      <div className="mt-3 rounded-lg border border-border/30 bg-background/35 p-2 text-[11px]">
        <span className={`font-semibold ${toneClass[tone]}`}>Ação sugerida: </span>{action}
      </div>
    </div>
  );
}

function AnalyticsGrid() {
  const capTotal = chillers.reduce((sum, c) => sum + c.capacityTotal, 0);
  const rowsCapacity = chillers.map((c) => ({ label: c.name, value: Math.round((c.capacityTotal / capTotal) * 100), color: chillerTheme[c.id].hex }));
  const rowsDelta = chillers.map((c) => ({ label: c.name, value: c.deltaT, color: chillerTheme[c.id].hex }));
  const rowsBypass = chillers.map((c) => ({ label: c.name, value: c.hydraulic.bypassValve, color: chillerTheme[c.id].hex }));
  const red = chillers.find((c) => c.id === "red")!;

  return (
    <div className="grid gap-3 xl:grid-cols-[1.2fr_1fr_1fr]">
      <section className="glass-card p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Comparativo entre Chillers</h3>
            <p className="text-[11px] text-muted-foreground">Ranking instantâneo + leitura do período selecionado.</p>
          </div>
          <Gauge className="h-4 w-4 text-primary" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Carga relativa</div>
            {rowsCapacity.map((r) => <MiniBar key={r.label} label={r.label} value={r.value} color={r.color} />)}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Delta T</div>
            {rowsDelta.map((r) => <MiniBar key={r.label} label={r.label} value={r.value} max={6} color={r.color} unit="°C" />)}
          </div>
          <div className="space-y-2">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Bypass</div>
            {rowsBypass.map((r) => <MiniBar key={r.label} label={r.label} value={r.value} color={r.color} />)}
          </div>
        </div>
      </section>

      <TemporalStack
        title="Comparativo temporal"
        subtitle="Hoje, ontem, 7 dias e 30 dias. Mock pronto para receber n8n."
        rows={[
          { label: "Delta T Vermelho", now: red.deltaT, yesterday: 4.1, week: 4.4, month: 4.6, unit: "°", color: chillerTheme.red.hex },
          { label: "Bypass Vermelho", now: red.hydraulic.bypassValve, yesterday: 36, week: 31, month: 28, unit: "%", color: "var(--status-alert)" },
          { label: "Saúde Vermelho", now: red.healthScore, yesterday: 78, week: 84, month: 87, unit: "", color: chillerTheme.red.hex },
        ]}
      />

      <section className="glass-card p-3.5">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Correlação IA</h3>
            <p className="text-[11px] text-muted-foreground">Associações entre dados disponíveis.</p>
          </div>
          <Sparkles className="h-4 w-4 text-status-ai" />
        </div>
        <div className="space-y-2.5">
          <CrossInsightCard
            title="Delta T × Bypass"
            finding="Queda térmica associada a bypass elevado."
            evidence="Vermelho: Delta T 3,4°C com bypass 58%, acima da média semanal de 31%."
            action="Verificar recirculação hidráulica, válvula bypass e controle das bombas."
            tone="alert"
          />
          <CrossInsightCard
            title="Carga × Setpoint"
            finding="Capacidade alta com saída acima do setpoint."
            evidence="Vermelho opera em 82% e apresenta erro de setpoint de +0,8°C."
            action="Checar distribuição de carga e condição dos circuitos A/B."
            tone="ai"
          />
        </div>
      </section>
    </div>
  );
}

function IntelligencePanel() {
  const topInsight = aiInsights[0];
  const insightChiller = chillers.find((c) => c.id === topInsight.chiller)!;
  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-status-ai/20 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="grid h-10 w-10 place-items-center rounded-lg bg-status-ai/20 text-status-ai shadow-[0_0_20px_rgba(180,80,255,.22)]">
              <Brain className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground">Centro de Inteligência</div>
              <h3 className="font-display text-lg font-bold">Recomendação da IA</h3>
            </div>
          </div>
          <SeverityBadge severity={topInsight.severity} />
        </div>
        <p className="mb-4 text-sm leading-relaxed text-foreground/90">
          O <span style={{ color: chillerTheme.red.hex }} className="font-semibold text-glow">Chiller Vermelho</span> concentra a maior carga, possui queda de Delta T frente à média semanal e bypass acima do padrão. O padrão sugere recirculação hidráulica ou baixa troca térmica efetiva.
        </p>
        <div className="grid grid-cols-2 gap-2">
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Equipamento</div>
            <div className="font-display text-sm font-semibold" style={{ color: chillerTheme[insightChiller.id].hex }}>{topInsight.equipment}</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Confiança</div>
            <div className="font-display text-xl font-bold text-status-ai">{Math.round(topInsight.confidence * 100)}%</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Causa provável</div>
            <div className="font-display text-sm font-semibold">Bypass / hidráulica</div>
          </div>
          <div className="rounded-lg border border-border/40 bg-background/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Impacto</div>
            <div className="font-display text-sm font-semibold text-status-warn">Eficiência aparente</div>
          </div>
        </div>
        <div className="mt-4 rounded-lg border border-status-ai/30 bg-status-ai/5 p-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-status-ai">
            <Sparkles className="h-3.5 w-3.5" /> AÇÃO RECOMENDADA
          </div>
          <p className="mt-1 text-sm leading-relaxed">{topInsight.recommendation}</p>
        </div>
      </div>
    </div>
  );
}

function EventsPanel() {
  const eventColor = (id: keyof typeof chillerTheme) =>
    ({ blue: "var(--chiller-blue)", red: "var(--chiller-red)", white: "var(--chiller-white)" })[id];
  return (
    <div className="glass-card p-3.5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-sm font-semibold">Linha do Tempo Operacional</h3>
        <span className="text-[10px] text-muted-foreground">tempo real</span>
      </div>
      <div className="space-y-3">
        {events.slice(0, 6).map((e) => (
          <div key={e.id} className="relative flex gap-3">
            <div className="flex flex-col items-center">
              <div className="h-2.5 w-2.5 rounded-full ring-2 ring-background" style={{ background: eventColor(e.chiller), boxShadow: `0 0 8px ${eventColor(e.chiller)}` }} />
              <div className="mt-1 w-px flex-1 bg-border/60" />
            </div>
            <div className="flex-1 pb-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className="font-mono">{e.time}</span>
                <span className="capitalize">{chillerTheme[e.chiller].label}</span>
              </div>
              <div className="text-sm leading-snug">{e.text}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Index() {
  const s = plant.summary;
  const criticalChiller = chillers.reduce((a, b) => (a.healthScore < b.healthScore ? a : b));
  const pumpsWithAttention = chillers.flatMap((c) => c.pumps).filter((p) => p.alarm || p.mode === "local" || p.status === "fault" || p.pressureError < -0.3).length;
  const avgDelta = avg(chillers.map((c) => c.deltaT));
  const avgBypass = avg(chillers.map((c) => c.hydraulic.bypassValve));

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <Radio className="h-3 w-3 text-status-ok animate-pulse-glow" /> Home Analítica · período: Hoje
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Visão Geral da <span className="text-primary text-glow">Central</span>
          </h1>
          <p className="text-sm text-muted-foreground">Comparações temporais · correlações IA · frontend pronto para receber JSON do n8n</p>
        </div>
        <SeverityBadge severity={s.risk} className="text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Saúde Geral" value={s.healthScore} unit="/100" icon={Heart} tone="warn" trend="↓ 4 vs média 7d" />
        <KpiCard label="Chiller Crítico" value={criticalChiller.name.replace("Chiller ", "")} icon={ShieldAlert} tone="alert" trend={`${criticalChiller.healthScore}/100 saúde`} />
        <KpiCard label="Delta T Médio" value={avgDelta} unit="°C" icon={Thermometer} tone="crit" trend="↓ 18% vs semana" />
        <KpiCard label="Bypass Médio" value={avgBypass} unit="%" icon={Droplets} tone="alert" trend="↑ 42% vs semana" />
        <KpiCard label="Chillers Online" value={`${s.chillersOnline}/3`} icon={CircuitBoard} tone="ok" />
        <KpiCard label="Bombas Atenção" value={pumpsWithAttention} icon={Droplets} tone={pumpsWithAttention ? "alert" : "ok"} trend="Local/falha/pressão" />
        <KpiCard label="Compressores" value={`${s.compressorsOn}/12`} icon={Zap} tone="info" trend="partidas em análise" />
        <KpiCard label="Comunicação" value="Online" icon={Wifi} tone="ok" trend="n8n / SCADA" />
      </div>

      <div className="grid gap-3 2xl:grid-cols-[1fr_330px]">
        <section className="glass-card p-3.5">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Chillers da Central</h2>
              <p className="text-xs text-muted-foreground">Mini-cockpits com dados atuais, evolução e apontamentos IA.</p>
            </div>
            <span className="hidden text-xs text-muted-foreground md:block">Clique em um chiller para abrir o cockpit detalhado</span>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            {chillers.map((c) => <ChillerCard key={c.id} chiller={c} />)}
          </div>
          <div className="mt-3">
            <TimeChangesPanel />
          </div>
        </section>

        <aside className="space-y-3">
          <IntelligencePanel />
          <EventsPanel />
        </aside>
      </div>

      <AnalyticsGrid />
    </div>
  );
}
