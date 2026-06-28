import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Bell, CheckCircle2, Clock3, ListChecks } from "lucide-react";
import { asArray, text, useDashboard } from "@/lib/dashboard-context";
import { CardMetric, PageState, Panel, SectionHeader, StatusBadge } from "@/components/cag/render-only";

export const Route = createFileRoute("/alarms")({
  head: () => ({ meta: [{ title: "Alarmes — CAG Expo Center Norte" }] }),
  component: AlarmsPage,
});

function AlarmsPage() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  if (loading || error || !payload) return state;

  const alarmes = payload.alarmes || {};
  const summary = alarmes.summary || {};
  const cards = asArray(alarmes.cards);
  const timeline = asArray(alarmes.timeline);
  const recurrence = asArray(alarmes.recorrentes);
  const equipment = asArray(alarmes.por_equipamento);
  const recommendations = asArray(alarmes.recomendacoes_operacionais);

  const fallbackCards = [
    { id: "ativos", label: "Ativos", value: summary.ativos, status: summary.ativos ? "atencao" : "normal", icon: Bell },
    { id: "criticos", label: "Críticos", value: summary.criticos, status: summary.criticos ? "critico" : "normal", icon: AlertTriangle },
    { id: "atencao", label: "Atenção", value: summary.atencao, status: summary.atencao ? "atencao" : "normal", icon: ListChecks },
    { id: "resolvidos", label: "Resolvidos", value: summary.resolvidos, status: "normal", icon: CheckCircle2 },
  ];
  const visualCards = cards.length ? cards : fallbackCards;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Alarmes" title="Central de Ocorrências" subtitle="Eventos e recorrências enviados pelo workflow operacional." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {visualCards.map((card: any) => <CardMetric key={card.id || card.label} label={text(card.label)} value={text(card.value)} detail={text(card.detail)} status={card.status} icon={card.icon || Bell} />)}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel>
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Clock3 className="h-5 w-5 text-primary" /> Linha do tempo</div>
          <div className="space-y-3">
            {timeline.length ? timeline.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex items-start justify-between gap-3"><div><div className="text-sm font-semibold">{text(item.title || item.titulo)}</div><div className="mt-1 text-xs text-muted-foreground">{text(item.equipment || item.equipamento)} · {text(item.detail || item.detalhe)}</div></div><StatusBadge status={item.severity || item.severidade} /></div>
              </div>
            )) : <div className="text-sm text-muted-foreground">Sem alarmes no período.</div>}
          </div>
        </Panel>

        <div className="space-y-4">
          <Panel>
            <div className="mb-4 font-display text-lg font-semibold">Mais recorrentes</div>
            <div className="space-y-2">{recurrence.length ? recurrence.map((item: any, idx: number) => <Row key={idx} left={item.title} right={item.count} status={item.severity} />) : <div className="text-sm text-muted-foreground">Sem recorrências.</div>}</div>
          </Panel>
          <Panel>
            <div className="mb-4 font-display text-lg font-semibold">Por equipamento</div>
            <div className="space-y-2">{equipment.map((item: any, idx: number) => <Row key={idx} left={item.name} right={item.total} status={item.status} />)}</div>
          </Panel>
        </div>
      </div>

      <Panel>
        <div className="mb-4 font-display text-lg font-semibold">Recomendações operacionais</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{recommendations.length ? recommendations.map((item: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(item)}</div>) : <div className="text-sm text-muted-foreground">Sem recomendações prioritárias.</div>}</div>
      </Panel>
    </div>
  );
}

function Row({ left, right, status }: { left: any; right: any; status?: any }) {
  return <div className="flex items-center justify-between gap-3 rounded-xl border border-border/45 bg-background/35 px-3 py-2 text-sm"><span className="text-muted-foreground">{text(left)}</span><div className="flex items-center gap-2"><span className="font-mono text-foreground">{text(right)}</span>{status && <StatusBadge status={status} />}</div></div>;
}
