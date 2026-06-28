import { Link } from "@tanstack/react-router";
import { Activity, AlertTriangle, Droplets, Gauge, Thermometer, Wind } from "lucide-react";
import type { ChillerData } from "@/data/cagTypes";
import { chillerTheme } from "@/data/cagTypes";
import { EquipmentRender } from "./equipment-render";
import { HealthRing } from "./health-score";
import { RiskBadge, StatusBadge } from "./badges";

function Metric({ icon: Icon, label, value, unit }: { icon: any; label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-center gap-2 rounded-md border border-border/40 bg-surface-2/40 px-2.5 py-1.5">
      <Icon className="h-3.5 w-3.5 text-muted-foreground" />
      <div className="flex flex-col leading-tight">
        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="font-mono text-xs font-semibold">
          {value}
          {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
        </span>
      </div>
    </div>
  );
}

export function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const theme = chillerTheme[chiller.id];
  return (
    <Link
      to="/chillers/$id"
      params={{ id: chiller.id }}
      className={`glass-card ${theme.ring} group relative block overflow-hidden p-5 transition-all hover:translate-y-[-3px]`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-[0.2em] text-muted-foreground">Chiller</div>
          <h3 className="font-display text-xl font-bold" style={{ color: theme.hex }}>
            {chiller.name}
          </h3>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <StatusBadge status={chiller.status} />
          <RiskBadge risk={chiller.risk} />
        </div>
      </div>

      <div className="my-3 flex justify-center">
        <EquipmentRender chillerId={chiller.id} size="md" />
      </div>

      <div className="mb-3 flex items-center justify-between">
        <HealthRing score={chiller.healthScore} size={80} />
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Capacidade</div>
          <div className="font-display text-3xl font-bold tabular-nums" style={{ color: theme.hex }}>
            {chiller.capacityTotal}
            <span className="ml-0.5 text-sm text-muted-foreground">%</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-1.5">
        <Metric icon={Thermometer} label="Delta T" value={chiller.deltaT.toFixed(1)} unit="°C" />
        <Metric icon={Wind} label="Ext." value={chiller.externalTemp.toFixed(1)} unit="°C" />
        <Metric icon={Gauge} label="Setpoint" value={chiller.setpoint.toFixed(1)} unit="°C" />
        <Metric icon={Activity} label="T. Alim." value={chiller.feedTemp.toFixed(1)} unit="°C" />
        <Metric icon={Activity} label="T. Ret." value={chiller.returnTemp.toFixed(1)} unit="°C" />
        <Metric icon={Droplets} label="Bombas" value={`${chiller.pumpsOn}/4`} />
      </div>

      <div className="mt-3 flex items-start gap-2 rounded-md border border-status-ai/30 bg-status-ai/5 p-2.5">
        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-status-ai" />
        <div className="text-[11px] leading-snug text-muted-foreground">
          <span className="font-semibold text-status-ai">IA · </span>
          {chiller.aiInsight}
        </div>
      </div>

      {chiller.alarms > 0 && (
        <div className="mt-2 text-[11px] text-status-alert">
          {chiller.alarms} alarme(s) ativo(s): {chiller.activeAlarms.join(", ")}
        </div>
      )}
    </Link>
  );
}