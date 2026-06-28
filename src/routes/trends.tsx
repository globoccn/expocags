import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";
import { useState } from "react";
import { EmptyData, MetricCard, PageState, SectionTitle, SimpleBarChart, SimpleLineChart, fmtMetric } from "@/components/cag/api-render";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Tendências — CAG Expo Center Norte" }] }),
  component: TrendsPage,
});

const contexts = [
  { key: "agua_gelada", label: "Água Gelada" },
  { key: "capacidade", label: "Capacidade" },
  { key: "pressoes", label: "Pressões" },
  { key: "bombas", label: "Bombas" },
] as const;

function TrendsPage() {
  const { payload, loading, error } = useDashboard();
  const [ctxKey, setCtxKey] = useState<(typeof contexts)[number]["key"]>("agua_gelada");
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;

  const ctx = payload.tendencias?.contexts?.[ctxKey] || {};
  const groups = asArray(ctx.groups);
  const resumo = asArray(payload.tendencias?.resumo_automatico_periodo);

  const firstSeries = groups[0]?.series;
  const lineKeys = getKeys(ctxKey, firstSeries);

  return (
    <div className="space-y-6">
      <SectionTitle title="Tendências" subtitle="Séries renderizadas a partir de tendencias.contexts.*.groups[].series. Sem geração local de curvas." />

      <div className="flex flex-wrap gap-2">
        {contexts.map((item) => (
          <button key={item.key} type="button" onClick={() => setCtxKey(item.key)} className={cn("rounded-full border px-4 py-2 text-sm font-semibold", ctxKey === item.key ? "border-primary/50 bg-primary/20 text-primary" : "border-border/60 bg-surface-2/50 text-muted-foreground hover:text-foreground")}>{item.label}</button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Contexto" value={text(ctx.title)} detail={text(ctx.unit)} />
        <MetricCard label="Grupos recebidos" value={groups.length} detail="groups[]" />
        <MetricCard label="Período" value={text(payload.label)} detail={`${text(payload.start_date)} → ${text(payload.end_date)}`} />
      </div>

      <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
        <div className="mb-4 flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Série principal</h2></div>
        <SimpleLineChart data={firstSeries || []} keys={lineKeys} height={340} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        {groups.map((group: any) => (
          <div key={group.id} className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
            <div className="mb-4 flex items-center justify-between"><h3 className="font-display text-lg font-semibold">{groupLabel(group.id)}</h3><span className="text-xs text-muted-foreground">{text(group.name)}</span></div>
            <div className="grid gap-2 text-sm">
              {Object.entries(group)
                .filter(([key, value]) => !["id", "name", "series", "distribution"].includes(key) && typeof value !== "object")
                .map(([key, value]) => (
                  <div key={key} className="flex justify-between rounded-lg bg-background/35 px-3 py-2"><span className="text-muted-foreground">{key}</span><span className="font-mono text-foreground">{fmtMetric(value as any)}</span></div>
                ))}
            </div>
            {group.distribution?.bins && (
              <div className="mt-4">
                <SimpleBarChart data={group.distribution.bins} xKey="label" yKey="horas" height={180} />
              </div>
            )}
          </div>
        ))}
        {!groups.length && <EmptyData label="Nenhum grupo enviado em tendencias.contexts para este contexto." />}
      </div>

      <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
        <h2 className="font-display text-lg font-semibold">Resumo automático do período</h2>
        <div className="mt-3 grid gap-2 md:grid-cols-3">
          {resumo.length ? resumo.map((item: any, idx: number) => <div key={idx} className="rounded-xl border border-border/45 bg-background/35 p-3 text-sm text-muted-foreground">{text(item)}</div>) : <EmptyData />}
        </div>
      </div>
    </div>
  );
}

function getKeys(ctxKey: string, series: any[]) {
  if (ctxKey === "agua_gelada") return [{ key: "entrada", label: "Entrada" }, { key: "saida", label: "Saída" }, { key: "setpoint", label: "Setpoint" }, { key: "delta_t", label: "Delta T" }];
  if (ctxKey === "capacidade") return [{ key: "circuito_a", label: "Circuito A" }, { key: "circuito_b", label: "Circuito B" }, { key: "total", label: "Total" }];
  if (ctxKey === "pressoes") return [{ key: "succao_a", label: "Sucção A" }, { key: "descarga_a", label: "Descarga A" }, { key: "succao_b", label: "Sucção B" }, { key: "descarga_b", label: "Descarga B" }];
  const row = asArray(series)[0] || {};
  if (row.linha !== undefined || row.setpoint !== undefined) return [{ key: "linha", label: "Linha" }, { key: "setpoint", label: "Setpoint" }];
  return [{ key: "abertura", label: "Abertura" }];
}
