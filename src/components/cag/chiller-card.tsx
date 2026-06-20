import { Link } from "@tanstack/react-router";
import { AlertTriangle, Droplets, Gauge, Thermometer, Zap } from "lucide-react";
import type { ChillerData } from "@/data/mockCagData";
import { chillerTheme } from "@/data/mockCagData";
import { EquipmentRender } from "./equipment-render";
import { HealthRing } from "./health-score";
import { RiskBadge, StatusBadge } from "./badges";

function DataRow({ label, value, unit, danger }: { label: string; value: string | number; unit?: string; danger?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-border/35 py-1.5 text-xs last:border-b-0">
      <span className="text-muted-foreground">{label}</span>
      <span className={danger ? "font-mono font-bold text-status-crit" : "font-mono font-semibold text-foreground"}>
        {value}{unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

export function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const theme = chillerTheme[chiller.id];
  const highlight = chiller.alarms > 0 ? (chiller.id === "red" ? "pump" : "circuit") : "none";

  return (
    <Link
      to="/chillers/$id"
      params={{ id: chiller.id }}
      className={`glass-card ${theme.ring} group relative block min-h-[430px] overflow-hidden p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl`}
    >
      <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 50% 5%, ${theme.soft}, transparent 42%)` }} />
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

        <div className="grid flex-1 gap-4 xl:grid-cols-[118px_1fr]">
          <div className="flex flex-col justify-center gap-3">
            <HealthRing score={chiller.healthScore} size={104} />
            <div className="rounded-lg border border-border/40 bg-surface-2/35 px-3 py-2 text-center">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Capacidade</div>
              <div className="font-display text-3xl font-bold tabular-nums" style={{ color: theme.hex }}>
                {chiller.capacityTotal}<span className="text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-3">
            <EquipmentRender chillerId={chiller.id} size="md" highlight={highlight as any} />
            <div className="grid gap-x-5 gap-y-0 sm:grid-cols-2">
              <DataRow label="Delta T" value={chiller.deltaT.toFixed(1)} unit="°C" danger={chiller.deltaT < 3.5} />
              <DataRow label="Temp. Externa" value={chiller.externalTemp.toFixed(1)} unit="°C" />
              <DataRow label="Setpoint" value={chiller.setpoint.toFixed(1)} unit="°C" />
              <DataRow label="T. Alimentação" value={chiller.feedTemp.toFixed(1)} unit="°C" />
              <DataRow label="T. Retorno" value={chiller.returnTemp.toFixed(1)} unit="°C" />
              <DataRow label="Bombas" value={`${chiller.pumpsOn}/4`} />
              <DataRow label="Circuito A" value={chiller.capacityA} unit="%" />
              <DataRow label="Circuito B" value={chiller.capacityB} unit="%" />
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-2 sm:grid-cols-4">
          <div className="rounded-lg border border-border/35 bg-background/30 p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Gauge className="h-3 w-3" /> Demanda</div>
            <div className="font-mono text-sm font-bold">{chiller.demandLimit}%</div>
          </div>
          <div className="rounded-lg border border-border/35 bg-background/30 p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Zap className="h-3 w-3" /> Partidas</div>
            <div className="font-mono text-sm font-bold">{chiller.starts}</div>
          </div>
          <div className="rounded-lg border border-border/35 bg-background/30 p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Droplets className="h-3 w-3" /> Bypass</div>
            <div className="font-mono text-sm font-bold">{chiller.hydraulic.bypassValve}%</div>
          </div>
          <div className="rounded-lg border border-border/35 bg-background/30 p-2">
            <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted-foreground"><Thermometer className="h-3 w-3" /> Alarmes</div>
            <div className={chiller.alarms > 0 ? "font-mono text-sm font-bold text-status-alert" : "font-mono text-sm font-bold text-status-ok"}>{chiller.alarms}</div>
          </div>
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
