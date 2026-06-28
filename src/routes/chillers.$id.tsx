import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  ArrowLeft,
  Brain,
  Droplets,
  Flame,
  Gauge,
  Power,
  Sparkles,
  Thermometer,
  Timer,
  TrendingUp,
  Wind,
  Zap,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { getChiller, chillerTheme, type ChillerData } from "@/data/mockCagData";
import { EquipmentRender } from "@/components/cag/equipment-render";
import { KpiCard } from "@/components/cag/kpi-card";
import { HealthRing, HealthFactors } from "@/components/cag/health-score";
import { SeverityBadge, StatusBadge } from "@/components/cag/badges";
import { ChartWrap, chartColors, tooltipStyle } from "@/components/cag/chart-wrap";

export const Route = createFileRoute("/chillers/$id")({
  head: ({ params }) => ({
    meta: [{ title: `Chiller ${params.id} — CAG Intelligence AI` }],
  }),
  loader: ({ params }) => {
    const c = getChiller(params.id);
    if (!c) throw notFound();
    return c;
  },
  component: ChillerPage,
  notFoundComponent: () => <div className="p-8 text-center">Chiller não encontrado.</div>,
});

function Row({ label, value, unit }: { label: string; value: string | number; unit?: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border/30 py-1.5 text-xs last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono font-semibold">
        {value}
        {unit && <span className="ml-0.5 text-muted-foreground">{unit}</span>}
      </span>
    </div>
  );
}

