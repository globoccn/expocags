import { createFileRoute, Link } from "@tanstack/react-router";
import { CircuitBoard } from "lucide-react";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { CardMetric, PageState, Panel, SectionHeader, StatusBadge } from "@/components/cag/render-only";

export const Route = createFileRoute("/chillers/$id")({
  component: ChillerDetailPage,
});

function ChillerDetailPage() {
  const { id } = Route.useParams();
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  if (loading || error || !payload) return state;
  const chiller = asArray(payload.chillers?.items).find((item: any) => String(item.id) === id) || null;
  if (!chiller) return <Panel>Chiller não encontrado para este período. <Link to="/chillers" className="text-primary">Voltar</Link></Panel>;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Chiller" title={`Chiller ${groupLabel(chiller.id)}`} subtitle={text(chiller.principal_ocorrencia)} />
      <div className="flex items-center gap-3"><StatusBadge status={chiller.status_label || chiller.status} /><Link to="/chillers" className="text-sm text-primary">Voltar para Chillers</Link></div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {asArray(chiller.cards).map((card: any) => <CardMetric key={card.id || card.label} label={text(card.label)} value={text(card.value)} detail={text(card.detail)} status={card.status} icon={CircuitBoard} />)}
      </div>
    </div>
  );
}
