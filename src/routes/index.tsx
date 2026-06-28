import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bell, Bot, CircuitBoard, Droplets, LineChart, Sparkles } from "lucide-react";
import { useDashboard, asArray, text, statusTone } from "@/lib/dashboard-context";
import { CardMetric, PageState, Panel, SectionHeader, StatusBadge, toneClass } from "@/components/cag/render-only";
import { cn } from "@/lib/utils";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home — CAG Expo Center Norte" }] }),
  component: Index,
});

const iconById: Record<string, any> = {
  chillers_operando: CircuitBoard,
  bombas_operando: Droplets,
  equipamentos_atencao: AlertTriangle,
  alarmes: Bell,
  cobertura_dados: LineChart,
};

const imageById: Record<string, string> = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite, blue: chillerBlue, red: chillerRed, white: chillerWhite };

function Index() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  if (loading || error || !payload) return state;

  const cards = asArray(payload.home?.cards);
  const chillers = asArray(payload.home?.status_chillers?.length ? payload.home?.status_chillers : payload.chillers?.items);
  const occurrences = asArray(payload.home?.ocorrencias_dia).slice(0, 5);
  const actions = asArray(payload.home?.acoes_recomendadas).slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-border/50 bg-[radial-gradient(circle_at_top_left,rgba(0,180,255,0.18),transparent_35%),linear-gradient(135deg,rgba(10,20,35,0.92),rgba(3,7,18,0.96))] p-6 shadow-[0_0_60px_rgba(0,180,255,0.08)]">
        <div className="absolute right-10 top-8 h-32 w-32 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader
            eyebrow="CAG Intelligence"
            title={text(payload.home?.title) !== "--" ? text(payload.home?.title) : "Visão Operacional da Central"}
            subtitle={text(payload.home?.subtitle) !== "--" ? text(payload.home?.subtitle) : "Resumo executivo dos chillers, bombas e ocorrências do período selecionado."}
          />
          <div className="flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-2 text-sm text-primary">
            <Sparkles className="h-4 w-4" /> Dados consolidados pelo workflow
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {cards.map((card: any) => (
          <CardMetric
            key={card.id || card.label}
            label={text(card.label)}
            value={text(card.value)}
            detail={text(card.detail)}
            status={card.status}
            icon={iconById[String(card.id || "")] || LineChart}
          />
        ))}
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel className="p-0">
          <div className="border-b border-border/40 p-4">
            <div className="font-display text-lg font-semibold">Status dos Chillers</div>
            <div className="text-xs text-muted-foreground">Resumo por equipamento no período selecionado</div>
          </div>
          <div className="grid gap-3 p-4 md:grid-cols-3">
            {chillers.map((chiller: any) => {
              const id = String(chiller.id || chiller.color || "").toLowerCase();
              const tone = statusTone(chiller.status || chiller.status_label);
              return (
                <Link key={id || chiller.name} to="/chillers" className="group rounded-2xl border border-border/50 bg-background/35 p-4 transition hover:border-primary/40 hover:bg-primary/5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-display text-base font-semibold">{text(chiller.name)}</div>
                      <div className="mt-1 text-xs text-muted-foreground">{text(chiller.principal_ocorrencia)}</div>
                    </div>
                    <StatusBadge status={chiller.status_label || chiller.status} />
                  </div>
                  <div className="mt-4 flex items-end gap-3">
                    <img src={imageById[id] || chillerBlue} alt="" className="h-24 flex-1 object-contain drop-shadow-[0_0_18px_rgba(0,180,255,0.12)]" />
                    <div className={cn("rounded-xl border px-3 py-2 text-xs", toneClass[tone])}>
                      <div>Delta T</div>
                      <div className="font-mono text-base font-bold">{text(chiller.delta_t ?? chiller.delta_t_avg)}</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Capacidade</span>
                    <span className="font-mono text-foreground">{text(chiller.capacidade ?? chiller.capacidade_avg)}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </Panel>

        <Panel className="p-0">
          <div className="border-b border-border/40 p-4">
            <div className="font-display text-lg font-semibold">Ocorrências e ações</div>
            <div className="text-xs text-muted-foreground">Itens priorizados para acompanhamento</div>
          </div>
          <div className="space-y-3 p-4">
            {occurrences.length ? occurrences.map((item: any, idx: number) => (
              <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-300" />
                  <div>
                    <div className="text-sm font-semibold">{text(item.titulo || item.title)}</div>
                    <div className="mt-1 text-xs text-muted-foreground">{text(item.detalhe || item.desc)}</div>
                  </div>
                </div>
              </div>
            )) : <div className="text-sm text-muted-foreground">Sem ocorrências relevantes.</div>}
            <div className="border-t border-border/40 pt-3">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold"><Bot className="h-4 w-4 text-primary" /> Ações recomendadas</div>
              <div className="space-y-2">
                {actions.length ? actions.map((action: any, idx: number) => (
                  <div key={idx} className="flex gap-2 text-xs text-muted-foreground"><ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />{text(action?.title || action)}</div>
                )) : <div className="text-xs text-muted-foreground">Sem ações prioritárias para o período.</div>}
              </div>
            </div>
          </div>
        </Panel>
      </div>
    </div>
  );
}