function ChillerPage() {
  const c = Route.useLoaderData() as ChillerData;
  const theme = chillerTheme[c.id];
  const color = theme.hex;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <Link to="/" className="mb-1 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-3 w-3" /> Visão Geral
          </Link>
          <h1 className="font-display text-3xl font-bold" style={{ color }}>
            {c.name}
          </h1>
          <p className="text-sm text-muted-foreground">Cockpit do equipamento · análise operacional consolidada</p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={c.status} />
          <SeverityBadge severity={c.risk} />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-9">
        <KpiCard label="Health" value={c.healthScore} unit="/100" icon={Activity} tone={c.healthScore >= 85 ? "ok" : "warn"} />
        <KpiCard label="Capacidade" value={c.capacityTotal} unit="%" icon={Gauge} />
        <KpiCard label="Delta T" value={c.deltaT.toFixed(1)} unit="°C" icon={Thermometer} tone={c.deltaT < 4 ? "warn" : "ok"} />
        <KpiCard label="Erro Setpoint" value={(c.feedTemp - c.setpoint).toFixed(2)} unit="°C" icon={TrendingUp} />
        <KpiCard label="T. Externa" value={c.externalTemp.toFixed(1)} unit="°C" icon={Wind} />
        <KpiCard label="Alarmes" value={c.alarms} icon={AlertTriangle} tone={c.alarms > 0 ? "alert" : "ok"} />
        <KpiCard label="Risco" value={c.risk} icon={Flame} tone={c.risk === "alert" ? "alert" : "ok"} />
        <KpiCard label="Horas Op." value={c.operatingHours.toLocaleString()} unit="h" icon={Timer} />
        <KpiCard label="Partidas" value={c.starts} icon={Power} />
      </div>

      {/* Render + Health */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className={`glass-card ${theme.ring} relative overflow-hidden p-6 lg:col-span-2`}>
          <div className="mb-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Representação Física</div>
          <div className="flex justify-center">
            <EquipmentRender chillerId={c.id} size="lg" />
          </div>
        </div>
        <div className="glass-card p-5">
          <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Saúde do Equipamento</div>
          <div className="mt-3"><HealthRing score={c.healthScore} size={120} label="Score atual" /></div>
          <div className="mt-4 text-[10px] uppercase tracking-wider text-muted-foreground">Fatores que reduziram</div>
          <HealthFactors className="mt-2" />
        </div>
      </div>

      {/* General data + circuits + hydraulic */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Dados Gerais</h3>
          <Row label="Status" value={c.status} />
          <Row label="Comando" value={c.command} />
          <Row label="Capacidade Total" value={c.capacityTotal} unit="%" />
          <Row label="Capacidade Circ. A" value={c.capacityA} unit="%" />
          <Row label="Capacidade Circ. B" value={c.capacityB} unit="%" />
          <Row label="Setpoint Água Gelada" value={c.setpoint.toFixed(1)} unit="°C" />
          <Row label="T. Alimentação" value={c.feedTemp.toFixed(1)} unit="°C" />
          <Row label="T. Retorno" value={c.returnTemp.toFixed(1)} unit="°C" />
          <Row label="Delta T" value={c.deltaT.toFixed(1)} unit="°C" />
          <Row label="T. Externa" value={c.externalTemp.toFixed(1)} unit="°C" />
          <Row label="Limite Demanda" value={c.demandLimit} unit="%" />
          <Row label="Horas Operação" value={c.operatingHours.toLocaleString()} unit="h" />
          <Row label="Nº Partidas" value={c.starts} />
          <Row label="Status Alarme" value={c.alarms > 0 ? "Ativo" : "OK"} />
        </div>

        {c.circuits.map((circ) => (
          <div key={circ.id} className="glass-card p-5">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-sm font-semibold">Circuito {circ.id}</h3>
              <HealthRing score={circ.healthScore} size={56} label="" />
            </div>
            <Row label="Capacidade" value={circ.capacity} unit="%" />
            <Row label="Pressão Alta / Descarga" value={circ.highPressure.toFixed(1)} unit="bar" />
            <Row label="Pressão Baixa / Sucção" value={circ.lowPressure.toFixed(1)} unit="bar" />
            <Row label="Pressão Óleo Comp. 1" value={circ.oilPressureC1.toFixed(1)} unit="bar" />
            <Row label="Pressão Óleo Comp. 2" value={circ.oilPressureC2.toFixed(1)} unit="bar" />
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Compressor 1</span>
              <StatusBadge status={circ.compressor1Status} />
            </div>
            <div className="mt-1 flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Compressor 2</span>
              <StatusBadge status={circ.compressor2Status} />
            </div>
            <div className="mt-2 text-[11px] text-muted-foreground">Anomalias: {circ.anomalies}</div>
          </div>
        ))}
      </div>

      {/* Compressors */}
      <div>
        <h3 className="mb-3 font-display text-lg font-semibold">Compressores</h3>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {c.compressors.map((cmp) => (
            <div key={cmp.id} className="glass-card p-4">
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" style={{ color }} />
                  <span className="font-display text-sm font-semibold">{cmp.name}</span>
                </div>
                <StatusBadge status={cmp.status} />
              </div>
              <Row label="Pressão Óleo" value={cmp.oilPressure.toFixed(1)} unit="bar" />
              <Row label="Horas" value={cmp.hours.toLocaleString()} unit="h" />
              <Row label="Partidas" value={cmp.starts} />
              <Row label="Saúde" value={`${cmp.health}/100`} />
              <div className="mt-2 text-[11px] text-muted-foreground">Última: {cmp.lastEvent}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Pumps + Hydraulic */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h3 className="mb-3 font-display text-lg font-semibold">Bombas Associadas</h3>
          <div className="grid gap-3 md:grid-cols-2">
            {c.pumps.map((p) => (
              <div key={p.id} className="glass-card p-4">
                <div className="mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-4 w-4" style={{ color }} />
                    <span className="font-display text-sm font-semibold">{p.name}</span>
                  </div>
                  <StatusBadge status={p.status} />
                </div>
                <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                  <span>{p.mode === "local" ? "🔴 LOCAL" : "REMOTO"}</span>
                  {p.alarm && <span className="text-status-alert">Alarme ativo</span>}
                </div>
                <Row label="Health" value={`${p.healthScore}/100`} />
              </div>
            ))}
          </div>
        </div>
        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Conjunto Hidráulico</h3>
          <Row label="Pressão Linha" value={c.hydraulic.pressureLine.toFixed(2)} unit="bar" />
          <Row label="Setpoint Pressão" value={c.hydraulic.pressureSetpoint.toFixed(2)} unit="bar" />
          <Row label="Erro Pressão" value={c.hydraulic.pressureError.toFixed(2)} unit="bar" />
          <Row label="Válvula Bypass" value={c.hydraulic.bypassValve} unit="%" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <ChartWrap title="Temperaturas — Alimentação × Retorno × Setpoint" subtitle="°C ao longo do dia">
          <LineChart data={c.series.feedReturnSetpoint}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="feed" stroke={chartColors.blue} strokeWidth={2} dot={false} name="Alimentação" />
            <Line type="monotone" dataKey="ret" stroke={chartColors.red} strokeWidth={2} dot={false} name="Retorno" />
            <Line type="monotone" dataKey="set" stroke={chartColors.warn} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Setpoint" />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Delta T" subtitle="°C — diferencial térmico">
          <AreaChart data={c.series.deltaT}>
            <defs>
              <linearGradient id="g-dt" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.6} />
                <stop offset="100%" stopColor={color} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="v" stroke={color} fill="url(#g-dt)" strokeWidth={2} />
          </AreaChart>
        </ChartWrap>

        <ChartWrap title="Capacidade — Total / Circ. A / Circ. B" subtitle="% de carga">
          <LineChart data={c.series.capacity}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="total" stroke={chartColors.primary} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="a" stroke={chartColors.blue} strokeWidth={1.5} dot={false} />
            <Line type="monotone" dataKey="b" stroke={chartColors.red} strokeWidth={1.5} dot={false} />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Pressão Alta — A × B" subtitle="bar">
          <LineChart data={c.series.pressureHigh}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="a" stroke={chartColors.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="b" stroke={chartColors.red} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Pressão Baixa — A × B" subtitle="bar">
          <LineChart data={c.series.pressureLow}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="a" stroke={chartColors.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="b" stroke={chartColors.red} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Temperatura Externa × Capacidade" subtitle="correlação">
          <LineChart data={c.series.externalVsCap}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ext" stroke={chartColors.warn} strokeWidth={2} dot={false} name="Externa °C" />
            <Line type="monotone" dataKey="cap" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Capacidade %" />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Partidas por Compressor" subtitle="período">
          <BarChart data={c.series.compressorStarts}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="starts" fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartWrap>

        <div className="glass-card p-5">
          <div className="mb-2 flex items-center gap-2">
            <Brain className="h-5 w-5 text-status-ai" />
            <h3 className="font-display text-sm font-semibold">Diagnóstico IA</h3>
          </div>
          <div className="space-y-2 text-sm">
            <div><span className="text-muted-foreground">Diagnóstico principal:</span> {c.aiInsight}</div>
            <div><span className="text-muted-foreground">Causa provável:</span> Desbalanceamento hidráulico / bypass aberto.</div>
            <div><span className="text-muted-foreground">Confiança:</span> <span className="text-status-ai font-semibold">92%</span></div>
            <div><span className="text-muted-foreground">Recomendação:</span> Inspecionar válvula bypass e ajustar setpoint.</div>
            <div><span className="text-muted-foreground">Impacto:</span> Queda de desempenho operacional e maior instabilidade térmica.</div>
            <div className="flex items-center gap-2"><span className="text-muted-foreground">Severidade:</span> <SeverityBadge severity={c.risk} /></div>
          </div>
          <div className="mt-3 flex items-center gap-2 rounded-md border border-status-ai/30 bg-status-ai/5 p-2 text-xs">
            <Sparkles className="h-3.5 w-3.5 text-status-ai" />
            <span>Recomendação gerada por análise preditiva.</span>
          </div>
        </div>
      </div>
    </div>
  );
}