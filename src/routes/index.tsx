import { createFileRoute } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  Brain,
  CalendarDays,
  CircuitBoard,
  Droplets,
  Gauge,
  Heart,
  Radio,
  ShieldAlert,
  Signal,
  Sparkles,
  Thermometer,
  Wifi,
  Zap,
} from "lucide-react";
import { KpiCard } from "@/components/cag/kpi-card";
import { ChillerCard } from "@/components/cag/chiller-card";
import { SeverityBadge } from "@/components/cag/badges";
import { chillers, plant, events, aiInsights, chillerTheme, type ChillerId } from "@/data/mockCagData";

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

function TinySpark({ tone = "info" }: { tone?: Tone }) {
  const cls = toneClass[tone];
  return (
    <svg viewBox="0 0 120 36" className="h-8 w-full opacity-75" preserveAspectRatio="none">
      <path d="M0,28 C14,22 18,30 31,23 C47,13 50,29 66,18 C83,6 92,22 120,10" fill="none" stroke="currentColor" strokeWidth="2" className={cls} />
      <path d="M0,28 C14,22 18,30 31,23 C47,13 50,29 66,18 C83,6 92,22 120,10 L120,36 L0,36 Z" fill="currentColor" className={cls} opacity="0.08" />
    </svg>
  );
}

function ChangeMetric({ label, value, unit, change, tone, icon: Icon }: { label: string; value: string | number; unit?: string; change: string; tone: Tone; icon?: LucideIcon }) {
  const down = change.includes("↓") || change.includes("-");
  return (
    <div className="rounded-xl border border-border/30 bg-background/35 p-3">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[9px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</div>
        {Icon && <Icon className={`h-3.5 w-3.5 ${toneClass[tone]}`} />}
      </div>
      <div className="flex items-end justify-between gap-2">
        <div className={`font-display text-2xl font-bold leading-none tabular-nums ${toneClass[tone]}`}>{value}<span className="ml-1 text-xs text-muted-foreground">{unit}</span></div>
        <div className={`rounded-full border px-2 py-0.5 text-[10px] font-bold ${down ? "border-status-crit/35 bg-status-crit/10 text-status-crit" : "border-status-ok/35 bg-status-ok/10 text-status-ok"}`}>{change}</div>
      </div>
      <div className="mt-2"><TinySpark tone={tone} /></div>
    </div>
  );
}

function ChangedPeriodPanel() {
  const avgDelta = avg(chillers.map((c) => c.deltaT));
  const avgBypass = avg(chillers.map((c) => c.hydraulic.bypassValve));
  const avgCap = avg(chillers.map((c) => c.capacityTotal));
  const avgError = avg(chillers.map((c) => c.feedTemp - c.setpoint));
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-end justify-between gap-3">
        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-wide">O que mudou no período</h3>
          <p className="text-[11px] text-muted-foreground">Comparação executiva: hoje × ontem × média de 7 dias.</p>
        </div>
        <button className="text-[11px] font-semibold text-primary hover:text-glow">Ver todos</button>
      </div>
      <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-7">
        <ChangeMetric label="Saúde Geral" value={plant.summary.healthScore} unit="/100" change="↓ 4 pts" tone="warn" icon={Heart} />
        <ChangeMetric label="ΔT médio" value={avgDelta} unit="°C" change="↓ 18%" tone="crit" icon={Thermometer} />
        <ChangeMetric label="Bypass médio" value={avgBypass} unit="%" change="↑ 42%" tone="alert" icon={Droplets} />
        <ChangeMetric label="Capacidade média" value={avgCap} unit="%" change="↑ 16%" tone="info" icon={Gauge} />
        <ChangeMetric label="Erro Setpoint" value={`+${avgError}`} unit="°C" change="↑ 100%" tone="crit" icon={ArrowUpRight} />
        <ChangeMetric label="Pressão linha" value="6.2" unit="bar" change="↓ 8%" tone="info" icon={ArrowDownRight} />
        <ChangeMetric label="Temp. externa" value="31.5" unit="°C" change="↑ 4°C" tone="info" icon={CalendarDays} />
      </div>
    </section>
  );
}

