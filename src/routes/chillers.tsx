import { type ReactElement } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, BrainCircuit, CircleGauge, Droplets, Fan, Snowflake } from "lucide-react";
import { Area, AreaChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { chillers, deltaT, systemInsights, toneClasses, trend24h, type ChillerData } from "@/lib/cag-data";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Chillers" }] }),
  component: ChillersPage,
});

const selected = chillers[1];
const tone = toneClasses(selected.tone);

function ChillerRender({ chiller }: { chiller: ChillerData }) {
  const t = toneClasses(chiller.tone);
  const tint = chiller.tone === "red" ? "bg-red-500/25" : chiller.tone === "white" ? "bg-slate-100/20" : "bg-cyan-400/25";
  const halo = chiller.tone === "red" ? "rgba(248,113,113,.30)" : chiller.tone === "white" ? "rgba(226,232,240,.22)" : "rgba(34,211,238,.28)";

  return (
    <div className={`relative min-h-[330px] overflow-hidden rounded-2xl border ${t.border} bg-[#06101d]/80 p-5 ${t.glow}`}>
      <div className="absolute inset-0 opacity-80" style={{ background: `radial-gradient(circle at 48% 48%, ${halo}, transparent 46%)` }} />
      <div className="absolute left-5 top-5 z-10 rounded-xl border border-cyan-400/20 bg-slate-950/70 p-3 text-sm">
        <div className="font-bold uppercase text-cyan-300">Circuito A</div>
        <div className="mt-1 text-2xl font-black text-white">{chiller.circuits[0].capacity}%</div>
        <div className="text-xs text-slate-400">Capacidade</div>
      </div>
      <div className="absolute right-5 top-5 z-10 rounded-xl border border-purple-400/25 bg-slate-950/70 p-3 text-sm">
        <div className="font-bold uppercase text-purple-300">Circuito B</div>
        <div className="mt-1 text-2xl font-black text-white">{chiller.circuits[1].capacity}%</div>
        <div className="text-xs text-slate-400">Capacidade</div>
      </div>
      <div className={`absolute inset-0 ${tint} mix-blend-screen`} />
      <img src="/assets/chiller-base.png" alt="Render do chiller" className="absolute bottom-4 left-1/2 z-[1] h-[310px] w-[610px] -translate-x-1/2 object-contain opacity-95 saturate-125 drop-shadow-[0_0_32px_rgba(34,211,238,.22)]" />
      <div className="absolute bottom-5 left-7 z-10 grid grid-cols-4 gap-2 text-xs">
        <MiniStatus title="Capacidade" value={`${chiller.capacityTotal}%`} />
        <MiniStatus title="Horas Op." value={`${(chiller.operatingHours / 1000).toFixed(1)}k h`} />
        <MiniStatus title="Partidas" value={`${chiller.startsToday} hoje`} danger={chiller.startsToday > 20} />
        <MiniStatus title="Risco" value={`${chiller.risk}%`} danger={chiller.risk > 30} />
      </div>
    </div>
  );
}

function MiniStatus({ title, value, danger }: { title: string; value: string; danger?: boolean }) {
  return <div className="min-w-[105px] rounded-xl border border-white/10 bg-slate-950/75 p-2 text-center"><div className={danger ? "text-lg font-black text-red-300" : "text-lg font-black text-white"}>{value}</div><div className="text-[10px] uppercase tracking-wider text-slate-400">{title}</div></div>;
}

function Kpi({ label, value, icon: Icon, danger }: { label: string; value: string; icon: any; danger?: boolean }) {
  return <div className="rounded-xl border border-cyan-400/15 bg-[#06101d]/75 p-4"><div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400"><Icon className="h-4 w-4 text-cyan-300" />{label}</div><div className={danger ? "mt-3 text-3xl font-black text-red-300" : "mt-3 text-3xl font-black text-white"}>{value}</div></div>;
}

