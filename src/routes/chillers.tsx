import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, BrainCircuit, CircleGauge, Droplets, Fan, Snowflake } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { chillers, deltaT, systemInsights, toneClasses, trend24h } from "@/lib/cag-data";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Chillers" }] }),
  component: ChillersPage,
});

const selected = chillers[1];
const tone = toneClasses(selected.tone);

function ChillerRender() {
  return (
    <div className={`relative min-h-[300px] overflow-hidden rounded-3xl border ${tone.border} bg-gradient-to-br ${tone.bg} to-slate-950 p-6 ${tone.glow}`}>
      <div className={`absolute inset-0 opacity-40 blur-3xl bg-gradient-to-r ${selected.tone === 'red' ? 'from-red-500/40' : selected.tone === 'blue' ? 'from-cyan-500/40' : 'from-slate-200/30'} to-transparent`} />
      <div className="relative flex h-full min-h-[250px] items-center justify-center">
        <div className="relative h-36 w-[520px] rounded-[2rem] border border-slate-400/20 bg-slate-900/90 shadow-2xl">
          <div className={`absolute -inset-1 rounded-[2rem] border ${tone.border} opacity-70`} />
          <div className="absolute -top-12 left-20 flex gap-8">
            {[0,1,2].map((i) => <div key={i} className="h-16 w-24 rounded-t-full border border-slate-300/20 bg-slate-800"><Fan className={`mx-auto mt-5 h-7 w-7 ${tone.text}`} /></div>)}
          </div>
          <div className="absolute bottom-5 left-12 flex gap-10">
            {[0,1].map((i) => <div key={i} className={`h-20 w-24 rounded-xl border ${i === 1 ? 'border-orange-400/60 shadow-[0_0_26px_rgba(251,146,60,.22)]' : tone.border} bg-slate-950/80`}><Activity className={`mx-auto mt-6 h-8 w-8 ${i === 1 ? 'text-orange-300' : tone.text}`} /></div>)}
          </div>
          <div className={`absolute -left-16 top-20 h-3 w-28 rounded-full ${selected.tone === 'red' ? 'bg-red-400' : 'bg-cyan-400'} shadow-[0_0_18px_currentColor]`} />
          <div className={`absolute -right-16 top-20 h-3 w-28 rounded-full ${selected.tone === 'red' ? 'bg-red-400' : 'bg-cyan-400'} shadow-[0_0_18px_currentColor]`} />
        </div>
        <div className="absolute left-5 top-6 rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-3 text-sm">
          <div className="text-cyan-300">Circuito A</div><div>Capacidade {selected.circuits[0].capacity}%</div><div className="text-emerald-300">Normal</div>
        </div>
        <div className="absolute right-5 top-6 rounded-2xl border border-purple-400/20 bg-slate-950/70 p-3 text-sm">
          <div className="text-purple-300">Circuito B</div><div>Capacidade {selected.circuits[1].capacity}%</div><div className="text-orange-300">Atenção</div>
        </div>
      </div>
    </div>
  );
}

function Kpi({ label, value, icon: Icon, danger }: { label: string; value: string; icon: any; danger?: boolean }) {
  return <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><div className="flex items-center gap-2 text-xs uppercase tracking-wider text-slate-400"><Icon className="h-4 w-4 text-cyan-300" />{label}</div><div className={danger ? "mt-3 text-3xl font-bold text-red-300" : "mt-3 text-3xl font-bold text-white"}>{value}</div></div>;
}

function ChillersPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4">
          <div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-2xl border ${tone.border} ${tone.text}`}><Snowflake /></span><div><div className={`text-2xl font-bold uppercase ${tone.text}`}>{selected.name}</div><div className="text-sm text-slate-400">Cockpit operacional • identidade luminosa do equipamento</div></div></div>
          <div className="flex gap-2">{chillers.map(c => <button key={c.id} className={`rounded-xl border px-4 py-2 text-sm ${c.id === selected.id ? `${tone.border} ${tone.text} bg-white/5` : 'border-white/10 text-slate-400'}`}>{c.name}</button>)}</div>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <Kpi label="Saúde" value={`${selected.health}%`} icon={CircleGauge} />
          <Kpi label="Capacidade" value={`${selected.capacityTotal}%`} icon={Activity} />
          <Kpi label="Delta T" value={`${deltaT(selected)} °C`} icon={Droplets} danger={deltaT(selected) < 2} />
          <Kpi label="Erro Setpoint" value={`${(selected.supplyTemp - selected.setpoint).toFixed(1)} °C`} icon={Snowflake} />
          <Kpi label="Anomalias" value={`${selected.anomalies}`} icon={AlertTriangle} danger={selected.anomalies > 0} />
          <Kpi label="Risco" value={`${selected.risk}%`} icon={BrainCircuit} danger={selected.risk > 30} />
          <Kpi label="Temp. Externa" value={`${selected.externalTemp} °C`} icon={Fan} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.2fr_.8fr]">
          <ChillerRender />
          <div className="rounded-3xl border border-cyan-400/15 bg-slate-950/60 p-4">
            <h3 className="mb-3 text-lg font-semibold uppercase">Dados principais</h3>
            <div className="space-y-2 text-sm">
              <Row label="Limite de Demanda" value={`${selected.demandLimit}%`} />
              <Row label="Setpoint Água Gelada" value={`${selected.setpoint.toFixed(1)} °C`} />
              <Row label="Temp. Retorno" value={`${selected.returnTemp.toFixed(1)} °C`} />
              <Row label="Temp. Alimentação" value={`${selected.supplyTemp.toFixed(1)} °C`} />
              <Row label="Status de Alarme" value={selected.alarmStatus} danger={selected.alarmStatus !== 'Normal'} />
              <Row label="Alarme Ativo" value={selected.activeAlarm} danger={selected.activeAlarm > 0} />
              <Row label="Horas de Operação" value={`${selected.operatingHours.toLocaleString('pt-BR')} h`} />
              <Row label="Partidas Hoje" value={selected.startsToday} danger={selected.startsToday > 20} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {selected.circuits.map(c => <div key={c.id} className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h3 className={c.id === 'A' ? 'text-cyan-300 font-bold' : 'text-purple-300 font-bold'}>Circuito {c.id}</h3><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><Row label="Capacidade" value={`${c.capacity}%`} /><Row label="Compressor 01" value={c.compressor1} /><Row label="Pressão Alta" value={`${c.highPressure} kPa`} danger={c.highPressure > 750} /><Row label="Compressor 02" value={c.compressor2} danger={c.compressor2 === 'Desligado'} /><Row label="Pressão Baixa" value={`${c.lowPressure} kPa`} /><Row label="Partidas Hoje" value={c.startsToday} danger={c.startsToday > 12} /><Row label="Pressão Óleo CP1" value={`${c.oilCp1} kPa`} /><Row label="Pressão Óleo CP2" value={`${c.oilCp2} kPa`} /></div></div>)}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Chart title="Temperatura Água Gelada"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="retorno" stroke="#38bdf8" dot={false}/><Line dataKey="saida" stroke="#22d3ee" dot={false}/><Line dataKey="setpoint" stroke="#c084fc" strokeDasharray="4 4" dot={false}/></LineChart></Chart>
          <Chart title="Delta T"><AreaChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Area dataKey="deltaT" stroke="#22c55e" fill="#22c55e22"/></AreaChart></Chart>
          <Chart title="Pressões A x B"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="pressaoA" stroke="#22d3ee" dot={false}/><Line dataKey="pressaoB" stroke="#f472b6" dot={false}/></LineChart></Chart>
        </section>

        <section className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h3 className="mb-3 flex items-center gap-2 text-cyan-300"><BrainCircuit className="h-5 w-5"/>Insights da IA</h3><div className="grid gap-3 md:grid-cols-3">{systemInsights.slice(0,3).map(i => <div key={i.title} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="text-xs text-slate-500">{i.time} • Confiança {i.confidence}%</div><div className="mt-1 font-semibold text-white">{i.title}</div><div className="mt-2 text-sm leading-5 text-slate-400">{i.message}</div></div>)}</div></section>
      </div>
    </AppShell>
  );
}

function Row({ label, value, danger }: { label: string; value: any; danger?: boolean }) { return <div className="flex justify-between gap-3 border-b border-white/5 pb-1"><span className="text-slate-400">{label}</span><span className={danger ? 'font-semibold text-red-300' : 'font-semibold text-slate-100'}>{value}</span></div>; }
function Chart({ title, children }: { title: string; children: React.ReactElement }) { return <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h3 className="mb-3 font-semibold uppercase">{title}</h3><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>; }
