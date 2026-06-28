import { createFileRoute } from "@tanstack/react-router";
import { CircuitBoard, Thermometer } from "lucide-react";
import { useMemo, useState } from "react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { EmptyData, MetricCard, PageState, SectionTitle, SimpleLineChart, StatusPill, fmtMetric } from "@/components/cag/api-render";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "Chillers — CAG Expo Center Norte" }] }),
  component: ChillersPage,
});

const images: Record<string, string> = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite };
const order = ["azul", "vermelho", "branco"];

function ChillersPage() {
  const { payload, loading, error } = useDashboard();
  const [activeId, setActiveId] = useState("azul");
  const [trend, setTrend] = useState<"agua_gelada" | "capacidade" | "pressoes">("agua_gelada");

  const state = PageState({ loading, error });
  const chillers = useMemo(() => asArray(payload?.chillers?.items), [payload]);
  const active = chillers.find((c: any) => String(c.id) === activeId) || chillers[0];

  if (state) return state;
  if (!payload) return <EmptyData />;
  if (!chillers.length) return <EmptyData label="chillers.items não foi enviado pelo workflow para este período." />;

  const series = active?.trends?.[trend] || [];
  const chartKeys =
    trend === "agua_gelada"
      ? [
          { key: "entrada", label: "Entrada" },
          { key: "saida", label: "Saída" },
          { key: "setpoint", label: "Setpoint" },
          { key: "delta_t", label: "Delta T" },
        ]
      : trend === "capacidade"
        ? [
            { key: "circuito_a", label: "Circuito A" },
            { key: "circuito_b", label: "Circuito B" },
            { key: "total", label: "Total" },
          ]
        : [
            { key: "succao_a", label: "Sucção A" },
            { key: "descarga_a", label: "Descarga A" },
            { key: "succao_b", label: "Sucção B" },
            { key: "descarga_b", label: "Descarga B" },
          ];

  return (
    <div className="space-y-6">
      <SectionTitle title="Chillers" subtitle="Renderização direta dos campos enviados pelo workflow v2.3. Sem cálculo local e sem valores mockados." />

      <div className="grid gap-4 lg:grid-cols-3">
        {order.map((id) => {
          const c = chillers.find((item: any) => String(item.id) === id);
          if (!c) return null;
          return (
            <button
              key={id}
              type="button"
              onClick={() => setActiveId(id)}
              className={cn(
                "overflow-hidden rounded-2xl border bg-surface-2/55 p-4 text-left transition",
                active?.id === id ? "border-primary/55 shadow-[0_0_30px_rgba(0,180,255,0.16)]" : "border-border/50 hover:border-primary/35",
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Chiller</div>
                  <div className="mt-1 font-display text-xl font-semibold">{groupLabel(c.id)}</div>
                </div>
                <StatusPill status={c.status_label || c.status} />
              </div>
              <img src={images[id]} alt={`Chiller ${groupLabel(id)}`} className="mx-auto mt-3 h-32 w-full object-contain" />
              <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Delta T</div><div className="font-mono text-foreground">{fmtMetric(c.delta_t?.avg, "°C")}</div></div>
                <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Cap.</div><div className="font-mono text-foreground">{fmtMetric(c.capacidade?.avg, "%")}</div></div>
                <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Ligado</div><div className="font-mono text-foreground">{fmtMetric(c.tempo_ligado_horas, "h")}</div></div>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <MetricCard label="Status geral" value={active.status_label || active.status} status={active.status} detail={text(active.principal_ocorrencia)} />
            <MetricCard label="Delta T operacional" value={fmtMetric(active.delta_t?.avg, " °C")} detail="Campo delta_t.avg" />
            <MetricCard label="Capacidade média" value={fmtMetric(active.capacidade?.avg, "%")} detail="Somente valores válidos enviados" />
            <MetricCard label="Horas ligado" value={fmtMetric(active.tempo_ligado_horas, " h")} detail="Estado ligado no período" />
            <MetricCard label="Setpoint médio" value={fmtMetric(active.setpoint?.avg, " °C")} detail="Sem cálculo local" />
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
            <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
              <div className="mb-4 flex items-center gap-2"><Thermometer className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Resumo Água Gelada</h2></div>
              <div className="grid gap-3 md:grid-cols-2">
                <MetricCard label="Entrada média" value={fmtMetric(active.temperaturas?.retorno_avg, " °C")} detail="temp_retorno_ag" />
                <MetricCard label="Saída média" value={fmtMetric(active.temperaturas?.saida_avg, " °C")} detail="temp_saida_ag" />
                <MetricCard label="Delta T mínimo" value={fmtMetric(active.delta_t?.min, " °C")} detail="delta_t.min" />
                <MetricCard label="Delta T máximo" value={fmtMetric(active.delta_t?.max, " °C")} detail="delta_t.max" />
              </div>
            </div>

            <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2"><CircuitBoard className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">Tendências</h2></div>
                <div className="flex rounded-full border border-border/60 bg-background/35 p-0.5 text-xs">
                  {[
                    ["agua_gelada", "Água Gelada"],
                    ["capacidade", "Capacidade"],
                    ["pressoes", "Pressões"],
                  ].map(([key, label]) => (
                    <button key={key} onClick={() => setTrend(key as any)} className={cn("rounded-full px-3 py-1.5", trend === key ? "bg-primary/20 text-primary" : "text-muted-foreground")}>{label}</button>
                  ))}
                </div>
              </div>
              <SimpleLineChart data={series} keys={chartKeys} height={320} />
            </div>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            {["A", "B"].map((circuit) => {
              const c = active.circuitos?.[circuit] || {};
              return (
                <div key={circuit} className="rounded-2xl border border-border/50 bg-surface-2/55 p-4">
                  <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-lg font-semibold">Circuito {circuit}</h2><StatusPill status={c.pressao_oleo_status} /></div>
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
        </>
      )}
    </div>
  );
}