function ChillersPage() {
  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4">
          <div className="flex items-center gap-3"><span className={`grid h-11 w-11 place-items-center rounded-xl border ${tone.border} ${tone.text}`}><Snowflake /></span><div><div className={`text-2xl font-black uppercase ${tone.text}`}>{selected.name}</div><div className="text-sm text-slate-400">Cockpit operacional • renderização com identidade visual do equipamento</div></div></div>
          <div className="flex gap-2">{chillers.map(c => <button key={c.id} className={`rounded-xl border px-4 py-2 text-sm font-bold ${c.id === selected.id ? `${toneClasses(c.tone).border} ${toneClasses(c.tone).text} bg-white/5` : `${toneClasses(c.tone).border} ${toneClasses(c.tone).text} bg-slate-950/40 opacity-75`}`}>{c.name}</button>)}</div>
        </div>

        <section className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          <Kpi label="Saúde" value={`${selected.health}%`} icon={CircleGauge} />
          <Kpi label="Capacidade" value={`${selected.capacityTotal}%`} icon={Activity} />
          <Kpi label="Delta T" value={`${deltaT(selected).toFixed(1).replace('.', ',')} °C`} icon={Droplets} danger={deltaT(selected) < 2} />
          <Kpi label="Erro Setpoint" value={`${(selected.supplyTemp - selected.setpoint).toFixed(1).replace('.', ',')} °C`} icon={Snowflake} />
          <Kpi label="Anomalias" value={`${selected.anomalies}`} icon={AlertTriangle} danger={selected.anomalies > 0} />
          <Kpi label="Risco" value={`${selected.risk}%`} icon={BrainCircuit} danger={selected.risk > 30} />
          <Kpi label="Temp. Externa" value={`${selected.externalTemp.toFixed(1).replace('.', ',')} °C`} icon={Fan} />
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1.15fr_.85fr]">
          <ChillerRender chiller={selected} />
          <div className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4">
            <h3 className="mb-3 text-lg font-black uppercase">Dados principais</h3>
            <div className="space-y-2 text-sm">
              <Row label="Limite de Demanda" value={`${selected.demandLimit}%`} />
              <Row label="Setpoint Água Gelada" value={`${selected.setpoint.toFixed(1).replace('.', ',')} °C`} />
              <Row label="Temp. Retorno" value={`${selected.returnTemp.toFixed(1).replace('.', ',')} °C`} />
              <Row label="Temp. Alimentação" value={`${selected.supplyTemp.toFixed(1).replace('.', ',')} °C`} />
              <Row label="Status de Alarme" value={selected.alarmStatus} danger={selected.alarmStatus !== "Normal"} />
              <Row label="Alarme Ativo" value={selected.activeAlarm} danger={selected.activeAlarm > 0} />
              <Row label="Horas de Operação" value={`${selected.operatingHours.toLocaleString("pt-BR")} h`} />
              <Row label="Partidas Hoje" value={selected.startsToday} danger={selected.startsToday > 20} />
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          {selected.circuits.map(c => <div key={c.id} className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4"><h3 className={c.id === "A" ? "font-black uppercase text-cyan-300" : "font-black uppercase text-purple-300"}>Circuito {c.id}</h3><div className="mt-3 grid grid-cols-2 gap-3 text-sm"><Row label="Capacidade" value={`${c.capacity}%`} /><Row label="Compressor 01" value={c.compressor1} /><Row label="Pressão Alta" value={`${c.highPressure} kPa`} danger={c.highPressure > 750} /><Row label="Compressor 02" value={c.compressor2} danger={c.compressor2 === "Desligado"} /><Row label="Pressão Baixa" value={`${c.lowPressure} kPa`} /><Row label="Partidas Hoje" value={c.startsToday} danger={c.startsToday > 12} /><Row label="Pressão Óleo CP1" value={`${c.oilCp1} kPa`} /><Row label="Pressão Óleo CP2" value={`${c.oilCp2} kPa`} /></div></div>)}
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          <Chart title="Temperatura Água Gelada"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="retorno" stroke="#38bdf8" dot={false}/><Line dataKey="saida" stroke="#22d3ee" dot={false}/><Line dataKey="setpoint" stroke="#c084fc" strokeDasharray="4 4" dot={false}/></LineChart></Chart>
          <Chart title="Delta T"><AreaChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Area dataKey="deltaT" stroke="#22c55e" fill="#22c55e22"/></AreaChart></Chart>
          <Chart title="Pressões A x B"><LineChart data={trend24h}><CartesianGrid stroke="#1e293b"/><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{background:'#020617',border:'1px solid rgba(34,211,238,.2)'}}/><Line dataKey="pressaoA" stroke="#22d3ee" dot={false}/><Line dataKey="pressaoB" stroke="#f472b6" dot={false}/></LineChart></Chart>
        </section>

        <section className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4"><h3 className="mb-3 flex items-center gap-2 text-cyan-300"><BrainCircuit className="h-5 w-5"/>Insights da IA</h3><div className="grid gap-3 md:grid-cols-3">{systemInsights.slice(0,3).map(i => <div key={i.title} className="rounded-xl border border-white/10 bg-white/[.03] p-3"><div className="text-xs text-slate-500">{i.time} • Confiança {i.confidence}%</div><div className="mt-1 font-bold text-white">{i.title}</div><div className="mt-2 text-sm leading-5 text-slate-400">{i.message}</div></div>)}</div></section>
      </div>
    </AppShell>
  );
}

function Row({ label, value, danger }: { label: string; value: any; danger?: boolean }) { return <div className="flex justify-between gap-3 border-b border-white/5 pb-1"><span className="text-slate-400">{label}</span><span className={danger ? "font-bold text-red-300" : "font-bold text-slate-100"}>{value}</span></div>; }
function Chart({ title, children }: { title: string; children: ReactElement }) { return <div className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4"><h3 className="mb-3 font-bold uppercase">{title}</h3><div className="h-56"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>; }
