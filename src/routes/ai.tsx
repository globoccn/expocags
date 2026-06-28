import { createFileRoute } from "@tanstack/react-router";
import { Bot, Brain, CheckCircle2, Sparkles, Wrench } from "lucide-react";
import { asArray, text, useDashboard } from "@/lib/dashboard-context";
import { PageState, Panel, SectionHeader, StatusBadge } from "@/components/cag/render-only";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Análise IA — CAG Expo Center Norte" }] }),
  component: AiPage,
});

function AiPage() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  if (loading || error || !payload) return state;

  const resumo = payload.assistente_ia?.resumo_periodo || {};
  const diagnosticos = asArray(payload.assistente_ia?.diagnosticos);
  const perguntas = asArray(payload.assistente_ia?.perguntas_rapidas);
  const recomendacoes = asArray(resumo.recomendacoes_prioritarias);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden rounded-3xl border border-primary/20 bg-[radial-gradient(circle_at_top_left,rgba(139,92,246,0.22),transparent_38%),linear-gradient(135deg,rgba(10,20,35,0.92),rgba(3,7,18,0.96))] p-6">
        <div className="absolute right-10 top-8 h-32 w-32 rounded-full bg-violet-400/10 blur-3xl" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <SectionHeader eyebrow="Análise IA" title="Assistente de Manutenção CAG" subtitle="Diagnósticos e recomendações estruturadas pelo workflow operacional." />
          <div className="flex items-center gap-2 rounded-full border border-violet-400/25 bg-violet-400/10 px-4 py-2 text-sm text-violet-200"><Sparkles className="h-4 w-4" /> Análise do período</div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel>
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Brain className="h-5 w-5 text-violet-300" /> Resumo do período</div>
          <div className="space-y-3 text-sm">
            <Block label="Período" value={resumo.periodo || payload.label} />
            <Block label="Equipamentos em atenção" value={asArray(resumo.equipamentos_em_atencao).join(", ") || "--"} />
            <Block label="Principais ocorrências" value={asArray(resumo.principais_ocorrencias).join(" · ") || "--"} />
          </div>
        </Panel>
        <Panel>
          <div className="mb-4 flex items-center gap-2 font-display text-lg font-semibold"><Wrench className="h-5 w-5 text-primary" /> Recomendações prioritárias</div>
          <div className="space-y-2">
            {recomendacoes.length ? recomendacoes.map((item: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(item)}</div>) : <div className="text-sm text-muted-foreground">Sem recomendações prioritárias.</div>}
          </div>
        </Panel>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {diagnosticos.map((diag: any) => (
          <Panel key={diag.id || `${diag.equipamento}-${diag.sintoma}`}>
            <div className="flex items-start justify-between gap-3">
              <div><div className="font-display text-lg font-semibold">{text(diag.sintoma)}</div><div className="mt-1 text-sm text-muted-foreground">{text(diag.equipamento)}</div></div>
              <StatusBadge status={diag.prioridade} />
            </div>
            <List title="Evidências" items={diag.evidencias} icon={<Bot className="h-4 w-4 text-primary" />} />
            <List title="Possíveis causas" items={diag.possiveis_causas} />
            <List title="Ações recomendadas" items={diag.acoes_recomendadas} icon={<CheckCircle2 className="h-4 w-4 text-emerald-300" />} />
          </Panel>
        ))}
      </div>

      {perguntas.length > 0 && (
        <Panel>
          <div className="mb-3 font-display text-lg font-semibold">Perguntas rápidas</div>
          <div className="flex flex-wrap gap-2">{perguntas.map((q: any, idx: number) => <span key={idx} className="rounded-full border border-border bg-background/35 px-3 py-1.5 text-xs text-muted-foreground">{text(q)}</span>)}</div>
        </Panel>
      )}
    </div>
  );
}

function Block({ label, value }: { label: string; value: any }) {
  return <div className="rounded-xl border border-border/45 bg-background/35 p-3"><div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div><div className="mt-1 text-sm text-foreground">{text(value)}</div></div>;
}

function List({ title, items, icon }: { title: string; items: any; icon?: any }) {
  const list = asArray(items);
  if (!list.length) return null;
  return <div className="mt-4"><div className="mb-2 flex items-center gap-2 text-sm font-semibold">{icon}{title}</div><div className="space-y-2">{list.map((item: any, idx: number) => <div key={idx} className="rounded-lg border border-border/40 bg-background/30 px-3 py-2 text-xs text-muted-foreground">{text(item)}</div>)}</div></div>;
}
