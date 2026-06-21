import { Link } from "@tanstack/react-router";
import { AlertTriangle, Clock3, Droplets, Gauge, Thermometer, Zap } from "lucide-react";
import type { ChillerData } from "@/data/mockCagData";
import { chillerTheme } from "@/data/mockCagData";
import { EquipmentRender } from "./equipment-render";
import { RiskBadge, StatusBadge } from "./badges";

function MetricBox({ label, value, unit, tone }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-border/25 bg-background/38 px-3 py-2 shadow-inner shadow-black/10">
      <div className="text-[9px] font-bold uppercase tracking-[0.17em] text-muted-foreground">{label}</div>
      <div className="mt-1 font-display text-lg font-bold leading-none tabular-nums" style={{ color: tone }}>
        {value}<span className="ml-1 text-[11px] text-muted-foreground">{unit}</span>
      </div>
    </div>
  );
}

function ThinMetric({ label, value, unit, tone }: { label: string; value: string | number; unit?: string; tone?: string }) {
  return (
    <div className="flex items-center justify-between gap-2 border-r border-border/25 px-2 last:border-r-0">
      <span className="text-[9px] font-bold uppercase tracking-[0.15em] text-muted-foreground">{label}</span>
      <span className="font-mono text-[11px] font-bold tabular-nums" style={{ color: tone }}>{value}{unit}</span>
    </div>
  );
}

export function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const theme = chillerTheme[chiller.id];
  const highlight = chiller.alarms > 0 ? (chiller.id === "red" ? "pump" : "circuit") : "none";
  const setpointError = +(chiller.feedTemp - chiller.setpoint).toFixed(1);
  const isDeltaLow = chiller.deltaT < 3.5;
  const isBypassHigh = chiller.hydraulic.bypassValve >= 45;
  const healthTone = chiller.healthScore < 75 ? "var(--status-warn)" : chiller.healthScore < 85 ? "var(--status-info)" : "var(--status-ok)";
  const healthLabel = chiller.healthScore < 75 ? "Atenção" : chiller.healthScore < 85 ? "Bom" : "Excelente";
  const site = chiller.id === "white" ? "CAG Pavimento Branco" : "CAG Expo Center Norte";

  return (
    <Link
      to="/chillers/$id"
      params={{ id: chiller.id }}
      className={`home-chiller-card ${theme.ring} group relative block overflow-hidden rounded-2xl p-3 transition-all duration-300 hover:-translate-y-1`}
    >
      <div className="absolute inset-0 opacity-95" style={{ background: `radial-gradient(circle at 50% 20%, ${theme.soft}, transparent 42%), linear-gradient(180deg, ${theme.soft}, transparent 58%)` }} />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px" style={{ background: theme.hex, boxShadow: `0 0 26px ${theme.hex}` }} />

      <div className="relative z-10 flex h-full flex-col gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[9px] font-bold uppercase tracking-[0.32em] text-muted-foreground">{site}</div>
            <h3 className="truncate font-display text-xl font-bold leading-tight text-glow" style={{ color: theme.hex }}>
              {chiller.name}
            </h3>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <StatusBadge status={chiller.status} />
            <RiskBadge risk={chiller.risk} />
          </div>
        </div>

        <EquipmentRender chillerId={chiller.id} size="md" highlight={highlight as any} className="h-[185px]" />

        <div className="grid grid-cols-[110px_1fr_96px] gap-2">
          <div className="rounded-2xl border border-border/30 bg-background/50 p-3 shadow-xl shadow-black/30 backdrop-blur-md">
            <div className="flex items-center gap-2">
              <div className="relative grid h-16 w-16 place-items-center rounded-full" style={{ border: `5px solid ${healthTone}`, boxShadow: `0 0 20px ${healthTone}` }}>
                <div className="font-display text-xl font-bold" style={{ color: healthTone }}>{chiller.healthScore}</div>
                <div className="absolute bottom-2 text-[8px] text-muted-foreground">/100</div>
              </div>
            </div>
          </div>
          <div className="rounded-2xl border border-border/25 bg-background/42 p-3">
            <div className="font-display text-lg font-bold" style={{ color: healthTone }}>{healthLabel}</div>
            <div className="text-[11px] text-muted-foreground">Saúde</div>
          </div>
          <MetricBox label="Capacidade" value={chiller.capacityTotal} unit="%" tone={theme.hex} />
        </div>

        <div className="grid grid-cols-4 gap-2">
          <MetricBox label="ΔT atual" value={chiller.deltaT.toFixed(1)} unit="°C" tone={isDeltaLow ? "var(--status-crit)" : "var(--status-ok)"} />
          <MetricBox label="Bypass" value={chiller.hydraulic.bypassValve} unit="%" tone={isBypassHigh ? "var(--status-crit)" : "var(--status-info)"} />
          <MetricBox label="Erro SP" value={setpointError > 0 ? `+${setpointError}` : setpointError} unit="°C" tone={setpointError > 0.7 ? "var(--status-crit)" : "var(--status-info)"} />
          <MetricBox label="Bombas" value={`${chiller.pumpsOn}/4`} tone={chiller.pumpsOn < 3 ? "var(--status-crit)" : undefined} />
        </div>

        <div className="grid grid-cols-5 rounded-xl border border-border/25 bg-background/28 py-2">
          <ThinMetric label="Ext." value={chiller.externalTemp.toFixed(1)} unit="°C" />
          <ThinMetric label="Saída" value={chiller.feedTemp.toFixed(1)} unit="°C" tone={setpointError > 0.7 ? "var(--status-crit)" : undefined} />
          <ThinMetric label="Retorno" value={chiller.returnTemp.toFixed(1)} unit="°C" />
          <ThinMetric label="A/B" value={`${chiller.capacityA}/${chiller.capacityB}`} unit="%" />
          <ThinMetric label="Horas" value={`${Math.round(chiller.operatingHours / 1000)}k`} />
        </div>
      </div>
    </Link>
  );
}
