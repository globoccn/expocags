import { createFileRoute } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { AlertTriangle, Bell, ListChecks } from "lucide-react";
import { EmptyData, MetricCard, PageState, SectionTitle, StatusPill } from "@/components/cag/api-render";
import { asArray, text, useDashboard } from "@/lib/dashboard-context";

export const Route = createFileRoute("/alarms")({
  head: () => ({ meta: [{ title: "Alarmes — CAG Expo Center Norte" }] }),
  component: AlarmsPage,
});

function AlarmsPage() {
  const { payload, loading, error } = useDashboard();
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;

  const alarmes = payload.alarmes || {};
  const summary = alarmes.summary || {};
  const timeline = asArray(alarmes.timeline);
  const recorrentes = asArray(alarmes.recorrentes);
  const porEquipamento = asArray(alarmes.por_equipamento);
  const recomendacoes = asArray(alarmes.recomendacoes_operacionais);

  return (
    <div className="space-y-6">
      <SectionTitle title="Alarmes" subtitle="Alarmes, recorrências e recomendações são renderizados diretamente do bloco alarmes do workflow." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Ativos" value={summary.ativos} status={Number(summary.ativos) ? "atencao" : "normal"} />
        <MetricCard label="Críticos" value={summary.criticos} status={Number(summary.criticos) ? "critico" : "normal"} />
        <MetricCard label="Atenção" value={summary.atencao} status={Number(summary.atencao) ? "atencao" : "normal"} />
        <MetricCard label="Resolvidos" value={summary.resolvidos} />
        <MetricCard label="Mais recorrente" value={text(summary.mais_recorrente)} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center gap-2"><Bell className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Timeline</h2></div>
          <div className="space-y-3">
            {timeline.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text(item.source)} · {text(item.equipment)}</div>
                  <StatusPill status={item.severity} />
                </div>
                <div className="mt-2 font-semibold text-foreground">{text(item.title)}</div>
                <div className="mt-1 text-sm text-muted-foreground">{text(item.detail)}</div>
              </div>
            ))}
            {!timeline.length && <EmptyData label="Sem timeline de alarmes enviada pelo workflow." />}
          </div>
        </div>

        <div className="space-y-4">
          <Panel title="Recorrentes" icon={<AlertTriangle className="h-5 w-5 text-amber-300" />}>
            {recorrentes.length ? recorrentes.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center justify-between rounded-xl border border-border/45 bg-background/35 p-3 text-sm"><span>{text(item.title)}</span><span className="font-mono text-foreground">{text(item.count)}</span></div>
            )) : <EmptyData />}
          </Panel>

          <Panel title="Por equipamento" icon={<ListChecks className="h-5 w-5 text-primary" />}>
            {porEquipamento.length ? porEquipamento.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">{text(item.name)}</span><StatusPill status={item.status} /></div>
                <div className="mt-1 text-muted-foreground">Total: {text(item.total)}</div>
              </div>
            )) : <EmptyData />}
          </Panel>

          <Panel title="Recomendações" icon={<ListChecks className="h-5 w-5 text-primary" />}>
            {recomendacoes.length ? recomendacoes.map((item: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(item)}</div>) : <EmptyData />}
          </Panel>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  return (
    <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
      <div className="mb-4 flex items-center gap-2">{icon}<h2 className="font-display text-lg font-semibold">{title}</h2></div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}
