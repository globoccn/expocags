import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Brain,
  CircuitBoard,
  Droplets,
  Gauge,
  Heart,
  Radio,
  ShieldAlert,
  Sparkles,
  Thermometer,
  Wifi,
  Zap,
} from "lucide-react";
import { KpiCard } from "@/components/cag/kpi-card";
import { ChillerCard } from "@/components/cag/chiller-card";
import { SeverityBadge } from "@/components/cag/badges";
import { chillers, plant, events, aiInsights, chillerTheme } from "@/data/mockCagData";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão Geral — CAG Intelligence AI" },
      { name: "description", content: "Cockpit de operação da Central de Água Gelada com IA." },
      { property: "og:title", content: "Visão Geral — CAG Intelligence AI" },
      { property: "og:description", content: "Cockpit de operação da Central de Água Gelada com IA." },
    ],
  }),
  component: Index,
});

function avg(values: number[]) {
  return +(values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
}

function MiniBar({ label, value, max = 100, color, unit = "%" }: { label: string; value: number; max?: number; color: string; unit?: string }) {
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
    </div>
  );
}

function ComparisonPanel() {
  const worstDelta = chillers.reduce((a, b) => (a.deltaT < b.deltaT ? a : b));
  const highestBypass = chillers.reduce((a, b) => (a.hydraulic.bypassValve > b.hydraulic.bypassValve ? a : b));
  const capTotal = chillers.reduce((sum, c) => sum + c.capacityTotal, 0);

  return (
    <div className="grid gap-4 xl:grid-cols-4">
      <section className="glass-card p-4 xl:col-span-2">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Comparativo dos Chillers</h3>
            <p className="text-[11px] text-muted-foreground">Saúde, capacidade, Delta T e bypass no período.</p>
          </div>
          <Gauge className="h-4 w-4 text-primary" />
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {chillers.map((c) => {
            const theme = chillerTheme[c.id];
            return (
              <div key={c.id} className="rounded-xl border border-border/35 bg-background/30 p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <div className="font-display text-sm font-bold" style={{ color: theme.hex }}>{c.name}</div>
                  <SeverityBadge severity={c.risk} className="scale-90" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-lg bg-background/40 p-2"><span className="text-muted-foreground">Saúde</span><div className="font-mono text-lg font-bold" style={{ color: theme.hex }}>{c.healthScore}</div></div>
                  <div className="rounded-lg bg-background/40 p-2"><span className="text-muted-foreground">Capacidade</span><div className="font-mono text-lg font-bold">{c.capacityTotal}%</div></div>
                  <div className="rounded-lg bg-background/40 p-2"><span className="text-muted-foreground">Delta T</span><div className={c.deltaT < 3.5 ? "font-mono text-lg font-bold text-status-crit" : "font-mono text-lg font-bold text-status-ok"}>{c.deltaT.toFixed(1)}°C</div></div>
                  <div className="rounded-lg bg-background/40 p-2"><span className="text-muted-foreground">Bypass</span><div className={c.hydraulic.bypassValve > 45 ? "font-mono text-lg font-bold text-status-alert" : "font-mono text-lg font-bold text-status-info"}>{c.hydraulic.bypassValve}%</div></div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Distribuição da Carga</h3>
            <p className="text-[11px] text-muted-foreground">Participação relativa entre os chillers.</p>
          </div>
          <Activity className="h-4 w-4 text-status-info" />
        </div>
        <div className="space-y-3">
          {chillers.map((c) => (
            <MiniBar key={c.id} label={c.name} value={Math.round((c.capacityTotal / capTotal) * 100)} color={chillerTheme[c.id].hex} />
          ))}
        </div>
      </section>

      <section className="glass-card p-4">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="font-display text-sm font-semibold">Análise Cruzada</h3>
            <p className="text-[11px] text-muted-foreground">Delta T, bypass e setpoint.</p>
          </div>
          <Brain className="h-4 w-4 text-status-ai" />
        </div>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-status-alert/30 bg-status-alert/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Maior atenção</div>
            <div className="font-display font-semibold text-status-alert">{worstDelta.name}</div>
            <p className="mt-1 text-xs text-muted-foreground">Menor Delta T: {worstDelta.deltaT.toFixed(1)}°C</p>
          </div>
          <div className="rounded-lg border border-status-ai/30 bg-status-ai/5 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Correlação provável</div>
            <div className="font-display font-semibold text-status-ai">Delta T × Bypass</div>
            <p className="mt-1 text-xs text-muted-foreground">{highestBypass.name}: bypass {highestBypass.hydraulic.bypassValve}% com Delta T {highestBypass.deltaT.toFixed(1)}°C.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function OperationalIndicators() {
  const meanSetpoint = avg(chillers.map((c) => c.setpoint));
  const meanFeed = avg(chillers.map((c) => c.feedTemp));
  const meanDelta = avg(chillers.map((c) => c.deltaT));
  const meanCap = avg(chillers.map((c) => c.capacityTotal));
  const meanBypass = avg(chillers.map((c) => c.hydraulic.bypassValve));

  return (
    <section className="glass-card p-4">
      <div className="mb-3 flex items-center gap-2">
        <Thermometer className="h-4 w-4 text-primary" />
        <h3 className="font-display text-sm font-semibold">Indicadores Operacionais do Período</h3>
      </div>
      <div className="grid gap-2 sm:grid-cols-5">
        {[
          ["Setpoint médio", meanSetpoint, "°C"],
          ["Alimentação média", meanFeed, "°C"],
          ["Delta médio", meanDelta, "°C"],
          ["Capacidade média", meanCap, "%"],
          ["Bypass médio", meanBypass, "%"],
        ].map(([label, value, unit]) => (
          <div key={label as string} className="rounded-lg border border-border/35 bg-background/30 p-3">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</div>
            <div className="mt-1 font-display text-2xl font-bold tabular-nums">
              {value as number}<span className="ml-1 text-xs text-muted-foreground">{unit}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function Index() {
  const s = plant.summary;
  const topInsight = aiInsights[0];
  const insightChiller = chillers.find((c) => c.id === topInsight.chiller)!;
  const eventColor = (id: keyof typeof chillerTheme) =>
    ({ blue: "var(--chiller-blue)", red: "var(--chiller-red)", white: "var(--chiller-white)" })[id];
  const criticalChiller = chillers.reduce((a, b) => (a.healthScore < b.healthScore ? a : b));
  const pumpsWithAttention = chillers.flatMap((c) => c.pumps).filter((p) => p.alarm || p.mode === "local" || p.status === "fault" || p.pressureError < -0.3).length;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            <Radio className="h-3 w-3 text-status-ok animate-pulse-glow" /> Cockpit Operacional
          </div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Visão Geral da <span className="text-primary text-glow">Central</span>
          </h1>
          <p className="text-sm text-muted-foreground">Operação em tempo real · Inteligência preditiva ativa · Home preparada para n8n</p>
        </div>
        <SeverityBadge severity={s.risk} className="text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Saúde Geral" value={s.healthScore} unit="/100" icon={Heart} tone="warn" trend="↑ 2 vs ontem" />
        <KpiCard label="Chiller Crítico" value={criticalChiller.name.replace("Chiller ", "")} icon={ShieldAlert} tone="alert" trend={`${criticalChiller.healthScore}/100 saúde`} />
        <KpiCard label="Anomalias" value={s.anomalies} icon={AlertCircle} tone="alert" trend="IA detectou" />
        <KpiCard label="Chillers Online" value={`${s.chillersOnline}/3`} icon={CircuitBoard} tone="ok" />
        <KpiCard label="Bombas Ligadas" value={`${s.pumpsOn}/12`} icon={Droplets} tone="info" />
        <KpiCard label="Bombas Atenção" value={pumpsWithAttention} icon={Droplets} tone={pumpsWithAttention ? "alert" : "ok"} trend="Local/falha/pressão" />
        <KpiCard label="Compressores" value={`${s.compressorsOn}/12`} icon={Zap} tone="info" />
        <KpiCard label="Comunicação" value="Online" icon={Wifi} tone="ok" trend="n8n / SCADA" />
      </div>

      <div className="grid gap-4 2xl:grid-cols-[1fr_350px]">
        <section className="glass-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Chillers da Central</h2>
              <p className="text-xs text-muted-foreground">Mini-cockpits com saúde, capacidade, temperaturas, bombas, bypass, partidas e IA.</p>
            </div>
            <span className="hidden text-xs text-muted-foreground md:block">Clique em um chiller para abrir o cockpit detalhado</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-3">
            {chillers.map((c) => (
              <ChillerCard key={c.id} chiller={c} />
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <div className="glass-card relative overflow-hidden p-5">
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
                A Central opera com atenção moderada. O{" "}
                <span style={{ color: chillerTheme.red.hex }} className="font-semibold text-glow">Chiller Vermelho</span>{" "}
                apresenta Delta T baixo associado a bypass elevado. O comportamento sugere recirculação hidráulica ou baixa troca térmica efetiva.
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

          <div className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Eventos Recentes</h3>
              <span className="text-[10px] text-muted-foreground">tempo real</span>
            </div>
            <div className="space-y-3">
              {events.slice(0, 5).map((e) => (
                <div key={e.id} className="relative flex gap-3">
                  <div className="flex flex-col items-center">
                    <div
                      className="h-2.5 w-2.5 rounded-full ring-2 ring-background"
                      style={{ background: eventColor(e.chiller), boxShadow: `0 0 8px ${eventColor(e.chiller)}` }}
                    />
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
        </aside>
      </div>

      <ComparisonPanel />
      <OperationalIndicators />
    </div>
  );
}
