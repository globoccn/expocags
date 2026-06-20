import { createFileRoute } from "@tanstack/react-router";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Maximize2 } from "lucide-react";
import { chillers, plant } from "@/data/mockCagData";
import { ChartWrap, chartColors, tooltipStyle } from "@/components/cag/chart-wrap";

export const Route = createFileRoute("/trends")({
  head: () => ({ meta: [{ title: "Tendências — CAG Intelligence AI" }] }),
  component: TrendsPage,
});

const Actions = () => (
  <div className="flex items-center gap-1">
    <button className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground">
      <Maximize2 className="h-3.5 w-3.5" />
    </button>
    <button className="grid h-7 w-7 place-items-center rounded-md border border-border text-muted-foreground hover:text-foreground">
      <Download className="h-3.5 w-3.5" />
    </button>
  </div>
);

function TrendsPage() {
  const blue = chillers[0].series;
  const red = chillers[1].series;
  const merged = blue.capacity.map((b, i) => ({ t: b.t, blue: b.total, red: red.capacity[i].total }));

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Analytics</div>
        <h1 className="font-display text-3xl font-bold">Tendências</h1>
        <p className="text-sm text-muted-foreground">Comparativos · Correlações · Histórico</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartWrap title="Health Score ao longo do tempo" subtitle="30 dias" actions={<Actions />}>
          <AreaChart data={plant.trends.healthOverTime}>
            <defs>
              <linearGradient id="g-h" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.6} />
                <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke={chartColors.muted} fontSize={11} />
            <YAxis domain={[0, 100]} stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area type="monotone" dataKey="score" stroke={chartColors.primary} fill="url(#g-h)" strokeWidth={2} />
          </AreaChart>
        </ChartWrap>

        <ChartWrap title="Alarmes por período" subtitle="14 dias" actions={<Actions />}>
          <BarChart data={plant.trends.alarmsPerPeriod}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="day" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="warn" stackId="a" fill={chartColors.warn} />
            <Bar dataKey="crit" stackId="a" fill={chartColors.crit} />
          </BarChart>
        </ChartWrap>

        <ChartWrap title="Temperatura Externa × Capacidade" subtitle="correlação" actions={<Actions />}>
          <LineChart data={blue.externalVsCap}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="ext" stroke={chartColors.warn} strokeWidth={2} dot={false} name="T. Externa °C" />
            <Line type="monotone" dataKey="cap" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Capacidade %" />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Capacidade — Chiller Azul × Vermelho" subtitle="%" actions={<Actions />}>
          <LineChart data={merged}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="blue" stroke={chartColors.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="red" stroke={chartColors.red} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Delta T × Bypass" subtitle="diagnóstico hidráulico" actions={<Actions />}>
          <LineChart data={red.deltaT.map((d, i) => ({ t: d.t, dt: d.v, bypass: 30 + Math.sin(i / 3) * 15 + 20 }))}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="dt" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Delta T °C" />
            <Line type="monotone" dataKey="bypass" stroke={chartColors.alert} strokeWidth={2} dot={false} name="Bypass %" />
          </LineChart>
        </ChartWrap>

        <ChartWrap title="Pressão Alta — A × B (Vermelho)" subtitle="bar" actions={<Actions />}>
          <LineChart data={red.pressureHigh}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="a" stroke={chartColors.blue} strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="b" stroke={chartColors.red} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartWrap>
      </div>
    </div>
  );
}