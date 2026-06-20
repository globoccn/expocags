import { createFileRoute } from "@tanstack/react-router";
import { BrainCircuit, CheckCircle2, TriangleAlert, XCircle } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { systemInsights } from "@/lib/cag-data";

export const Route = createFileRoute("/esg")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Análise IA" }] }),
  component: AiPage,
});

function AiPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-3xl border border-cyan-400/20 bg-slate-950/60 p-5">
          <div className="flex items-center gap-3 text-cyan-300"><BrainCircuit className="h-7 w-7"/><div><h1 className="text-2xl font-bold uppercase text-white">Análise IA</h1><p className="text-sm text-slate-400">Diagnóstico operacional baseado nos pontos disponíveis dos chillers, circuitos, bombas, temperatura externa e futuras partidas.</p></div></div>
          <div className="mt-5 rounded-2xl border border-purple-400/20 bg-purple-400/10 p-4">
            <div className="text-xs uppercase tracking-wider text-purple-200">Diagnóstico principal</div>
            <p className="mt-2 text-lg leading-7 text-white">A central está operando com atenção moderada. O Chiller Vermelho concentra o maior risco por Delta T baixo, pressão alta elevada no Circuito B e falha na Bomba Vermelha 03.</p>
            <div className="mt-3 text-sm text-slate-300">Confiança da IA: <span className="font-bold text-purple-200">86%</span></div>
          </div>
        </div>
        <section className="grid gap-4 lg:grid-cols-2">
          {systemInsights.map((i) => <div key={i.title} className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><div className="flex items-start gap-3">{i.severity === 'critical' ? <XCircle className="h-6 w-6 text-red-300"/> : i.severity === 'attention' ? <TriangleAlert className="h-6 w-6 text-yellow-300"/> : <CheckCircle2 className="h-6 w-6 text-cyan-300"/>}<div><div className="text-xs text-slate-500">{i.time} • {i.asset} • confiança {i.confidence}%</div><h3 className="mt-1 text-lg font-bold text-white">{i.title}</h3><p className="mt-2 text-sm leading-6 text-slate-300">{i.message}</p><div className="mt-3 rounded-xl border border-white/10 bg-white/[.03] p-3 text-sm text-slate-300"><b>Recomendação:</b> verificar condição operacional, comparar com histórico e priorizar inspeção do ativo afetado.</div></div></div></div>)}
        </section>
        <section className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h2 className="mb-3 text-lg font-bold uppercase">Regras previstas no Health Engine</h2><div className="grid gap-3 md:grid-cols-3"><Rule title="Chiller" items={["Delta T", "Erro de setpoint", "Pressão alta pela temp. externa", "Desbalanceamento A x B", "Partidas excessivas"]}/><Rule title="Bombas" items={["Pressão x setpoint", "Bypass elevado", "Bomba em Local", "Alarme ativo", "Bomba ligada sem pressão"]}/><Rule title="Central" items={["Ranking de criticidade", "Anomalias por ativo", "Tendência histórica", "Comparação Azul x Vermelho x Branco", "Recomendação da IA"]}/></div></section>
      </div>
    </AppShell>
  );
}
function Rule({ title, items }: { title: string; items: string[] }) { return <div className="rounded-xl border border-white/10 bg-white/[.03] p-4"><h3 className="font-semibold text-cyan-200">{title}</h3><ul className="mt-3 space-y-2 text-sm text-slate-300">{items.map(it => <li key={it}>• {it}</li>)}</ul></div> }
