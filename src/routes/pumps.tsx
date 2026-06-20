import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Droplets, Radio } from "lucide-react";
import { chillers, chillerTheme } from "@/data/mockCagData";
import { StatusBadge } from "@/components/cag/badges";
import { ChartWrap, chartColors, tooltipStyle } from "@/components/cag/chart-wrap";

export const Route = createFileRoute("/pumps")({
  head: () => ({ meta: [{ title: "Bombas — CAG Intelligence AI" }] }),
  component: PumpsPage,
});

function PumpsPage() {
  const pumpSeries = Array.from({ length: 24 }, (_, i) => ({
    t: `${String(i).padStart(2, "0")}h`,
    pressure: +(3.1 + Math.sin(i / 3) * 0.3).toFixed(2),
    setpoint: 3.3,
    bypass: +(25 + Math.sin(i / 4) * 10 + Math.random() * 5).toFixed(0),
  }));
  const alarmsPerPump = chillers.flatMap((c) =>
    c.pumps.map((p) => ({
      name: `${c.name.split(" ")[1][0]}-${p.name.split(" ")[1]}`,
      alarms: p.alarm ? 1 : 0,
      health: p.healthScore,
    })),
  );

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Hidráulica</div>
        <h1 className="font-display text-3xl font-bold">Bombas</h1>
        <p className="text-sm text-muted-foreground">12 bombas distribuídas por 3 chillers</p>
      </div>

      {chillers.map((c) => {
        const theme = chillerTheme[c.id];
        return (
          <section key={c.id} className={`glass-card ${theme.ring} p-5`}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="font-display text-lg font-semibold" style={{ color: theme.hex }}>
                Bombas do {c.name}
              </h2>
              <span className="text-xs text-muted-foreground">
                {c.pumps.filter((p) => p.status === "on").length}/4 ligadas
              </span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {c.pumps.map((p) => {
                const critical = p.alarm || p.mode === "local" || p.pressureError < -0.3 || p.bypassValve > 50;
                return (
                  <div key={p.id} className={`glass-card relative p-4 ${critical ? "ring-1 ring-status-alert/50" : ""}`}>
                    {critical && (
                      <div className="absolute right-2 top-2">
                        <AlertTriangle className="h-4 w-4 text-status-alert animate-pulse-glow" />
                      </div>
                    )}
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4" style={{ color: theme.hex }} />
                      <span className="font-display text-sm font-semibold">{p.name}</span>
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      <span
                        className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] ${
                          p.mode === "local" ? "border-status-alert/50 text-status-alert" : "border-border text-muted-foreground"
                        }`}
                      >
                        <Radio className="h-2.5 w-2.5" /> {p.mode.toUpperCase()}
                      </span>
                    </div>
                    <div className="mt-3 grid grid-cols-2 gap-1.5 text-[11px]">
                      <div><span className="text-muted-foreground">P. Linha:</span> <span className="font-mono font-semibold">{p.pressureLine.toFixed(2)}</span></div>
                      <div><span className="text-muted-foreground">Setpoint:</span> <span className="font-mono font-semibold">{p.pressureSetpoint.toFixed(2)}</span></div>
                      <div><span className="text-muted-foreground">Erro P.:</span> <span className={`font-mono font-semibold ${p.pressureError < -0.3 ? "text-status-alert" : ""}`}>{p.pressureError.toFixed(2)}</span></div>
                      <div><span className="text-muted-foreground">Bypass:</span> <span className={`font-mono font-semibold ${p.bypassValve > 50 ? "text-status-alert" : ""}`}>{p.bypassValve}%</span></div>
                      <div><span className="text-muted-foreground">Health:</span> <span className="font-mono font-semibold">{p.healthScore}/100</span></div>
                      <div><span className="text-muted-foreground">Alarme:</span> <span className={`font-semibold ${p.alarm ? "text-status-alert" : "text-status-ok"}`}>{p.alarm ? "Ativo" : "Não"}</span></div>
                    </div>
                    <div className="mt-2 text-[10px] text-muted-foreground">Última: {p.lastEvent}</div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="grid gap-4 lg:grid-cols-2">
        <ChartWrap title="Pressão Linha × Setpoint" subtitle="bar">
          <LineChart data={pumpSeries}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line type="monotone" dataKey="pressure" stroke={chartColors.primary} strokeWidth={2} dot={false} name="Pressão" />
            <Line type="monotone" dataKey="setpoint" stroke={chartColors.warn} strokeDasharray="4 4" strokeWidth={1.5} dot={false} name="Setpoint" />
          </LineChart>
        </ChartWrap>
        <ChartWrap title="Abertura Bypass" subtitle="%">
          <LineChart data={pumpSeries}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="t" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line type="monotone" dataKey="bypass" stroke={chartColors.alert} strokeWidth={2} dot={false} />
          </LineChart>
        </ChartWrap>
        <ChartWrap title="Health Score das Bombas" subtitle="por bomba">
          <BarChart data={alarmsPerPump}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="health" fill={chartColors.primary} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartWrap>
        <ChartWrap title="Alarmes por Bomba" subtitle="ativos">
          <BarChart data={alarmsPerPump}>
            <CartesianGrid stroke={chartColors.grid} strokeDasharray="3 3" />
            <XAxis dataKey="name" stroke={chartColors.muted} fontSize={11} />
            <YAxis stroke={chartColors.muted} fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar dataKey="alarms" fill={chartColors.crit} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ChartWrap>
      </div>
    </div>
  );
}