import { cn } from "@/lib/utils";
import type { Severity } from "@/data/mockCagData";

const sevMap: Record<Severity, { label: string; cls: string }> = {
  ok: { label: "Normal", cls: "bg-status-ok/15 text-status-ok border-status-ok/40" },
  info: { label: "Info", cls: "bg-status-info/15 text-status-info border-status-info/40" },
  warn: { label: "Atenção", cls: "bg-status-warn/15 text-status-warn border-status-warn/40" },
  alert: { label: "Alerta", cls: "bg-status-alert/15 text-status-alert border-status-alert/40" },
  crit: { label: "Crítico", cls: "bg-status-crit/15 text-status-crit border-status-crit/40" },
};

export function SeverityBadge({ severity, className }: { severity: Severity; className?: string }) {
  const s = sevMap[severity];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium uppercase tracking-wider",
        s.cls,
        className,
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse-glow" />
      {s.label}
    </span>
  );
}

export function RiskBadge({ risk }: { risk: Severity }) {
  return <SeverityBadge severity={risk} />;
}

const statusMap = {
  on: { label: "Ligado", cls: "bg-status-ok/15 text-status-ok border-status-ok/40" },
  running: { label: "Operando", cls: "bg-status-ok/15 text-status-ok border-status-ok/40" },
  off: { label: "Desligado", cls: "bg-status-idle/15 text-status-idle border-status-idle/40" },
  standby: { label: "Standby", cls: "bg-status-info/15 text-status-info border-status-info/40" },
  fault: { label: "Falha", cls: "bg-status-crit/15 text-status-crit border-status-crit/40" },
};

export function StatusBadge({ status }: { status: keyof typeof statusMap }) {
  const s = statusMap[status];
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium", s.cls)}>
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {s.label}
    </span>
  );
}