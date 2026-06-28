import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, CircuitBoard, Clock3, Gauge, ThermometerSun, Wrench } from "lucide-react";
import { useMemo, useState } from "react";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { ApiLineChart, CardMetric, PageState, Panel, SectionHeader, StatusBadge } from "@/components/cag/render-only";
import { cn } from "@/lib/utils";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "Chillers — CAG Expo Center Norte" }] }),
  component: ChillersPage,
});

const imageById: Record<string, string> = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite };
const iconByCard: Record<string, any> = { status_geral: CircuitBoard, capacidade_media: Gauge, horas_operacao: Clock3, delta_t_medio: ThermometerSun, setpoint_atingido: CheckCircle2 };

function ChillersPage() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  const chillers = asArray(payload?.chillers?.items);
  const [selected, setSelected] = useState<string>("");

  const active = useMemo(() => {
    if (!chillers.length) return null;
    return chillers.find((item: any) => item.id === selected) || chillers[0];
  }, [chillers, selected]);

  if (loading || error || !payload) return state;
  if (!active) return <Panel>Sem dados de chillers para este período.</Panel>;

  const id = String(active.id || "").toLowerCase();
  const cards = asArray(active.cards);
  const water = asArray(active.resumo_agua_gelada);
  const capacity = asArray(active.resumo_capacidade);
  const circuitos = asArray(active.circuitos_cards);
  const events = asArray(active.eventos_recentes).slice(0, 5);
  const actions = asArray(active.acoes_recomendadas).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader eyebrow="Chillers" title="Central de Água Gelada" subtitle="Resumo operacional por chiller no período selecionado." />
        <div className="flex flex-wrap gap-2">
          {chillers.map((chiller: any) => (
            <button
              key={chiller.id}
              type="button"
              onClick={() => setSelected(chiller.id)}
              className={cn(
                "rounded-full border px-4 py-2 text-sm font-semibold transition-all",
                active.id === chiller.id ? "border-primary/50 bg-primary/20 text-primary shadow-[0_0_20px_rgba(0,180,255,0.16)]" : "border-border bg-surface-2/45 text-muted-foreground hover:text-foreground",
              )}
            >
              {groupLabel(chiller.id)}
            </button>
          ))}
        </div>
      </div>

      <Panel className="overflow-hidden p-0">
        <div className="grid gap-0 lg:grid-cols-[360px_1fr]">
          <div className="relative border-b border-border/40 bg-[radial-gradient(circle_at_center,rgba(0,180,255,0.16),transparent_65%)] p-5 lg:border-b-0 lg:border-r">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-display text-2xl font-semibold">{text(active.name)}</div>
                <div className="mt-1 text-sm text-muted-foreground">{text(active.principal_ocorrencia)}</div>
              </div>
              <StatusBadge status={active.status_label || active.status} />
            </div>
            <img src={imageById[id] || chillerBlue} alt="" className="mx-auto mt-5 h-56 w-full object-contain drop-shadow-[0_0_28px_rgba(0,180,255,0.18)]" />
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-5">
            {cards.map((card: any) => (
              <CardMetric key={card.id || card.label} label={text(card.label)} value={text(card.value)} detail={text(card.detail)} status={card.status} icon={iconByCard[String(card.id)] || Gauge} />
            ))}
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Panel>
          <div className="mb-4 flex items-center justify-between"><div><div className="font-display text-lg font-semibold">Resumo Água Gelada</div><div className="text-xs text-muted-foreground">Indicadores enviados pelo workflow</div></div></div>
          <div className="grid gap-3 md:grid-cols-2">
            {water.map((item: any) => <InfoLine key={item.id || item.label} label={text(item.label)} value={text(item.value)} status={item.status} />)}
          </div>
        </Panel>
        <Panel>
          <div className="mb-4"><div className="font-display text-lg font-semibold">Capacidade</div><div className="text-xs text-muted-foreground">Distribuição operacional por circuito</div></div>
          <div className="grid gap-3 md:grid-cols-3">
            {capacity.map((item: any) => <InfoLine key={item.id || item.label} label={text(item.label)} value={text(item.value)} status={item.status} />)}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {circuitos.map((circuito: any) => (
          <Panel key={circuito.id}>
            <div className="mb-4 flex items-center justify-between"><div className="font-display text-lg font-semibold">{text(circuito.title)}</div><CircuitBoard className="h-5 w-5 text-primary" /></div>
            <div className="grid gap-3 md:grid-cols-2">
              {asArray(circuito.cards).map((card: any) => <InfoLine key={card.id || card.label} label={text(card.label)} value={text(card.value)} status={card.status} />)}
            </div>
          </Panel>
        ))}
      </div>

      <Panel>
        <div className="mb-4"><div className="font-display text-lg font-semibold">Tendência — Água Gelada</div><div className="text-xs text-muted-foreground">Série recebida do workflow para o período global</div></div>
        <ApiLineChart data={active.trends?.agua_gelada} keys={[{ key: "entrada", label: "Entrada" }, { key: "saida", label: "Saída" }, { key: "setpoint", label: "Setpoint" }, { key: "delta_t", label: "Delta T" }]} />
      </Panel>

      <div className="grid gap-4 xl:grid-cols-2">
        <Panel>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><AlertTriangle className="h-5 w-5 text-amber-300" /> Eventos Recentes</div>
          <div className="space-y-3">
            {events.map((event: any, idx: number) => <InfoLine key={event.id || idx} label={text(event.titulo || event.title)} value={text(event.detalhe || event.detail)} status={event.severidade || event.status} />)}
          </div>
        </Panel>
        <Panel>
          <div className="mb-3 flex items-center gap-2 font-display text-lg font-semibold"><Wrench className="h-5 w-5 text-primary" /> Ações Recomendadas</div>
          <div className="space-y-2">
            {actions.map((action: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(action?.title || action)}</div>)}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function InfoLine({ label, value, status }: { label: string; value: string; status?: any }) {
  return (
    <div className="rounded-xl border border-border/45 bg-background/35 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-2 font-mono text-lg font-semibold text-foreground">{value}</div>
      {status && <div className="mt-2"><StatusBadge status={status} /></div>}
    </div>
  );
}
