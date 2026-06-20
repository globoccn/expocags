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
    <div className="rounded-lg border border-border/30 bg-background/30 px-2.5 py-2 shadow-inner shadow-black/10">
      <div className="mb-1 flex items-center gap-1.5 text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </div>
      <div className={strong ? "font-display text-lg font-bold leading-none tabular-nums" : "font-mono text-[13px] font-bold tabular-nums"} style={{ color: tone }}>
        {value}
        {unit && <span className="ml-1 text-[10px] font-semibold text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function MiniRow({ label, value, unit, danger }: { label: string; value: string | number; unit?: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border border-border/20 bg-background/22 px-2.5 py-1.5 text-[10.5px]">
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
      className={`glass-card ${theme.ring} group relative block min-h-[430px] overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 50% 0%, ${theme.soft}, transparent 50%)` }} />
      <div className="pointer-events-none absolute inset-x-7 top-0 h-px" style={{ background: theme.hex, boxShadow: `0 0 22px ${theme.hex}` }} />

      <div className="relative z-10 flex h-full flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Chiller</div>
            <h3 className="truncate font-display text-xl font-bold leading-tight tracking-wide text-glow" style={{ color: theme.hex }}>
              {chiller.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={chiller.status} />
            <RiskBadge risk={chiller.risk} />
          </div>
        </div>

        <div className="relative">
          <EquipmentRender chillerId={chiller.id} size="md" highlight={highlight as any} className="h-[150px]" />
          <div className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-2xl border border-background/80 bg-background/70 p-1.5 shadow-2xl backdrop-blur-md">
            <HealthRing score={chiller.healthScore} size={78} label="" />
          </div>
          <div className="absolute bottom-2 right-2 rounded-xl border border-background/70 bg-background/75 px-3 py-2 text-right shadow-xl backdrop-blur-md">
            <div className="text-[8px] uppercase tracking-[0.15em] text-muted-foreground">Capacidade</div>
            <div className="font-display text-2xl font-bold leading-none" style={{ color: theme.hex }}>{chiller.capacityTotal}<span className="text-xs text-muted-foreground">%</span></div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-3">
          <MetricTile label="Delta T" value={chiller.deltaT.toFixed(1)} unit="°C" icon={Thermometer} tone={isDeltaLow ? "var(--status-crit)" : "var(--status-ok)"} strong />
          <MetricTile label="Erro setpoint" value={setpointError > 0 ? `+${setpointError}` : setpointError} unit="°C" icon={Gauge} tone={setpointError > 0.7 ? "var(--status-alert)" : "var(--status-info)"} />
          <MetricTile label="Temp. externa" value={chiller.externalTemp.toFixed(1)} unit="°C" icon={Thermometer} tone="var(--foreground)" />
        </div>

        <div className="grid gap-1.5 sm:grid-cols-2">
          <MiniRow label="Setpoint" value={chiller.setpoint.toFixed(1)} unit="°C" />
          <MiniRow label="Alimentação" value={chiller.feedTemp.toFixed(1)} unit="°C" danger={setpointError > 0.7} />
          <MiniRow label="Retorno" value={chiller.returnTemp.toFixed(1)} unit="°C" />
          <MiniRow label="Bombas" value={`${chiller.pumpsOn}/4`} danger={chiller.pumpsOn < 3} />
          <MiniRow label="Circuito A" value={chiller.capacityA} unit="%" />
          <MiniRow label="Circuito B" value={chiller.capacityB} unit="%" />
        </div>

        <div className="grid gap-1.5 sm:grid-cols-4">
          <MetricTile label="Demanda" value={chiller.demandLimit} unit="%" icon={Gauge} />
          <MetricTile label="Partidas" value={chiller.starts} icon={Zap} tone={chiller.starts > 1000 ? "var(--status-warn)" : "var(--foreground)"} />
          <MetricTile label="Bypass" value={chiller.hydraulic.bypassValve} unit="%" icon={Droplets} tone={isBypassHigh ? "var(--status-alert)" : "var(--status-info)"} />
          <MetricTile label="Horas" value={`${Math.round(chiller.operatingHours / 1000)}k`} icon={Clock3} />
        </div>

        <div className="mt-auto flex items-start gap-2 rounded-lg border border-status-ai/30 bg-status-ai/5 p-2">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" />
          <div className="text-[10.5px] leading-snug text-muted-foreground">
            <span className="font-semibold text-status-ai">IA · </span>{chiller.aiInsight}
          </div>
        </div>
      </div>
    </Link>
  );
}
