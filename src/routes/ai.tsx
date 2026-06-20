import { createFileRoute } from "@tanstack/react-router";
import { Brain, Sparkles, TrendingDown, TrendingUp } from "lucide-react";
import { aiInsights, chillers, chillerTheme } from "@/data/mockCagData";
import { SeverityBadge } from "@/components/cag/badges";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Análise IA — CAG Intelligence AI" }] }),
  component: AIPage,
});

function AIPage() {
  const ranking = [...chillers].sort((a, b) => a.healthScore - b.healthScore);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-status-ai">
            <Sparkles className="h-3 w-3" /> Inteligência Operacional
          </div>
          <h1 className="font-display text-3xl font-bold">
            Análise <span className="text-status-ai text-glow">IA</span>
          </h1>
          <p className="text-sm text-muted-foreground">Diagnósticos preditivos · Recomendações de ação · Ranking crítico</p>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="space-y-3 xl:col-span-2">
          <h2 className="font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Insights ativos</h2>
          {aiInsights.map((i) => {
            const theme = chillerTheme[i.chiller];
            return (
              <div key={i.id} className="glass-card overflow-hidden p-5">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-status-ai/15 text-status-ai">
                      <Brain className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-display text-base font-bold">{i.title}</h3>
                      <div className="text-[11px] uppercase tracking-wider" style={{ color: theme.hex }}>
                        {i.equipment}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <SeverityBadge severity={i.severity} />
                    <span className="text-[10px] uppercase text-muted-foreground">{i.status}</span>
                  </div>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="text-sm"><span className="text-muted-foreground">Causa provável:</span> {i.cause}</div>
                  <div className="text-sm"><span className="text-muted-foreground">Impacto:</span> {i.impact}</div>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-muted-foreground">
                    Confiança: <span className="font-mono font-semibold text-status-ai">{Math.round(i.confidence * 100)}%</span>
                  </span>
                  <span className="text-muted-foreground">· {i.occurredAt}</span>
                </div>
                <div className="mt-3 rounded-md border border-status-ai/30 bg-status-ai/5 p-2.5 text-sm">
                  <span className="font-semibold text-status-ai">Recomendação: </span>
                  {i.recommendation}
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <div className="glass-card p-5">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Ranking de Risco</h3>
            <div className="space-y-2">
              {ranking.map((c, idx) => {
                const theme = chillerTheme[c.id];
                return (
                  <div key={c.id} className="flex items-center gap-3 rounded-md border border-border/40 bg-surface-2/40 p-2.5">
                    <span className="font-display text-lg font-bold text-muted-foreground">#{idx + 1}</span>
                    <div className="flex-1">
                      <div className="text-sm font-semibold" style={{ color: theme.hex }}>{c.name}</div>
                      <div className="text-[11px] text-muted-foreground">{c.alarms} alarmes</div>
                    </div>
                    <div className="font-mono text-lg font-bold" style={{ color: theme.hex }}>{c.healthScore}</div>
                    {c.healthScore < 80 ? (
                      <TrendingDown className="h-4 w-4 text-status-alert" />
                    ) : (
                      <TrendingUp className="h-4 w-4 text-status-ok" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="glass-card p-5">
            <h3 className="mb-3 font-display text-sm font-semibold uppercase tracking-wider text-muted-foreground">Anomalias mais frequentes</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span>Delta T baixo</span><span className="font-mono text-status-alert">12×</span></div>
              <div className="flex justify-between"><span>Bypass elevado</span><span className="font-mono text-status-warn">8×</span></div>
              <div className="flex justify-between"><span>Partidas excessivas</span><span className="font-mono text-status-warn">6×</span></div>
              <div className="flex justify-between"><span>Modo Local</span><span className="font-mono text-status-info">3×</span></div>
              <div className="flex justify-between"><span>Pressão alta acima</span><span className="font-mono text-status-warn">5×</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}