import { createFileRoute } from "@tanstack/react-router";
import { Droplets } from "lucide-react";
import { useState } from "react";
import pumpBlue from "@/assets/pump-blue.png";
import pumpRed from "@/assets/pump-red.png";
import pumpWhite from "@/assets/pump-white.png";
import { EmptyData, MetricCard, PageState, SectionTitle, SimpleLineChart, StatusPill, fmtMetric } from "@/components/cag/api-render";
import { asArray, groupLabel, text, useDashboard } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pumps")({
  head: () => ({ meta: [{ title: "Bombas — CAG Expo Center Norte" }] }),
  component: PumpsPage,
});

const images: Record<string, string> = { azul: pumpBlue, vermelho: pumpRed, branco: pumpWhite };

function PumpsPage() {
  const { payload, loading, error } = useDashboard();
  const [activeId, setActiveId] = useState("azul");
  const [trend, setTrend] = useState<"pressao" | "bypass" | "bombas">("pressao");
  const state = PageState({ loading, error });
  if (state) return state;
  if (!payload) return <EmptyData />;

  const groups = asArray(payload.bombas?.items);
  if (!groups.length) return <EmptyData label="bombas.items não foi enviado pelo workflow para este período." />;
  const active = groups.find((g: any) => String(g.id) === activeId) || groups[0];
  const seriesData = trend === "pressao" ? active?.trends?.pressao : trend === "bypass" ? active?.trends?.bypass : active?.trends?.bombas;
  const keys = trend === "pressao" ? [{ key: "linha", label: "Linha" }, { key: "setpoint", label: "Setpoint" }] : trend === "bypass" ? [{ key: "abertura", label: "Abertura" }] : [{ key: "bag1", label: "BAG1" }, { key: "bag2", label: "BAG2" }, { key: "bag3", label: "BAG3" }, { key: "bag4", label: "BAG4" }];

  return (
    <div className="space-y-6">
      <SectionTitle title="Bombas" subtitle="A tela apenas replica pressões, bypass, estados e séries enviados pelo workflow." />

      <div className="grid gap-4 lg:grid-cols-3">
        {groups.map((group: any) => (
          <button key={group.id} type="button" onClick={() => setActiveId(String(group.id))} className={cn("rounded-[26px] border bg-surface-2/55 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)] p-4 text-left transition", active?.id === group.id ? "border-primary/55" : "border-border/50 hover:border-primary/35")}>
            <div className="flex items-start justify-between gap-3"><div><div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Grupo de bombas</div><div className="mt-1 font-display text-xl font-semibold">{groupLabel(group.id)}</div></div><StatusPill status={group.status_label || group.status} /></div>
            <img src={images[String(group.id)]} alt={`Bombas ${groupLabel(group.id)}`} className="mx-auto mt-3 h-32 w-full object-contain" />
            <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Pressão</div><div className="font-mono text-foreground">{fmtMetric(group.pressao?.linha_avg, " bar")}</div></div>
              <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Bypass</div><div className="font-mono text-foreground">{fmtMetric(group.bypass?.avg, "%")}</div></div>
              <div className="rounded-lg bg-background/35 p-2"><div className="text-muted-foreground">Ligadas</div><div className="font-mono text-foreground">{fmtMetric(group.resumo_operacional?.bombas_ligadas_avg, "", 1)}</div></div>
            </div>
          </button>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label="Status geral" value={active.status_label || active.status} status={active.status} detail={text(active.principal_ocorrencia)} />
        <MetricCard label="Pressão linha" value={fmtMetric(active.pressao?.linha_avg, " bar")} />
        <MetricCard label="Setpoint pressão" value={fmtMetric(active.pressao?.setpoint_avg, " bar")} />
        <MetricCard label="Bypass médio" value={fmtMetric(active.bypass?.avg, "%")} />
        <MetricCard label="Tempo fora setpoint" value={fmtMetric(active.pressao?.tempo_fora_setpoint_horas, " h")} />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr]">
        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center gap-2"><Droplets className="h-5 w-5 text-primary" /><h2 className="font-display text-lg font-semibold">BAGs</h2></div>
          <div className="grid gap-3 md:grid-cols-2">
            {asArray(active.bombas).map((bag: any) => (
              <div key={bag.id} className="rounded-xl border border-border/45 bg-background/35 p-3">
                <div className="flex items-center justify-between gap-3"><span className="font-semibold">{text(bag.name)}</span><StatusPill status={bag.status} /></div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <span>Ligada: <b className="font-mono text-foreground">{fmtMetric(bag.horas_ligada, " h")}</b></span>
                  <span>Local: <b className="font-mono text-foreground">{fmtMetric(bag.horas_local, " h")}</b></span>
                  <span>Partidas: <b className="font-mono text-foreground">{fmtMetric(bag.partidas_estimadas, "", 0)}</b></span>
                  <span>Alarme: <b className="font-mono text-foreground">{fmtMetric(bag.horas_alarme, " h")}</b></span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]">
          <div className="mb-4 flex items-center justify-between gap-3"><h2 className="font-display text-lg font-semibold">Tendências</h2><div className="flex rounded-full border border-border/60 bg-background/35 p-0.5 text-xs">{[["pressao","Pressão"],["bypass","Bypass"],["bombas","BAGs"]].map(([key,label])=><button key={key} onClick={()=>setTrend(key as any)} className={cn("rounded-full px-3 py-1.5", trend === key ? "bg-primary/20 text-primary" : "text-muted-foreground")}>{label}</button>)}</div></div>
          <SimpleLineChart data={seriesData || []} keys={keys} height={320} />
        </div>
      </div>
    </div>
  );
}
