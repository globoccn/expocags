import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { EmptyData, MetricCard, PageState, SectionTitle, StatusPill, fmtMetric } from "@/components/cag/api-render";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";

export const Route = createFileRoute("/chillers/$id")({
  head: () => ({ meta: [{ title: "Chiller — CAG Expo Center Norte" }] }),
  component: ChillerDetailPage,
});

function ChillerDetailPage() {
  const { id } = Route.useParams();
  const { payload, loading, error } = useDashboard();
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;
  const chiller = asArray(payload.chillers?.items).find((item: any) => String(item.id) === id || groupLabel(item.id).toLowerCase() === String(id).toLowerCase());
  if (!chiller) return <EmptyData label="Chiller não encontrado no payload do período." />;

  return (
    <div className="space-y-6">
      <Link to="/chillers" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary"><ArrowLeft className="h-4 w-4" /> Voltar para Chillers</Link>
      <SectionTitle title={`Chiller ${groupLabel(chiller.id)}`} subtitle="Detalhe baseado exclusivamente no payload da API." />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Status" value={chiller.status_label || chiller.status} status={chiller.status} detail={text(chiller.principal_ocorrencia)} />
        <MetricCard label="Delta T" value={fmtMetric(chiller.delta_t?.avg, " °C")} />
        <MetricCard label="Capacidade" value={fmtMetric(chiller.capacidade?.avg, "%")} />
        <MetricCard label="Horas ligado" value={fmtMetric(chiller.tempo_ligado_horas, " h")} />
        <MetricCard label="Partidas" value={fmtMetric(chiller.numero_partidas_final ?? chiller.partidas_estimadas, "", 0)} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {["A", "B"].map((key) => {
          const c = chiller.circuitos?.[key] || {};
          return (
            <div key={key} className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
              <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Circuito {key}</h2><StatusPill status={c.pressao_oleo_status} /></div>
              <div className="grid gap-3 md:grid-cols-3">
                <MetricCard label="Capacidade" value={fmtMetric(c.capacidade_avg, "%")} />
                <MetricCard label="Sucção" value={fmtMetric(c.pressao_succao_avg, " psi")} />
                <MetricCard label="Descarga" value={fmtMetric(c.pressao_descarga_avg, " psi")} />
                <MetricCard label="Óleo CP1" value={fmtMetric(c.pressao_oleo_cp1_avg, " psi")} />
                <MetricCard label="Óleo CP2" value={fmtMetric(c.pressao_oleo_cp2_avg, " psi")} />
                <MetricCard label="Ventiladores" value={fmtMetric(c.ventiladores_ligados_avg, "", 1)} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
