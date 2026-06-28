import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Droplets, Gauge, Power, Settings2, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { ApiLineChart, CardMetric, PageState, Panel, SectionHeader, StatusBadge } from "@/components/cag/render-only";
import { cn } from "@/lib/utils";
import pumpBlue from "@/assets/pump-blue.png";
import pumpRed from "@/assets/pump-red.png";
import pumpWhite from "@/assets/pump-white.png";

export const Route = createFileRoute("/pumps")({
  head: () => ({ meta: [{ title: "Bombas — CAG Expo Center Norte" }] }),
  component: PumpsPage,
});

const imageById: Record<string, string> = { azul: pumpBlue, vermelho: pumpRed, branco: pumpWhite };
const iconByCard: Record<string, any> = { status_geral: Droplets, pressao_linha: Gauge, bypass: Settings2, bombas_ligadas: Power, alarmes: AlertTriangle };

function PumpsPage() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  const groups = asArray(payload?.bombas?.items);
  const [selected, setSelected] = useState<string>("");
  const active = useMemo(() => groups.find((item: any) => item.id === selected) || groups[0] || null, [groups, selected]);

  if (loading || error || !payload) return state;
  if (!active) return <Panel>Sem dados de bombas para este período.</Panel>;

  const id = String(active.id || "").toLowerCase();
  const cards = asArray(active.cards);
  const pumps = asArray(active.bombas);
  const events = asArray(active.eventos_recentes).slice(0, 5);
  const actions = asArray(active.acoes_recomendadas).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader eyebrow="Bombas" title="Grupos de Bombas de Água Gelada" subtitle="Operação hidráulica por grupo no período selecionado." />
        <div className="flex flex-wrap gap-2">
          {groups.map((group: any) => (
            <button key={group.id} type="button" onClick={() => setSelected(group.id)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-all", active.id === group.id ? "border-primary/50 bg-primary/20 text-primary" : "border-border bg-surface-2/45 text-muted-foreground hover:text-foreground")}>{groupLabel(group.id)}</button>
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
          <div className="relative border-b border-border/40 bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.16),transparent_65%)] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-display text-2xl font-semibold">{text(active.name)}</div><div className="mt-1 text-sm text-muted-foreground">{text(active.principal_ocorrencia)}</div></div>
              <StatusBadge status={active.status_label || active.status} />
            </div>
            <img src={imageById[id] || pumpBlue} alt="" className="mx-auto mt-5 h-56 w-full object-contain drop-shadow-[0_0_28px_rgba(0,180,255,0.18)]" />
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card: any) => <CardMetric key={card.id || card.label} label={text(card.label)} value={text(card.value)} detail={text(card.detail)} status={card.status} icon={iconByCard[String(card.id)] || Gauge} />)}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-4">
        {pumps.map((pump: any) => (
          <Panel key={pump.id || pump.name}>
            <div className="flex items-center justify-between"><div className="font-display text-lg font-semibold">{text(pump.name)}</div><StatusBadge status={pump.status} /></div>
            <div className="mt-4 space-y-2 text-sm">
              <Line label="Estado" value={pump.estado_atual} />
              <Line label="Modo" value={pump.modo_atual} />
              <Line label="Horas ligada" value={pump.horas_ligada} />
              <Line label="Partidas" value={pump.partidas_estimadas} />
            </div>
          </Panel>
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel><div className="mb-4 font-display text-lg font-semibold">Pressão da Linha</div><ApiLineChart data={active.trends?.pressao} keys={[{ key: "linha", label: "Linha" }, { key: "setpoint", label: "Setpoint" }]} /></Panel>
        <Panel><div className="mb-4 font-display text-lg font-semibold">Bypass</div><ApiLineChart data={active.trends?.bypass} keys={[{ key: "abertura", label: "Abertura" }]} /></Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-amber-300" /> Eventos Recentes</div>
          <div className="space-y-3">{events.map((event: any, idx: number) => <Line key={event.id || idx} label={event.titulo || event.title} value={event.detalhe || event.detail} />)}</div>
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Wrench className="h-5 w-5 text-primary" /> Ações Recomendadas</div>
          <div className="space-y-2">{actions.map((action: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(action?.title || action)}</div>)}</div>
        </Panel>
      </div>
    </div>
  );
}

function Line({ label, value }: { label: any; value: any }) {
  return <div className="flex items-start justify-between gap-3 rounded-xl border border-border/45 bg-background/35 px-3 py-2"><span className="text-muted-foreground">{text(label)}</span><span className="text-right font-mono text-foreground">{text(value)}</span></div>;
}
