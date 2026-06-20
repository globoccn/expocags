import { createFileRoute } from "@tanstack/react-router";
import {
  Activity,
  AlertCircle,
  Brain,
  CircuitBoard,
  Droplets,
  Heart,
  Radio,
  ShieldAlert,
  Sparkles,
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

function Index() {
  const s = plant.summary;
  const topInsight = aiInsights[0];
  const insightChiller = chillers.find((c) => c.id === topInsight.chiller)!;
  const eventColor = (id: keyof typeof chillerTheme) =>
    ({ blue: "var(--chiller-blue)", red: "var(--chiller-red)", white: "var(--chiller-white)" })[id];

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
          <p className="text-sm text-muted-foreground">Operação em tempo real · Inteligência preditiva ativa · Dados mockados prontos para n8n</p>
        </div>
        <SeverityBadge severity={s.risk} className="text-xs" />
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        <KpiCard label="Saúde Geral" value={s.healthScore} unit="/100" icon={Heart} tone="warn" trend="↑ 2 vs ontem" />
        <KpiCard label="Risco" value="Médio" icon={ShieldAlert} tone="warn" trend="2 chillers atenção" />
        <KpiCard label="Anomalias" value={s.anomalies} icon={AlertCircle} tone="alert" trend="IA detectou" />
        <KpiCard label="Chillers Online" value={`${s.chillersOnline}/3`} icon={CircuitBoard} tone="ok" />
        <KpiCard label="Bombas Ligadas" value={`${s.pumpsOn}/12`} icon={Droplets} tone="info" />
        <KpiCard label="Compressores" value={`${s.compressorsOn}/12`} icon={Zap} tone="info" />
        <KpiCard label="Eventos" value={s.events} icon={Activity} trend="últimas 24h" />
        <KpiCard label="Comunicação" value="Online" icon={Wifi} tone="ok" trend="n8n / SCADA" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <section className="glass-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-display text-xl font-semibold">Chillers da Central</h2>
              <p className="text-xs text-muted-foreground">Três mini-cockpits com render, saúde, capacidade, temperaturas, bombas e IA.</p>
            </div>
            <span className="hidden text-xs text-muted-foreground md:block">Clique em um chiller para abrir o cockpit detalhado</span>
          </div>
          <div className="grid gap-4 2xl:grid-cols-3 xl:grid-cols-1 lg:grid-cols-3">
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
                apresenta Delta T abaixo do esperado com bypass elevado. Recomenda-se verificar a válvula bypass e a condição hidráulica do circuito.
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
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Detectado</div>
                  <div className="font-display text-sm font-semibold">{topInsight.occurredAt}</div>
                </div>
                <div className="rounded-lg border border-border/40 bg-background/30 p-3">
                  <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Status</div>
                  <div className="font-display text-sm font-semibold capitalize">{topInsight.status}</div>
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
              {events.map((e) => (
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
    </div>
  );
}
