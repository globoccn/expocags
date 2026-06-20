import { createFileRoute } from "@tanstack/react-router";
import { Calendar, CalendarDays, CalendarRange, Droplets, FileBarChart, FileText, CircuitBoard, Download } from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — CAG Intelligence AI" }] }),
  component: ReportsPage,
});

const reports = [
  { id: "daily", title: "Relatório Diário", desc: "Síntese de 24h", icon: Calendar },
  { id: "weekly", title: "Relatório Semanal", desc: "Performance dos últimos 7 dias", icon: CalendarDays },
  { id: "monthly", title: "Relatório Mensal", desc: "Visão consolidada do mês", icon: CalendarRange },
  { id: "anom", title: "Relatório de Anomalias", desc: "Diagnósticos da IA", icon: FileBarChart },
  { id: "pumps", title: "Relatório de Bombas", desc: "Operação hidráulica", icon: Droplets },
  { id: "chillers", title: "Relatório de Chillers", desc: "Performance térmica", icon: CircuitBoard },
];

function ReportsPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Documentação</div>
        <h1 className="font-display text-3xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">Gere e exporte relatórios operacionais</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {reports.map((r) => (
          <div key={r.id} className="glass-card p-5 transition-all hover:translate-y-[-2px]">
            <div className="mb-3 flex items-start justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-md bg-primary/15 text-primary">
                <r.icon className="h-5 w-5" />
              </div>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </div>
            <h3 className="font-display text-lg font-semibold">{r.title}</h3>
            <p className="mt-1 text-xs text-muted-foreground">{r.desc}</p>
            <div className="mt-4 flex gap-2">
              <button className="flex-1 rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90">
                Gerar
              </button>
              <button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs">
                <Download className="h-3 w-3" /> PDF
              </button>
              <button className="inline-flex items-center gap-1 rounded-md border border-border px-3 py-1.5 text-xs">
                <Download className="h-3 w-3" /> CSV
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}