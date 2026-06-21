import { Link } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { AlertTriangle, Clock3, Droplets, Gauge, Thermometer, Zap } from "lucide-react";
import type { ChillerData } from "@/data/mockCagData";
import { chillerTheme } from "@/data/mockCagData";
import { EquipmentRender } from "./equipment-render";
import { HealthRing } from "./health-score";
import { RiskBadge, StatusBadge } from "./badges";

function DataPill({ label, value, unit, tone }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/25 bg-background/30 px-2.5 py-1.5 shadow-inner shadow-black/10">
      <div className="text-[8.5px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-mono text-[13px] font-bold leading-tight tabular-nums" style={{ color: tone }}>
        {value}
        {unit && <span className="ml-1 text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

function MiniKpi({ label, value, unit, icon: Icon, tone }: { label: string; value: string | number; unit?: string; icon?: LucideIcon; tone?: string }) {
  return (
    <div className="rounded-lg border border-border/25 bg-background/35 px-2.5 py-2">
      <div className="mb-1 flex items-center gap-1.5 text-[8px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">
        {Icon && <Icon className="h-2.5 w-2.5" />}
        {label}
      </div>
      <div className="font-display text-base font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}
        {unit && <span className="ml-1 text-[10px] text-muted-foreground">{unit}</span>}
      </div>
    </div>
  );
}

export function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const theme = chillerTheme[chiller.id];
  const highlight = chiller.alarms > 0 ? (chiller.id === "red" ? "pump" : "circuit") : "none";
  const setpointError = +(chiller.feedTemp - chiller.setpoint).toFixed(1);
  const isDeltaLow = chiller.deltaT < 3.5;
  const isBypassHigh = chiller.hydraulic.bypassValve >= 45;
  const circuitSpread = Math.abs(chiller.capacityA - chiller.capacityB);

  return (
    <Link
      to="/chillers/$id"
      params={{ id: chiller.id }}
      className={`glass-card ${theme.ring} group relative block overflow-hidden p-3 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 50% -5%, ${theme.soft}, transparent 44%)` }} />
      <div className="pointer-events-none absolute inset-x-6 top-0 h-px" style={{ background: theme.hex, boxShadow: `0 0 22px ${theme.hex}` }} />

      <div className="relative z-10 flex flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[8.5px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Chiller</div>
            <h3 className="truncate font-display text-xl font-bold leading-tight tracking-wide text-glow" style={{ color: theme.hex }}>
              {chiller.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={chiller.status} />
            <RiskBadge risk={chiller.risk} />
          </div>
        </div>

        <EquipmentRender chillerId={chiller.id} size="md" highlight={highlight as any} className="h-[126px]" />

        <div className="grid grid-cols-[auto_1fr] gap-2.5">
          <div className="rounded-xl border border-border/30 bg-background/45 p-2 shadow-xl shadow-black/20 backdrop-blur-md">
            <HealthRing score={chiller.healthScore} size={70} label="" />
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            <MiniKpi label="Capacidade" value={chiller.capacityTotal} unit="%" icon={Gauge} tone={theme.hex} />
            <MiniKpi label="Delta T" value={chiller.deltaT.toFixed(1)} unit="°C" icon={Thermometer} tone={isDeltaLow ? "var(--status-crit)" : "var(--status-ok)"} />
            <MiniKpi label="Bypass" value={chiller.hydraulic.bypassValve} unit="%" icon={Droplets} tone={isBypassHigh ? "var(--status-alert)" : "var(--status-info)"} />
            <MiniKpi label="Erro SP" value={setpointError > 0 ? `+${setpointError}` : setpointError} unit="°C" icon={Gauge} tone={setpointError > 0.7 ? "var(--status-alert)" : "var(--status-info)"} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <DataPill label="Externa" value={chiller.externalTemp.toFixed(1)} unit="°C" />
          <DataPill label="Saída" value={chiller.feedTemp.toFixed(1)} unit="°C" tone={setpointError > 0.7 ? "var(--status-crit)" : undefined} />
          <DataPill label="Retorno" value={chiller.returnTemp.toFixed(1)} unit="°C" />
          <DataPill label="Bombas" value={`${chiller.pumpsOn}/4`} tone={chiller.pumpsOn < 3 ? "var(--status-alert)" : undefined} />
          <DataPill label="A / B" value={`${chiller.capacityA}/${chiller.capacityB}`} unit="%" tone={circuitSpread > 12 ? "var(--status-alert)" : undefined} />
          <DataPill label="Partidas" value={chiller.starts} tone={chiller.starts > 1000 ? "var(--status-warn)" : undefined} />
        </div>

        <div className="grid grid-cols-3 gap-1.5">
          <MiniKpi label="Demanda" value={chiller.demandLimit} unit="%" icon={Gauge} />
          <MiniKpi label="Horas" value={`${Math.round(chiller.operatingHours / 1000)}k`} icon={Clock3} />
          <MiniKpi label="Alarmes" value={chiller.alarms} icon={AlertTriangle} tone={chiller.alarms > 0 ? "var(--status-alert)" : "var(--status-ok)"} />
        </div>

        <div className="mt-auto flex items-start gap-2 rounded-lg border border-status-ai/30 bg-status-ai/5 px-2.5 py-2">
          <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" />
          <div className="text-[10.5px] leading-snug text-muted-foreground">
            <span className="font-semibold text-status-ai">IA · </span>{chiller.aiInsight}
          </div>
        </div>
      </div>
    </Link>
  );
}
