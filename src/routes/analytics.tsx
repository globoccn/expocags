import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Gauge, Power, SlidersHorizontal } from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { allPumps, chillers, trend24h } from "@/lib/cag-data";

export const Route = createFileRoute("/analytics")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Bombas" }] }),
  component: PumpsPage,
});

function PumpsPage() {
  const pumps = allPumps();
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4">
          <h1 className="text-2xl font-bold uppercase text-white">Bombas da Central</h1>
          <p className="mt-1 text-sm text-slate-400">12 bombas associadas aos Chillers Azul, Vermelho e Branco. Análises: pressão x setpoint, bypass, local/remoto, alarme e saúde.</p>
        </div>
        <section className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <K label="Bombas Running" value={pumps.filter(p => p.status === 'Running').length} icon={Power} />
          <K label="Bombas Paradas" value={pumps.filter(p => p.status === 'Standby' || p.status === 'Parada').length} icon={Power} />
          <K label="Bombas em Falha" value={pumps.filter(p => p.status === 'Falha').length} icon={AlertTriangle} danger />
          <K label="Saúde Média" value={`${Math.round(pumps.reduce((s,p)=>s+p.health,0)/pumps.length)}%`} icon={Gauge} />
        </section>
        {chillers.map(chiller => (
          <section key={chiller.id} className="rounded-3xl border border-cyan-400/15 bg-slate-950/60 p-4">
            <h2 className="mb-4 text-lg font-bold uppercase text-white">Bombas do {chiller.name}</h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wider text-slate-500"><tr><th className="py-2">Bomba</th><th>Status</th><th>Local / Remoto</th><th>Setpoint</th><th>Pressão Atual</th><th>Erro</th><th>Bypass</th><th>Alarme</th><th>Saúde</th></tr></thead>
                <tbody>{chiller.pumps.map(p => { const err = p.pressure - p.pressureSetpoint; return <tr key={p.id} className="border-t border-white/5"><td className="py-3 font-medium text-white">{p.name}</td><td className={p.status === 'Falha' ? 'text-red-300' : p.status === 'Running' ? 'text-emerald-300' : 'text-slate-400'}>{p.status}</td><td className={p.mode === 'Local' ? 'text-orange-300' : 'text-cyan-300'}>{p.mode}</td><td>{p.pressureSetpoint} kPa</td><td>{p.pressure} kPa</td><td className={Math.abs(err) > 50 ? 'text-red-300' : 'text-slate-300'}>{err > 0 ? '+' : ''}{err} kPa</td><td className={p.bypass > 70 ? 'text-red-300' : p.bypass > 40 ? 'text-orange-300' : 'text-slate-300'}>{p.bypass}%</td><td className={p.alarm !== 'Nenhum' ? 'text-red-300' : 'text-slate-400'}>{p.alarm}</td><td className={p.health < 60 ? 'text-red-300' : 'text-emerald-300'}>{p.health}%</td></tr>})}</tbody>
              </table>
            </div>
          </section>
        ))}
        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Chart title="Pressão das Bombas x Setpoint"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="pressaoA" name="Pressão" stroke="#22d3ee" dot={false}/><Line dataKey="pressaoB" name="Setpoint" stroke="#c084fc" strokeDasharray="4 4" dot={false}/></LineChart></Chart>
          <Chart title="Abertura da Válvula Bypass"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="bypass" stroke="#fb923c" dot={false}/></LineChart></Chart>
        </section>
      </div>
    </AppShell>
  );
}
function K({ label, value, icon: Icon, danger }: {label:string; value:any; icon:any; danger?:boolean}) { return <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><div className="flex items-center gap-2 text-xs uppercase text-slate-400"><Icon className={danger ? 'h-4 w-4 text-red-300' : 'h-4 w-4 text-cyan-300'}/>{label}</div><div className={danger ? 'mt-3 text-3xl font-bold text-red-300' : 'mt-3 text-3xl font-bold text-white'}>{value}</div></div> }
function Chart({ title, children }: { title: string; children: React.ReactElement }) { return <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h3 className="mb-3 font-semibold uppercase">{title}</h3><div className="h-64"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>; }