function RankingPanel() {
  const ordered = [...chillers].sort((a, b) => b.healthScore - a.healthScore);
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h3 className="font-display text-base font-bold uppercase tracking-wide">Ranking Operacional</h3>
          <p className="text-[11px] text-muted-foreground">Por saúde dos chillers</p>
        </div>
        <button className="text-[11px] font-semibold text-primary">Ver todos</button>
      </div>
      <div className="space-y-3">
        {ordered.map((c, idx) => {
          const theme = chillerTheme[c.id];
          return (
            <div key={c.id} className="grid grid-cols-[24px_1fr_54px] items-center gap-3">
              <div className={`font-display text-lg font-bold ${idx === 0 ? "text-status-alert" : idx === 1 ? "text-chiller-white" : "text-chiller-red"}`}>{idx + 1}</div>
              <div>
                <div className="mb-1 flex items-center justify-between text-sm">
                  <span className="font-semibold" style={{ color: theme.hex }}>{c.name}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-background/55 ring-1 ring-border/20">
                  <div className="h-full rounded-full" style={{ width: `${c.healthScore}%`, background: theme.hex, boxShadow: `0 0 16px ${theme.hex}` }} />
                </div>
              </div>
              <div className="text-right font-mono text-sm font-bold tabular-nums">{c.healthScore}<span className="text-[10px] text-muted-foreground">/100</span></div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function IntelligencePanel() {
  const topInsight = aiInsights[0];
  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-status-ai/25 blur-3xl" />
      <div className="relative">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-status-ai/20 text-status-ai shadow-[0_0_26px_rgba(180,80,255,.28)]"><Brain className="h-5 w-5" /></div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.26em] text-muted-foreground">Centro de Inteligência</div>
              <h3 className="font-display text-lg font-bold">Recomendação IA</h3>
            </div>
          </div>
          <SeverityBadge severity="alert" />
        </div>
        <p className="text-sm leading-relaxed text-foreground/90">
          O <span style={{ color: chillerTheme.red.hex }} className="font-semibold text-glow">Chiller Vermelho</span> concentra a maior carga, possui queda de Delta T frente à média semanal e bypass acima do padrão. O padrão sugere recirculação hidráulica ou baixa troca térmica efetiva.
        </p>
        <div className="mt-4 grid grid-cols-2 gap-2">
          <InfoBox label="Equipamento" value={topInsight.equipment} color={chillerTheme.red.hex} />
          <InfoBox label="Confiança" value="92%" color="var(--status-ai)" big />
          <InfoBox label="Causa provável" value="Recirculação hidráulica" />
          <InfoBox label="Impacto" value="Eficiência reduzida" color="var(--status-warn)" />
        </div>
        <div className="mt-4 rounded-xl border border-status-ai/35 bg-status-ai/10 p-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase text-status-ai"><Sparkles className="h-3.5 w-3.5" /> Ação sugerida</div>
          <p className="mt-2 text-sm leading-relaxed">Inspecionar válvula bypass, balanceamento hidráulico e operação das bombas.</p>
        </div>
      </div>
    </div>
  );
}

function InfoBox({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className="rounded-xl border border-border/35 bg-background/30 p-3">
      <div className="text-[9px] font-bold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className={`mt-1 font-display font-bold leading-tight ${big ? "text-xl" : "text-sm"}`} style={{ color }}>{value}</div>
    </div>
  );
}

function TrendsPanel() {
  const eventColor = (id: ChillerId) => chillerTheme[id].hex;
  return (
    <div className="glass-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-bold uppercase tracking-wide">Tendências (últimas 6 horas)</h3>
        <button className="text-[11px] font-semibold text-primary">Ver todos</button>
      </div>
      <div className="space-y-3">
        {events.slice(0, 5).map((e, i) => (
          <div key={e.id} className="grid grid-cols-[12px_46px_1fr_70px] items-center gap-2">
            <div className="h-2.5 w-2.5 rounded-full" style={{ background: eventColor(e.chiller), boxShadow: `0 0 10px ${eventColor(e.chiller)}` }} />
            <div className="font-mono text-[11px] text-muted-foreground">{e.time}</div>
            <div className="min-w-0">
              <div className="truncate text-[11px] text-muted-foreground">{chillerTheme[e.chiller].label}</div>
              <div className="truncate text-xs font-semibold">{e.text}</div>
            </div>
            <TinySpark tone={i % 2 === 0 ? "info" : e.chiller === "red" ? "crit" : "warn"} />
          </div>
        ))}
      </div>
    </div>
  );
}

function CorrelationCard({ title, subtitle, impact, chiller, tone }: { title: string; subtitle: string; impact: string; chiller: string; tone: Tone }) {
  return (
    <div className={`rounded-2xl border bg-background/28 p-4 ${tone === "crit" ? "border-status-crit/35" : tone === "alert" ? "border-status-alert/35" : "border-border/30"}`}>
      <h4 className={`font-display text-sm font-bold uppercase tracking-wide ${toneClass[tone]}`}>{title}</h4>
      <p className="mt-2 text-sm text-muted-foreground">{subtitle}</p>
      <div className="mt-2 text-xs"><span className="text-muted-foreground">Impacto: </span><span className={`font-bold ${toneClass[tone]}`}>{impact}</span></div>
      <div className="mt-2 font-display text-sm font-bold" style={{ color: chiller.includes("Vermelho") ? chillerTheme.red.hex : chiller.includes("Branco") ? chillerTheme.white.hex : chillerTheme.blue.hex }}>{chiller}</div>
    </div>
  );
}

function CorrelationsPanel() {
  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center gap-4">
        <h3 className="font-display text-base font-bold uppercase tracking-wide">Correlações Inteligentes</h3>
        <p className="text-[11px] text-muted-foreground">Relações que mais impactam a operação no período</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        <CorrelationCard title="ΔT baixo + bypass alto" subtitle="Risco de recirculação hidráulica" impact="Alto" chiller="Chiller Vermelho" tone="crit" />
        <CorrelationCard title="Temp. externa alta + carga alta" subtitle="Comportamento dentro do esperado" impact="Médio" chiller="Central" tone="ok" />
        <CorrelationCard title="Erro setpoint + carga alta" subtitle="Consumo energético elevado" impact="Alto" chiller="Chiller Vermelho" tone="crit" />
        <CorrelationCard title="Pressão abaixo do setpoint" subtitle="Risco de vazão insuficiente" impact="Médio" chiller="Bombas" tone="info" />
        <CorrelationCard title="Muitas partidas + baixa carga" subtitle="Desgaste mecânico elevado" impact="Médio" chiller="Chiller Branco" tone="warn" />
      </div>
    </section>
  );
}

function Index() {
  const s = plant.summary;
  const pumpsWithAttention = chillers.flatMap((c) => c.pumps).filter((p) => p.alarm || p.mode === "local" || p.status === "fault" || p.pressureError < -0.3).length;
  const avgDelta = avg(chillers.map((c) => c.deltaT));
  const avgBypass = avg(chillers.map((c) => c.hydraulic.bypassValve));

  return (
    <div className="home-v7 mx-auto max-w-[1920px] space-y-3.5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold uppercase tracking-[0.02em] text-glow md:text-4xl">Visão Geral da Central</h1>
          <div className="mt-1 text-[12px] font-semibold uppercase tracking-[0.22em] text-primary/85">Expo Center Norte • Home Analítica</div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden rounded-xl border border-border/35 bg-background/35 px-4 py-2 md:block">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Período</div>
            <div className="text-sm font-semibold">Hoje</div>
          </div>
          <div className="hidden rounded-xl border border-border/35 bg-background/35 px-4 py-2 md:block">
            <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground">Comparar com</div>
            <div className="text-sm font-semibold">Ontem</div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-status-ok/35 bg-status-ok/10 px-4 py-2 text-status-ok"><Signal className="h-4 w-4" /> <span className="text-sm font-bold">ONLINE</span></div>
          <div className="hidden font-mono text-sm text-muted-foreground md:block">22:47:03</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-7">
        <KpiCard label="Saúde Geral" value={s.healthScore} unit="/100" icon={Heart} tone="warn" trend="↓ 4 pts vs ontem" />
        <KpiCard label="Delta T Médio" value={avgDelta} unit="°C" icon={Thermometer} tone="info" trend="↓ 18% vs média 7d" />
        <KpiCard label="Bypass Médio" value={avgBypass} unit="%" icon={Droplets} tone="info" trend="↑ 42% vs média 7d" />
        <KpiCard label="Chillers Online" value="2/3" icon={CircuitBoard} tone="info" trend="1 em manutenção" />
        <KpiCard label="Bombas Atenção" value={pumpsWithAttention} icon={Droplets} tone="alert" trend="2 alarmes ativos" />
        <KpiCard label="Compressores" value={`${s.compressorsOn}/12`} icon={Zap} tone="info" trend="75% em operação" />
        <KpiCard label="Comunicação" value="Online" icon={Wifi} tone="ok" trend="n8n / SCADA" />
      </div>

      <div className="grid gap-3 2xl:grid-cols-[1fr_350px]">
        <section className="glass-card p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="font-display text-xl font-bold uppercase tracking-wide">Chillers da Central</h2>
              <p className="text-xs text-muted-foreground">Clique em um chiller para abrir o cockpit detalhado</p>
            </div>
          </div>
          <div className="grid gap-3 xl:grid-cols-3">
            {chillers.map((c) => <ChillerCard key={c.id} chiller={c} />)}
          </div>
        </section>

        <aside className="space-y-3">
          <IntelligencePanel />
          <TrendsPanel />
        </aside>
      </div>

      <div className="grid gap-3 2xl:grid-cols-[1.4fr_1fr]">
        <ChangedPeriodPanel />
        <RankingPanel />
      </div>

      <CorrelationsPanel />
    </div>
  );
}
