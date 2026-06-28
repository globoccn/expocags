import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertTriangle, ArrowRight, Bell, Bot, CalendarDays, CheckCircle2, CircuitBoard, Droplets, LineChart, Sparkles, Wrench } from "lucide-react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { cn } from "@/lib/utils";
import { dash, EmptyState, fmt, LoadingState, periodTitle, statusTone, useDashboard } from "@/lib/dashboard-api";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Home — CAG Expo Center Norte" }] }),
  component: Index,
});

type Tone = "info" | "ok" | "warn" | "crit" | "ai";
const toneClass: Record<Tone, string> = {
  info: "border-sky-400/40 bg-sky-400/10 text-sky-300",
  ok: "border-emerald-400/40 bg-emerald-400/10 text-emerald-300",
  warn: "border-amber-400/40 bg-amber-400/10 text-amber-300",
  crit: "border-rose-400/40 bg-rose-400/10 text-rose-300",
  ai: "border-violet-400/40 bg-violet-400/10 text-violet-300",
};
const chillerImages: Record<string, string> = { azul: chillerBlue, vermelho: chillerRed, branco: chillerWhite };
const colorLabel: Record<string, string> = { azul: "Azul", vermelho: "Vermelho", branco: "Branco" };

function toneFrom(status: string): Tone {
  const t = statusTone(status);
  if (t === "crit") return "crit";
  if (t === "warn") return "warn";
  if (t === "ok") return "ok";
  return "info";
}
function cardIcon(id: string) {
  if (id.includes("chiller")) return CircuitBoard;
  if (id.includes("bomba")) return Droplets;
  if (id.includes("alarme")) return Bell;
  if (id.includes("cobertura") || id.includes("dado")) return LineChart;
  return AlertTriangle;
}

function Kpi({ card }: { card: any }) {
  const tone = toneFrom(card?.status);
  const Icon = cardIcon(String(card?.id || card?.label || ""));
  return (
    <div className="group relative overflow-hidden rounded-3xl border border-border/55 bg-surface-1/80 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.22)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-primary/40">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.13),transparent_42%)] opacity-70" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{dash(card?.label)}</p>
          <div className="mt-3 flex items-end gap-2">
            <span className="font-display text-4xl font-bold tracking-tight">{dash(card?.value)}</span>
            {card?.detail && <span className="mb-1 text-xs text-muted-foreground">{card.detail}</span>}
          </div>
        </div>
        <div className={cn("grid h-11 w-11 place-items-center rounded-2xl border", toneClass[tone])}><Icon className="h-5 w-5" /></div>
      </div>
    </div>
  );
}

function ChillerMini({ chiller }: { chiller: any }) {
  const id = chiller?.id || "azul";
  const tone = toneFrom(chiller?.status);
  return (
    <Link to="/chillers" className="group overflow-hidden rounded-3xl border border-border/60 bg-surface-1/80 p-4 transition hover:-translate-y-0.5 hover:border-primary/45">
      <div className="flex gap-4">
        <div className="relative h-28 w-32 shrink-0 overflow-hidden rounded-2xl border border-border/50 bg-black/20 p-2">
          <img src={chillerImages[id] || chillerBlue} alt={dash(chiller?.name)} className="h-full w-full object-contain" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-display text-lg font-bold">{dash(chiller?.name || `Chiller ${colorLabel[id] || id}`)}</h3>
            <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em]", toneClass[tone])}>{dash(chiller?.status_label || chiller?.status)}</span>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
            <Mini label="Horas" value={fmt(chiller?.tempo_ligado_horas, 1, " h")} />
            <Mini label="Delta T" value={fmt(chiller?.delta_t?.avg, 1, " °C")} />
            <Mini label="Setpoint" value={chiller?.setpoint_atingido !== undefined ? fmt(chiller.setpoint_atingido, 0, "%") : dash(chiller?.setpoint_atingido_label)} />
          </div>
          <p className="mt-3 line-clamp-2 text-xs text-muted-foreground">{dash(chiller?.principal_ocorrencia)}</p>
        </div>
      </div>
    </Link>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return <div className="rounded-2xl border border-border/45 bg-background/35 p-2"><div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</div><div className="mt-1 font-mono font-semibold text-foreground">{value}</div></div>;
}

function Index() {
  const { data, loading, error } = useDashboard();
  if (loading) return <LoadingState />;
  if (error || !data) return <EmptyState message={error || "Sem dados para exibir."} />;
  const cards = data.home?.cards || [];
  const chillers = data.chillers?.items || [];
  const occ = data.home?.ocorrencias_dia || data.alarmes?.timeline || [];
  const recs = data.home?.acoes_recomendadas || data.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias || [];
  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-[2rem] border border-primary/20 bg-[linear-gradient(135deg,rgba(15,23,42,0.92),rgba(2,8,23,0.96))] p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_0%,rgba(56,189,248,0.20),transparent_42%),radial-gradient(circle_at_85%_20%,rgba(168,85,247,0.15),transparent_36%)]" />
        <div className="relative flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Centro de Inteligência CAG</div>
            <h1 className="mt-4 font-display text-4xl font-bold tracking-tight">Visão Geral da Central</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">Resumo operacional consolidado de chillers, bombas, tendências e alarmes.</p>
          </div>
          <div className="rounded-2xl border border-border/50 bg-background/35 px-4 py-3 text-sm">
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Período analisado</div>
            <div className="mt-1 font-mono font-semibold text-primary">{periodTitle(data)}</div>
          </div>
        </div>
      </section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">{cards.map((c: any) => <Kpi key={c.id || c.label} card={c} />)}</section>
      <section className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <div className="rounded-3xl border border-border/60 bg-surface-1/80 p-5">
          <div className="mb-4 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Chillers</h2><Link to="/chillers" className="text-xs font-semibold text-primary inline-flex items-center gap-1">Ver detalhes <ArrowRight className="h-3.5 w-3.5" /></Link></div>
          <div className="grid gap-3">{chillers.map((c: any) => <ChillerMini key={c.id} chiller={c} />)}</div>
        </div>
        <div className="space-y-4">
          <Panel title="Principais ocorrências" icon={<Bell className="h-4 w-4" />}>{occ.slice(0,5).map((e: any, i: number) => <Row key={i} title={e.titulo || e.title || e.sintoma} desc={e.detalhe || e.detail || e.equipamento || e.equipment} />)}</Panel>
          <Panel title="Ações recomendadas" icon={<Wrench className="h-4 w-4" />}>{recs.slice(0,5).map((r: any, i: number) => <Row key={i} title={typeof r === "string" ? r : r.title} desc={typeof r === "string" ? "" : r.desc} ok />)}</Panel>
        </div>
      </section>
    </div>
  );
}
function Panel({ title, icon, children }: { title: string; icon: any; children: any }) { return <div className="rounded-3xl border border-border/60 bg-surface-1/80 p-5"><h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-foreground">{icon}{title}</h2><div className="space-y-3">{children}</div></div>; }
function Row({ title, desc, ok }: { title: any; desc?: any; ok?: boolean }) { return <div className="rounded-2xl border border-border/45 bg-background/35 p-3"><div className="flex items-start gap-2"><span className={cn("mt-0.5 grid h-6 w-6 place-items-center rounded-full border", ok ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300" : "border-amber-400/40 bg-amber-400/10 text-amber-300")}>{ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <AlertTriangle className="h-3.5 w-3.5" />}</span><div><p className="text-sm font-semibold">{dash(title)}</p>{desc && <p className="mt-1 text-xs text-muted-foreground">{desc}</p>}</div></div></div>; }
