import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bot, CircuitBoard, Database, Droplets, AlertTriangle } from "lucide-react";
import { EmptyData, MetricCard, PageState, SectionTitle, StatusPill, fmtMetric } from "@/components/cag/api-render";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home — CAG Expo Center Norte" }] }),
  component: Index,
});

function Index() {
  const { payload, loading, error } = useDashboard();
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;

  const cards = asArray(payload.home?.cards);
  const chillers = asArray(payload.chillers?.items);
  const bombas = asArray(payload.bombas?.items);
  const issues = asArray(payload.raw_summary?.all_issues);
  const recs = asArray(payload.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <SectionTitle title="Visão Geral" subtitle="Todos os indicadores abaixo vêm diretamente do workflow operacional v2.3." />
        <div className="rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
          Cobertura {fmtMetric(payload.coverage_pct, "%", 1)}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.length ? cards.map((card: any) => (
          <MetricCard key={card.id || card.label} label={text(card.label)} value={card.value} status={card.status} />
        )) : <EmptyData label="home.cards não foi enviado pelo workflow." />}
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)] xl:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <CircuitBoard className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Chillers por grupo</h2>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            {chillers.map((chiller: any) => (
              <Link key={chiller.id} to="/chillers" className="rounded-xl border border-border/50 bg-background/35 p-4 transition hover:border-primary/40">
                <div className="flex items-center justify-between gap-2">
                  <div className="font-semibold">{groupLabel(chiller.id)}</div>
                  <StatusPill status={chiller.status_label || chiller.status} />
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="text-muted-foreground">Delta T</div><div className="font-mono">{fmtMetric(chiller.delta_t?.avg, " °C")}</div></div>
                  <div><div className="text-muted-foreground">Capacidade</div><div className="font-mono">{fmtMetric(chiller.capacidade?.avg, "%")}</div></div>
                  <div><div className="text-muted-foreground">Ligado</div><div className="font-mono">{fmtMetric(chiller.tempo_ligado_horas, " h")}</div></div>
                  <div><div className="text-muted-foreground">Ocorrência</div><div className="font-mono truncate">{text(chiller.principal_ocorrencia)}</div></div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center gap-2">
            <Droplets className="h-5 w-5 text-primary" />
            <h2 className="font-display text-lg font-semibold">Bombas</h2>
          </div>
          <div className="space-y-3">
            {bombas.map((grupo: any) => (
              <div key={grupo.id} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{groupLabel(grupo.id)}</span>
                  <StatusPill status={grupo.status_label || grupo.status} />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Pressão: <b className="font-mono text-foreground">{fmtMetric(grupo.pressao?.linha_avg, " bar")}</b></span>
                  <span>Bypass: <b className="font-mono text-foreground">{fmtMetric(grupo.bypass?.avg, "%")}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-300" /><h2 className="font-display text-lg font-semibold">Ocorrências do período</h2></div>
          <div className="space-y-3">
            {issues.slice(0, 6).map((issue: any, idx: number) => (
              <div key={`${issue.equipment_name}-${issue.title}-${idx}`} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">{text(issue.equipment_name)}</span><StatusPill status={issue.severity} /></div>
                <div className="mt-1 text-sm text-foreground">{text(issue.title)}</div>
                <div className="mt-1 text-xs text-muted-foreground">{text(issue.detail)}</div>
              </div>
            ))}
            {!issues.length && <EmptyData label="Sem ocorrências enviadas pelo workflow." />}
          </div>
        </div>

        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Ações recomendadas</h2></div>
          <div className="space-y-3">
            {recs.length ? recs.map((rec: any, idx: number) => (
              <div key={idx} className="flex items-start gap-3 rounded-xl border border-border/45 bg-background/35 p-3 text-sm">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{text(rec)}</span>
              </div>
            )) : <EmptyData label="Sem recomendações enviadas pelo workflow." />}
          </div>
        </div>
      </div>

      <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)] text-xs text-muted-foreground">
        <Database className="mr-2 inline h-4 w-4" /> Fonte: {text(payload._api?.redis_key)} · Schema {text(payload.schema_version || payload.type)}
      </div>
    </div>
  );
}
