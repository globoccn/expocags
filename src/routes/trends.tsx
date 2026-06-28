import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, CircleGauge, Droplets, Gauge, ThermometerSun } from "lucide-react";
import { useState } from "react";
import { asArray, text, useDashboard } from "@/lib/dashboard-context";
import { ApiBarChart, ApiLineChart, CardMetric, PageState, Panel, SectionHeader } from "@/components/cag/render-only";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Tendências — CAG Expo Center Norte" }] }),
  component: TrendsPage,
});

const tabs = [
  { key: "agua_gelada", label: "Água Gelada", icon: ThermometerSun, keys: [{ key: "entrada", label: "Entrada" }, { key: "saida", label: "Saída" }, { key: "setpoint", label: "Setpoint" }, { key: "delta_t", label: "Delta T" }] },
  { key: "capacidade", label: "Capacidade", icon: CircleGauge, keys: [{ key: "total", label: "Total" }, { key: "circuito_a", label: "Circuito A" }, { key: "circuito_b", label: "Circuito B" }] },
  { key: "pressoes", label: "Pressões", icon: Gauge, keys: [{ key: "succao_a", label: "Sucção A" }, { key: "descarga_a", label: "Descarga A" }, { key: "succao_b", label: "Sucção B" }, { key: "descarga_b", label: "Descarga B" }] },
  { key: "bombas", label: "Bombas", icon: Droplets, keys: [{ key: "linha", label: "Linha" }, { key: "setpoint", label: "Setpoint" }, { key: "abertura", label: "Bypass" }] },
];

function TrendsPage() {
  const { payload, loading, error } = useDashboard();
  const state = <PageState loading={loading} error={error} />;
  const [tab, setTab] = useState("agua_gelada");
  if (loading || error || !payload) return state;

  const current = tabs.find((item) => item.key === tab) || tabs[0];
  const context = payload.tendencias?.contexts?.[current.key] || {};
  const groups = asArray(context.groups);
  const summary = asArray(payload.tendencias?.resumo_automatico_periodo);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <SectionHeader eyebrow="Tendências" title="Leitura consolidada do período" subtitle="Séries e distribuições recebidas diretamente do workflow operacional." />
        <div className="flex flex-wrap gap-2">{tabs.map((item) => <button key={item.key} type="button" onClick={() => setTab(item.key)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold transition-all", tab === item.key ? "border-primary/50 bg-primary/20 text-primary" : "border-border bg-surface-2/45 text-muted-foreground hover:text-foreground")}><item.icon className="mr-2 inline h-4 w-4" />{item.label}</button>)}</div>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {groups.map((group: any) => <CardMetric key={group.id || group.name} label={text(group.name)} value={text(group.delta_t ?? group.total ?? group.pressao_linha ?? group.capacidade_avg)} detail={text(context.unit)} status={group.status} icon={BarChart3} />)}
      </div>

      <Panel>
        <div className="mb-4"><div className="font-display text-lg font-semibold">{text(context.title || current.label)}</div><div className="text-xs text-muted-foreground">Comparativo por grupo</div></div>
        <div className="grid gap-5">
          {groups.map((group: any) => <div key={group.id || group.name} className="rounded-2xl border border-border/45 bg-background/25 p-4"><div className="mb-3 font-semibold">{text(group.name)}</div><ApiLineChart data={group.series?.pressao || group.series?.bypass || group.series} keys={current.keys} height={220} /></div>)}
        </div>
      </Panel>

      <div className="grid gap-4 xl:grid-cols-[1fr_0.9fr]">
        <Panel><div className="mb-4 font-display text-lg font-semibold">Distribuição</div>{groups[0]?.distribution?.bins ? <ApiBarChart data={groups[0].distribution.bins} /> : <div className="text-sm text-muted-foreground">Distribuição não disponível para este contexto.</div>}</Panel>
        <Panel><div className="mb-4 font-display text-lg font-semibold">Resumo automático</div><div className="space-y-2">{summary.map((item: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(item)}</div>)}</div></Panel>
      </div>
    </div>
  );
}
