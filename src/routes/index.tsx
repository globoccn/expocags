import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, BrainCircuit, CalendarDays, CircleGauge, Droplets, Fan, ShieldCheck, Snowflake, UserRound, Bell } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";
import { AppShell } from "@/components/layout/AppShell";
import { chillers, allPumps, deltaT, systemInsights, toneClasses, type ChillerData } from "@/lib/cag-data";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "CAG Intelligence AI — Visão Geral" }] }),
  component: Overview,
});

function KpiCard({ title, value, subtitle, icon: Icon, tone = "cyan", children }: { title: string; value: string | number; subtitle: string; icon: any; tone?: "cyan" | "green" | "orange" | "purple"; children?: ReactNode }) {
  const map = {
    cyan: "border-cyan-400/20 text-cyan-300 from-cyan-500/10",
    green: "border-emerald-400/20 text-emerald-300 from-emerald-500/10",
    orange: "border-orange-400/25 text-orange-300 from-orange-500/10",
    purple: "border-purple-400/25 text-purple-300 from-purple-500/10",
  }[tone];

  return (
    <div className={`relative min-h-[118px] overflow-hidden rounded-xl border ${map} bg-gradient-to-br to-[#06111f]/80 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.04)]`}>
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-300"><Icon className="h-4 w-4" />{title}</div>
      <div className="mt-3 text-[32px] font-extrabold leading-none tracking-tight">{value}</div>
      <div className="mt-2 text-xs text-slate-400">{subtitle}</div>
      {children && <div className="absolute bottom-4 right-4">{children}</div>}
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const cls = status === "Running" ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300" : status === "Standby" ? "border-sky-400/25 bg-sky-400/10 text-sky-300" : "border-orange-400/25 bg-orange-400/10 text-orange-300";
  return <span className={`rounded-full border px-3 py-1 text-[11px] font-bold ${cls}`}>{status}</span>;
}

function MiniChiller({ chiller }: { chiller: ChillerData }) {
  const tone = toneClasses(chiller.tone);
  const tint = chiller.tone === "red" ? "bg-red-500/28" : chiller.tone === "white" ? "bg-slate-100/22" : "bg-cyan-400/25";
  const glow = chiller.tone === "red" ? "shadow-[0_0_45px_rgba(248,113,113,.28)]" : chiller.tone === "white" ? "shadow-[0_0_45px_rgba(226,232,240,.20)]" : "shadow-[0_0_45px_rgba(34,211,238,.26)]";

  return (
    <div className="relative h-24 w-full overflow-hidden rounded-xl bg-[#020814]/70">
      <div className={`absolute inset-0 ${tint} mix-blend-screen`} />
      <img src="/assets/chiller-base.png" alt="Render do chiller" className={`absolute bottom-[-12px] left-1/2 h-[132px] w-[265px] -translate-x-1/2 object-contain opacity-95 saturate-125 ${glow}`} />
      <div className={`absolute inset-x-10 bottom-1 h-px ${chiller.tone === "red" ? "bg-red-300/70" : chiller.tone === "white" ? "bg-slate-100/70" : "bg-cyan-300/70"} blur-[1px]`} />
      <div className={`absolute inset-0 rounded-xl border ${tone.border}`} />
    </div>
  );
}

function HealthRing({ value, chiller }: { value: number; chiller: ChillerData }) {
  const ring = chiller.tone === "red" ? "#fb7185" : chiller.tone === "white" ? "#e2e8f0" : "#22d3ee";
  return (
    <div className="relative grid h-[104px] w-[104px] shrink-0 place-items-center rounded-full bg-slate-950/70">
      <svg className="absolute inset-0 h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="40" stroke="rgba(30,41,59,.9)" strokeWidth="8" fill="none" />
        <circle cx="50" cy="50" r="40" stroke={ring} strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray={`${value * 2.51} 251`} />
      </svg>
      <div className="relative text-center"><div className="text-3xl font-black text-white">{value}%</div><div className="text-[11px] text-slate-400">Saúde</div></div>
    </div>
  );
}

function ChillerCard({ chiller }: { chiller: ChillerData }) {
  const tone = toneClasses(chiller.tone);
  return (
    <Link to="/chillers" className={`group min-h-[225px] rounded-2xl border ${tone.border} bg-gradient-to-br ${tone.bg} to-[#050b16]/90 p-4 transition hover:-translate-y-0.5 ${tone.glow}`}>
      <div className="mb-3 flex items-center justify-between">
        <div className={`flex items-center gap-2 text-lg font-black uppercase tracking-wide ${tone.text}`}><Snowflake className="h-5 w-5" />{chiller.name}</div>
        <StatusPill status={chiller.status} />
      </div>

      <div className="grid grid-cols-[115px_1fr] gap-4">
        <HealthRing value={chiller.health} chiller={chiller} />
        <div className="space-y-2 text-sm">
          <Row label="Capacidade Total" value={`${chiller.capacityTotal}%`} />
          <Row label="Delta T" value={`${deltaT(chiller).toFixed(1).replace('.', ',')} °C`} danger={deltaT(chiller) < 2} />
          <Row label="Temp. Externa" value={`${chiller.externalTemp.toFixed(1).replace('.', ',')} °C`} />
          <Row label="Anomalias" value={chiller.anomalies} danger={chiller.anomalies > 0} />
          <Row label="Risco de Falha" value={`${chiller.risk}%`} danger={chiller.risk > 30} />
        </div>
      </div>

      <div className="mt-3"><MiniChiller chiller={chiller} /></div>
      <div className="mt-3 flex items-center gap-2 border-t border-white/10 pt-3 text-xs text-slate-300"><Droplets className="h-4 w-4 text-cyan-300" />Bombas: {chiller.pumps.length} ({chiller.pumps.filter(p => p.status === "Running").length} Running)</div>
    </Link>
  );
}

function Row({ label, value, danger }: { label: string; value: any; danger?: boolean }) {
  return <div className="flex justify-between gap-3 border-b border-white/5 pb-1"><span className="text-slate-400">{label}</span><span className={danger ? "font-bold text-red-300" : "font-bold text-slate-100"}>{value}</span></div>;
}

function Overview() {
  const pumps = allPumps();
  const avgHealth = Math.round(chillers.reduce((sum, c) => sum + c.health, 0) / chillers.length);
  const alarms = chillers.reduce((sum, c) => sum + c.anomalies, 0) + pumps.filter(p => p.status === "Falha").length;
  const pumpPie = [
    { name: "Rodando", value: pumps.filter(p => p.status === "Running").length, color: "#22c55e" },
    { name: "Paradas", value: pumps.filter(p => p.status === "Standby" || p.status === "Parada").length, color: "#38bdf8" },
    { name: "Falha", value: pumps.filter(p => p.status === "Falha").length, color: "#ef4444" },
  ];

  return (
    <AppShell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div><h1 className="text-2xl font-black uppercase tracking-wide text-white">Visão Geral da Central</h1><p className="text-xs uppercase tracking-[0.28em] text-cyan-200/55">Monitoramento inteligente da CAG</p></div>
          <div className="hidden items-center gap-3 text-xs text-slate-300 lg:flex"><CalendarDays className="h-4 w-4" />09/05/2025 10:30:45 <Bell className="h-4 w-4" /><UserRound className="h-4 w-4" /></div>
        </div>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard title="Saúde Geral da CAG" value={`${avgHealth}%`} subtitle="Boa" icon={ShieldCheck} tone="green" />
          <KpiCard title="Risco Geral" value="31%" subtitle="Baixo / moderado" icon={CircleGauge} tone="purple" />
          <KpiCard title="Anomalias Ativas" value={alarms} subtitle="2 críticas • 3 atenção" icon={AlertTriangle} tone="orange" />
          <KpiCard title="Chillers" value="3" subtitle="2 Running • 1 Standby" icon={Snowflake} />
          <KpiCard title="Bombas" value="12" subtitle={`${pumps.filter(p => p.status === "Running").length} Running`} icon={Fan} />
          <div className="relative min-h-[118px] rounded-xl border border-cyan-400/15 bg-[#06111f]/80 p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-slate-300">Status das Bombas</div>
            <div className="mt-1 grid grid-cols-[1fr_92px] items-center gap-1">
              <div className="space-y-1.5 text-xs">
                {pumpPie.map((p) => <div key={p.name} className="flex items-center justify-between gap-2"><span className="flex items-center gap-2 text-slate-400"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: p.color }} />{p.name}</span><b className="text-slate-100">{p.value}</b></div>)}
              </div>
              <div className="relative h-20"><ResponsiveContainer><PieChart><Pie data={pumpPie} dataKey="value" innerRadius={25} outerRadius={38}>{pumpPie.map((entry) => <Cell key={entry.name} fill={entry.color} />)}</Pie></PieChart></ResponsiveContainer><div className="absolute inset-0 grid place-items-center text-center text-xs font-bold text-white">12<br/><span className="text-[9px] text-slate-400">TOTAL</span></div></div>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-[1fr_330px]">
          <div className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/70 p-4 shadow-[inset_0_1px_0_rgba(255,255,255,.035)]">
            <h2 className="mb-4 text-lg font-black uppercase tracking-wide text-white">Chillers</h2>
            <div className="grid grid-cols-1 gap-4 2xl:grid-cols-3">{chillers.map(c => <ChillerCard key={c.id} chiller={c} />)}</div>
          </div>
          <aside className="space-y-3">
            <div className="rounded-2xl border border-cyan-400/20 bg-[#06101d]/80 p-4">
              <div className="flex items-center gap-2 text-cyan-300"><BrainCircuit className="h-5 w-5" /><h3 className="font-black uppercase">Recomendação da IA</h3></div>
              <p className="mt-4 text-sm leading-6 text-slate-300">A central opera com atenção moderada. O Chiller Vermelho apresenta Delta T abaixo do ideal com bombas em operação e válvula bypass parcialmente aberta.</p>
              <p className="mt-3 text-sm leading-6 text-slate-300">Recomenda-se verificar bypass, válvulas de controle e carga térmica real.</p>
              <Link to="/esg" className="mt-4 block rounded-xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-center text-xs font-black uppercase text-cyan-200">Ver análise completa</Link>
            </div>
            <div className="rounded-2xl border border-cyan-400/15 bg-[#06101d]/80 p-4">
              <div className="mb-3 flex justify-between text-sm"><h3 className="font-black uppercase text-white">Eventos Recentes</h3><span className="text-slate-500">Ver todos</span></div>
              <div className="space-y-3">{systemInsights.map((i) => <div key={`${i.time}-${i.title}`} className="grid grid-cols-[42px_1fr_auto] gap-2 text-xs"><span className="text-slate-400">{i.time}</span><span className="text-slate-300">{i.title} no {i.asset}</span><span className={i.severity === "critical" ? "text-red-300" : i.severity === "attention" ? "text-yellow-300" : "text-cyan-300"}>{i.severity}</span></div>)}</div>
            </div>
          </aside>
        </section>

        <section className="grid grid-cols-1 gap-4 xl:grid-cols-3">
          {chillers.map((chiller) => <Link to="/chillers" key={chiller.id} className={`rounded-2xl border ${toneClasses(chiller.tone).border} bg-[#06101d]/70 p-4 ${toneClasses(chiller.tone).glow}`}><div className="mb-3 flex items-center justify-between"><span className={`font-black uppercase ${toneClasses(chiller.tone).text}`}>{chiller.name}</span><StatusPill status={chiller.status} /></div><MiniChiller chiller={chiller}/><div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs"><div className="rounded-lg bg-white/[.03] p-2"><b className="text-white">{chiller.circuits[0].capacity}%</b><br/><span className="text-cyan-300">Circuito A</span></div><div className="rounded-lg bg-white/[.03] p-2"><b className="text-white">{chiller.circuits[1].capacity}%</b><br/><span className="text-purple-300">Circuito B</span></div><div className="rounded-lg bg-white/[.03] p-2"><b className="text-white">{chiller.startsToday}</b><br/><span className="text-slate-400">Partidas</span></div></div></Link>)}
        </section>
      </div>
    </AppShell>
  );
}
