import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BrainCircuit, CircleGauge, Droplets, Fan, ShieldCheck, Snowflake } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { chillers, allPumps, deltaT, systemInsights, toneClasses, trend24h } from "@/lib/cag-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Visão Geral" }] }),
  component: Overview,
});

function MetricCard({ title, value, subtitle, icon: Icon, tone = "cyan" }: { title: string; value: string | number; subtitle: string; icon: any; tone?: "cyan" | "green" | "orange" | "purple" }) {
  const color = tone === "green" ? "text-emerald-300 border-emerald-400/20" : tone === "orange" ? "text-orange-300 border-orange-400/20" : tone === "purple" ? "text-purple-300 border-purple-400/20" : "text-cyan-300 border-cyan-400/20";
  return (
    <div className={`rounded-2xl border ${color} bg-slate-950/60 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]`}>
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400"><Icon className={`h-4 w-4 ${color.split(' ')[0]}`} />{title}</div>
      <div className={`mt-3 text-4xl font-bold ${color.split(' ')[0]}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{subtitle}</div>
    </div>
  );
}

function ChillerCard({ chiller }: { chiller: (typeof chillers)[number] }) {
  const tone = toneClasses(chiller.tone);
  return (
    <Link to="/chillers" className={`group rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.bg} to-slate-950/80 p-5 transition hover:-translate-y-0.5 ${tone.glow}`}>
      <div className="flex items-start justify-between">
        <div className={`flex items-center gap-2 text-lg font-bold uppercase ${tone.text}`}><Snowflake className="h-5 w-5" />{chiller.name}</div>
        <span className="rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-xs font-semibold text-emerald-300">{chiller.status}</span>
      </div>
      <div className="mt-5 grid grid-cols-[130px_1fr] gap-4">
        <div className="relative grid h-28 w-28 place-items-center rounded-full border border-slate-700/60 bg-slate-950/70">
          <div className="absolute inset-2 rounded-full border-8 border-slate-800" />
          <div className="absolute inset-2 rounded-full border-8 border-emerald-400" style={{ clipPath: `polygon(0 0, ${chiller.health}% 0, ${chiller.health}% 100%, 0 100%)` }} />
          <div className="relative text-center"><div className="text-3xl font-bold text-white">{chiller.health}%</div><div className="text-xs text-slate-400">Saúde</div></div>
        </div>
        <div className="space-y-2 text-sm">
          <Row label="Capacidade Total" value={`${chiller.capacityTotal}%`} />
          <Row label="Delta T" value={`${deltaT(chiller)} °C`} danger={deltaT(chiller) < 2} />
          <Row label="Temp. Externa" value={`${chiller.externalTemp.toFixed(1)} °C`} />
          <Row label="Anomalias" value={chiller.anomalies} danger={chiller.anomalies > 0} />
          <Row label="Risco de Falha" value={`${chiller.risk}%`} danger={chiller.risk > 30} />
        </div>
      </div>
      <div className="mt-5 flex items-center gap-2 border-t border-white/10 pt-3 text-sm text-slate-300"><Droplets className="h-4 w-4 text-cyan-300" />Bombas: {chiller.pumps.length} ({chiller.pumps.filter(p => p.status === 'Running').length} Running)</div>
    </Link>
  );
}

function Row({ label, value, danger }: { label: string; value: any; danger?: boolean }) {
  return <div className="flex justify-between gap-3 border-b border-white/5 pb-1"><span className="text-slate-400">{label}</span><span className={danger ? "font-semibold text-red-300" : "font-semibold text-slate-100"}>{value}</span></div>;
}

function Overview() {
  const pumps = allPumps();
  const avgHealth = Math.round(chillers.reduce((sum, c) => sum + c.health, 0) / chillers.length);
  const alarms = chillers.reduce((sum, c) => sum + c.anomalies, 0) + pumps.filter(p => p.status === 'Falha').length;
  const pumpPie = [
    { name: 'Rodando', value: pumps.filter(p => p.status === 'Running').length, color: '#22c55e' },
    { name: 'Paradas', value: pumps.filter(p => p.status === 'Standby' || p.status === 'Parada').length, color: '#38bdf8' },
    { name: 'Falha', value: pumps.filter(p => p.status === 'Falha').length, color: '#ef4444' },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <MetricCard title="Saúde Geral da CAG" value={`${avgHealth}%`} subtitle="Boa" icon={ShieldCheck} tone="green" />
          <MetricCard title="Risco Geral" value="31%" subtitle="Baixo / moderado" icon={CircleGauge} tone="purple" />
          <MetricCard title="Anomalias Ativas" value={alarms} subtitle="2 críticas • 3 atenção" icon={AlertTriangle} tone="orange" />
          <MetricCard title="Chillers" value="3" subtitle="2 Running • 1 Standby" icon={Snowflake} />
          <MetricCard title="Bombas" value="12" subtitle={`${pumps.filter(p => p.status === 'Running').length} Running`} icon={Fan} />
          <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">Status das Bombas</div>
            <div className="mt-1 h-28"><ResponsiveContainer><PieChart><Pie data={pumpPie} dataKey="value" innerRadius={34} outerRadius={50}>{pumpPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer></div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
          <div className="rounded-3xl border border-cyan-400/15 bg-slate-950/50 p-4">
            <h2 className="mb-4 text-lg font-semibold uppercase tracking-wide text-white">Chillers</h2>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">{chillers.map(c => <ChillerCard key={c.id} chiller={c} />)}</div>
          </div>
          <aside className="space-y-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/70 p-4">
              <div className="flex items-center gap-2 text-cyan-300"><BrainCircuit className="h-5 w-5" /><h3 className="font-semibold uppercase">Recomendação da IA</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-300">A central opera com atenção moderada. O Chiller Vermelho apresenta Delta T abaixo do ideal com bombas em operação e válvula bypass parcialmente aberta.</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Recomenda-se verificar bypass, válvulas de controle e carga térmica real.</p>
              <Link to="/esg" className="mt-4 block rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-center text-xs font-bold uppercase text-cyan-200">Ver análise completa</Link>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/70 p-4">
              <div className="mb-3 flex justify-between text-sm"><h3 className="font-semibold uppercase text-white">Eventos Recentes</h3><span className="text-slate-500">Ver todos</span></div>
              <div className="space-y-3">{systemInsights.map((i) => <div key={`${i.time}-${i.title}`} className="grid grid-cols-[42px_1fr_auto] gap-2 text-xs"><span className="text-slate-400">{i.time}</span><span className="text-slate-300">{i.title} no {i.asset}</span><span className={i.severity === 'critical' ? 'text-red-300' : i.severity === 'attention' ? 'text-yellow-300' : 'text-cyan-300'}>{i.severity}</span></div>)}</div>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <ChartCard title="Temperatura Externa x Capacidade"><AreaChart data={trend24h}><defs><linearGradient id="cap" x1="0" x2="0" y1="0" y2="1"><stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35}/><stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/></linearGradient></defs><CartesianGrid stroke="#1e293b" /><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.2)' }} /><Area type="monotone" dataKey="capacidade" stroke="#22d3ee" fill="url(#cap)" /></AreaChart></ChartCard>
          <ChartCard title="Delta T x Bypass"><AreaChart data={trend24h}><CartesianGrid stroke="#1e293b" /><XAxis dataKey="time" stroke="#64748b"/><YAxis stroke="#64748b"/><Tooltip contentStyle={{ background: '#020617', border: '1px solid rgba(34,211,238,.2)' }} /><Area type="monotone" dataKey="deltaT" stroke="#22c55e" fill="#22c55e22" /><Area type="monotone" dataKey="bypass" stroke="#f97316" fill="#f9731622" /></AreaChart></ChartCard>
        </section>
      </div>
    </AppShell>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactElement }) {
  return <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4"><h3 className="mb-3 font-semibold uppercase text-white">{title}</h3><div className="h-60"><ResponsiveContainer>{children}</ResponsiveContainer></div></div>;
}
