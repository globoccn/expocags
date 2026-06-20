import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Filter } from "lucide-react";
import { alarms, chillerTheme } from "@/data/mockCagData";
import { SeverityBadge } from "@/components/cag/badges";

export const Route = createFileRoute("/alarms")({
  head: () => ({ meta: [{ title: "Alarmes — CAG Intelligence AI" }] }),
  component: AlarmsPage,
});

function AlarmsPage() {
  const active = alarms.filter((a) => a.status === "ativo");
  const resolved = alarms.filter((a) => a.status === "resolvido");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Eventos críticos</div>
          <h1 className="font-display text-3xl font-bold">Alarmes</h1>
          <p className="text-sm text-muted-foreground">{active.length} ativos · {resolved.length} resolvidos</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["Chiller", "Bomba", "Severidade", "Status", "Período"].map((f) => (
            <button key={f} className="inline-flex items-center gap-1.5 rounded-md border border-border bg-surface-2/60 px-3 py-1.5 text-xs">
              <Filter className="h-3 w-3" /> {f}
            </button>
          ))}
        </div>
      </div>

      <div className="glass-card overflow-hidden">
        <table className="w-full text-sm">
          <thead className="border-b border-border/40 bg-surface-2/40">
            <tr className="text-left text-[11px] uppercase tracking-wider text-muted-foreground">
              <th className="px-4 py-3">Severidade</th>
              <th className="px-4 py-3">Equipamento</th>
              <th className="px-4 py-3">Alarme</th>
              <th className="px-4 py-3">Data / Hora</th>
              <th className="px-4 py-3">Duração</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Recomendação IA</th>
            </tr>
          </thead>
          <tbody>
            {alarms.map((a) => {
              const theme = chillerTheme[a.chiller];
              return (
                <tr key={a.id} className="border-b border-border/30 transition-colors hover:bg-surface-2/30">
                  <td className="px-4 py-3"><SeverityBadge severity={a.severity} /></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ background: theme.hex }} />
                      {a.equipment}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3.5 w-3.5 text-status-alert" />
                      {a.title}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{a.at}</td>
                  <td className="px-4 py-3 font-mono text-xs">{a.duration}</td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase ${a.status === "ativo" ? "border-status-alert/50 text-status-alert" : "border-status-ok/50 text-status-ok"}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{a.recommendation}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}