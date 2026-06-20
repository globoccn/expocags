import { Link } from "@tanstack/react-router";
import { AlertTriangle, Droplets, Gauge, Thermometer, Zap, Activity, Clock3 } from "lucide-react";
import type { ChillerData } from "@/data/mockCagData";
import { chillerTheme } from "@/data/mockCagData";
import { EquipmentRender } from "./equipment-render";
import { HealthRing } from "./health-score";
import { RiskBadge, StatusBadge } from "./badges";

function MetricTile({
  label,
  value,
  unit,
  icon: Icon,
  tone,
  strong = false,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon?: typeof Gauge;
  tone?: string;
  strong?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/35 bg-background/35 px-3 py-2 shadow-inner shadow-black/10">
      <div className="mb-1 flex items-center gap-1.5 text-[9px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {Icon && <Icon className="h-3 w-3" />}
        {label}
      </div>
      <div className={strong ? "font-display text-xl font-bold leading-none tabular-nums" : "font-mono text-sm font-bold tabular-nums"} style={{ color: tone }}>
        {value}
        {unit && <span className="ml-1 text-[11px] font-semibold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function MiniRow({ label, value, unit, danger }: { label: string; value: string | number; unit?: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/25 bg-background/25 px-2.5 py-1.5 text-[11px]">
      <span className="truncate text-muted-foreground">{label}</span>
      <span className={danger ? "font-mono font-bold text-status-crit" : "font-mono font-semibold text-foreground"}>
        {value}{unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

export function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const theme = chillerTheme[chiller.id];
  const highlight = chiller.alarms > 0 ? (chiller.id === "red" ? "pump" : "circuit") : "none";
  const setpointError = +(chiller.feedTemp - chiller.setpoint).toFixed(1);
  const isDeltaLow = chiller.deltaT < 3.5;
  const isBypassHigh = chiller.hydraulic.bypassValve >= 45;

  return (
    <Link
      to="/chillers/$id"
      params={{ id: chiller.id }}
      className={`glass-card ${theme.ring} group relative block min-h-[510px] overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 50% 0%, ${theme.soft}, transparent 48%)` }} />
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px" style={{ background: theme.hex, boxShadow: `0 0 22px ${theme.hex}` }} />

      <div className="relative z-10 flex h-full flex-col">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Chiller</div>
            <h3 className="truncate font-display text-xl font-bold tracking-wide text-glow" style={{ color: theme.hex }}>
              {chiller.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <StatusBadge status={chiller.status} />
            <RiskBadge risk={chiller.risk} />
          </div>
        </div>

        <div className="mb-3 grid gap-3 xl:grid-cols-[112px_1fr]">
          <div className="flex flex-col justify-between gap-2 rounded-xl border border-border/30 bg-background/25 p-2.5">
            <HealthRing score={chiller.healthScore} size={92} label="Saúde" />
            <div className="h-px bg-border/40" />
            <MetricTile label="Capacidade" value={chiller.capacityTotal} unit="%" tone={theme.hex} icon={Activity} strong />
          </div>

          <EquipmentRender chillerId={chiller.id} size="md" highlight={highlight as any} className="min-h-[190px]" />
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <MetricTile label="Delta T" value={chiller.deltaT.toFixed(1)} unit="°C" icon={Thermometer} tone={isDeltaLow ? "var(--status-crit)" : "var(--status-ok)"} strong />
          <MetricTile label="Erro setpoint" value={setpointError > 0 ? `+${setpointError}` : setpointError} unit="°C" icon={Gauge} tone={setpointError > 0.7 ? "var(--status-alert)" : "var(--status-info)"} />
          <MetricTile label="Temp. externa" value={chiller.externalTemp.toFixed(1)} unit="°C" icon={Thermometer} tone="var(--foreground)" />
        </div>

        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          <MiniRow label="Setpoint" value={chiller.setpoint.toFixed(1)} unit="°C" />
          <MiniRow label="Alimentação" value={chiller.feedTemp.toFixed(1)} unit="°C" danger={setpointError > 0.7} />
          <MiniRow label="Retorno" value={chiller.returnTemp.toFixed(1)} unit="°C" />
          <MiniRow label="Bombas" value={`${chiller.pumpsOn}/4`} danger={chiller.pumpsOn < 3} />
          <MiniRow label="Circuito A" value={chiller.capacityA} unit="%" />
          <MiniRow label="Circuito B" value={chiller.capacityB} unit="%" />
        </div>

        <div className="mt-3 grid gap-2 sm:grid-cols-4">
          <MetricTile label="Demanda" value={chiller.demandLimit} unit="%" icon={Gauge} />
          <MetricTile label="Partidas" value={chiller.starts} icon={Zap} tone={chiller.starts > 1000 ? "var(--status-warn)" : "var(--foreground)"} />
          <MetricTile label="Bypass" value={chiller.hydraulic.bypassValve} unit="%" icon={Droplets} tone={isBypassHigh ? "var(--status-alert)" : "var(--status-info)"} />
          <MetricTile label="Horas" value={`${Math.round(chiller.operatingHours / 1000)}k`} icon={Clock3} />
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg border border-status-ai/30 bg-status-ai/5 p-2.5">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" />
          <div className="text-[11px] leading-snug text-muted-foreground">
            <span className="font-semibold text-status-ai">IA · </span>{chiller.aiInsight}
          </div>
        </div>
      </div>
    </Link>
  );
}
