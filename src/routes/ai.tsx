import { createFileRoute } from "@tanstack/react-router";
import { Bot, Sparkles } from "lucide-react";
import { EmptyData, MetricCard, PageState, SectionTitle, StatusPill } from "@/components/cag/api-render";
import { asArray, text, useDashboard } from "@/lib/dashboard-context";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Análise IA — CAG Expo Center Norte" }] }),
  component: AiPage,
});

function AiPage() {
  const { payload, loading, error } = useDashboard();
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;

  const ia = payload.assistente_ia || {};
  const resumo = ia.resumo_periodo || {};
  const diagnosticos = asArray(ia.diagnosticos);
  const recomendacoes = asArray(resumo.recomendacoes_prioritarias);
  const equipamentos = asArray(resumo.equipamentos_em_atencao);
  const ocorrencias = asArray(resumo.principais_ocorrencias);

  return (
    <div className="space-y-6">
      <SectionTitle title="Análise IA" subtitle="Diagnósticos estruturados enviados pelo workflow. A frontend não cria diagnóstico nem causa provável." />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Período analisado" value={text(resumo.periodo || payload.label)} detail="payload.assistente_ia" />
        <MetricCard label="Equipamentos em atenção" value={equipamentos.length} detail={equipamentos.slice(0, 2).join(" · ") || "--"} status={equipamentos.length ? "atencao" : "normal"} />
        <MetricCard label="Diagnósticos" value={diagnosticos.length} detail="Itens recebidos" status={diagnosticos.some((d: any) => String(d.prioridade).includes("crit")) ? "critico" : diagnosticos.length ? "atencao" : "normal"} />
        <MetricCard label="Ocorrências principais" value={ocorrencias.length} detail="Resumo do período" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
          <div className="mb-4 flex items-center gap-2"><Bot className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Diagnósticos</h2></div>
          <div className="space-y-4">
            {diagnosticos.map((diag: any, idx: number) => (
              <div key={diag.id || idx} className="rounded-xl border border-border/45 bg-background/35 p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">{text(diag.equipamento)}</div>
                    <div className="mt-1 font-semibold text-foreground">{text(diag.sintoma)}</div>
                  </div>
                  <StatusPill status={diag.prioridade} />
                </div>
                <div className="mt-4 grid gap-4 md:grid-cols-3">
                  <ListBlock title="Evidências" items={diag.evidencias} />
                  <ListBlock title="Possíveis causas" items={diag.possiveis_causas} />
                  <ListBlock title="Ações recomendadas" items={diag.acoes_recomendadas} />
                </div>
                <p className="mt-3 text-xs text-muted-foreground">{text(diag.limite || diag.observacao)}</p>
              </div>
            ))}
            {!diagnosticos.length && <EmptyData label="Sem diagnósticos enviados pelo workflow." />}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
            <div className="mb-4 flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Recomendações prioritárias</h2></div>
            <ListBlock items={recomendacoes} />
          </div>
          <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
            <h2 className="font-display text-lg font-semibold">Ocorrências principais</h2>
            <ListBlock items={ocorrencias} />
          </div>
          <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
            <h2 className="font-display text-lg font-semibold">Equipamentos em atenção</h2>
            <ListBlock items={equipamentos} />
          </div>
        </div>
      </div>
    </div>
  );
}

function ListBlock({ title, items }: { title?: string; items: any }) {
  const arr = asArray(items);
  return (
    <div>
      {title && <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">{title}</div>}
      <ul className="space-y-2 text-sm text-muted-foreground">
        {arr.length ? arr.map((item: any, idx: number) => <li key={idx} className="rounded-lg bg-white/5 px-3 py-2">{text(item)}</li>) : <li className="rounded-lg bg-white/5 px-3 py-2">--</li>}
      </ul>
    </div>
  );
}
