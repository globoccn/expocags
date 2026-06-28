import { createFileRoute } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Database,
  FileText,
  MessageSquareText,
  Send,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { cn } from "@/lib/utils";
import { apiIdToUi, labelForPeriod, textInt, useDashboard } from "@/lib/dashboard-api";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Assistente de Manutenção — CAG Expo Center Norte" }] }),
  component: AIPage,
});

type Severity = "crit" | "warn" | "ok";
type Diagnostic = {
  id: string;
  equipment: string;
  group: "red" | "blue" | "white";
  severity: Severity;
  symptom: string;
  evidence: string[];
  possibleCauses: string[];
  recommendedActions: string[];
  metricLabel: string;
  metricValue: string;
  spark: number[];
};

const groupTheme = {
  blue: {
    label: "Azul",
    image: chillerBlue,
    text: "text-sky-300",
    border: "border-sky-400/35",
    bg: "from-sky-500/12 via-sky-500/5 to-transparent",
    dot: "bg-sky-400",
    line: "#38bdf8",
  },
  red: {
    label: "Vermelho",
    image: chillerRed,
    text: "text-rose-300",
    border: "border-rose-500/50",
    bg: "from-rose-500/14 via-rose-500/5 to-transparent",
    dot: "bg-rose-500",
    line: "#fb7185",
  },
  white: {
    label: "Branco",
    image: chillerWhite,
    text: "text-slate-100",
    border: "border-slate-300/35",
    bg: "from-slate-300/12 via-slate-300/4 to-transparent",
    dot: "bg-slate-100",
    line: "#cbd5e1",
  },
};

const severityConfig = {
  crit: {
    label: "Crítica",
    className: "border-rose-500/55 bg-rose-500/10 text-rose-300 shadow-[0_0_28px_rgba(244,63,94,0.16)]",
    badge: "border-rose-500/45 bg-rose-500/15 text-rose-300",
    icon: AlertTriangle,
  },
  warn: {
    label: "Atenção",
    className: "border-yellow-400/45 bg-yellow-400/10 text-yellow-300 shadow-[0_0_26px_rgba(250,204,21,0.12)]",
    badge: "border-yellow-400/45 bg-yellow-400/15 text-yellow-300",
    icon: AlertTriangle,
  },
  ok: {
    label: "Normal",
    className: "border-slate-300/35 bg-slate-300/5 text-slate-200",
    badge: "border-slate-300/30 bg-slate-300/8 text-slate-200",
    icon: ShieldCheck,
  },
};

const quickQuestionIcons = [MessageSquareText, ClipboardList, Wrench, AlertTriangle, FileText];

function makeDiagnostics(payload: any): Diagnostic[] {
  const list = payload?.assistente_ia?.diagnosticos || [];
  return list.map((d: any, index: number) => {
    const idRaw = d.equipamento_id || d.equipment_id || d.equipamento || "blue";
    const group = apiIdToUi[idRaw] || (String(d.equipamento || "").toLowerCase().includes("vermelho") ? "red" : String(d.equipamento || "").toLowerCase().includes("branco") ? "white" : "blue");
    const severity = String(d.prioridade || d.severity || "warn").toLowerCase().includes("crit") || String(d.prioridade || "").toLowerCase().includes("alta") ? "crit" : String(d.prioridade || d.severity || "").toLowerCase().includes("normal") ? "ok" : "warn";
    return {
      id: d.id || `dx-${index}`,
      equipment: d.equipamento || d.equipment || "Equipamento",
      group,
      severity,
      symptom: d.sintoma || d.title || "Ocorrência operacional",
      evidence: d.evidencias || d.evidence || [],
      possibleCauses: d.possiveis_causas || d.possibleCauses || [],
      recommendedActions: d.acoes_recomendadas || d.recommendedActions || [],
      metricLabel: d.metricLabel || "Indicador",
      metricValue: d.metricValue || "--",
      spark: d.spark || [0, 0, 0, 0],
    };
  });
}

function Sparkline({ values, color }: { values: number[]; color: string }) {
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 34 - ((value - min) / range) * 26;
      return `${x.toFixed(2)},${y.toFixed(2)}`;
    })
    .join(" ");

  return (
    <svg viewBox="0 0 100 40" className="h-14 w-full overflow-visible">
      <defs>
        <linearGradient id={`spark-${color.replace("#", "")}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={color} stopOpacity="0.25" />
          <stop offset="1" stopColor={color} stopOpacity="1" />
        </linearGradient>
      </defs>
      <polyline fill="none" points={points} stroke={`url(#spark-${color.replace("#", "")})`} strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" />
    </svg>
  );
}

function SummaryMetric({ icon: Icon, label, value, hint, tone = "ai" }: { icon: typeof CalendarDays; label: string; value: string; hint: string; tone?: "ai" | "warn" | "crit" | "ok" }) {
  const toneClass = {
    ai: "bg-status-ai/15 text-status-ai",
    warn: "bg-yellow-400/12 text-yellow-300",
    crit: "bg-rose-500/12 text-rose-300",
    ok: "bg-emerald-400/12 text-emerald-300",
  }[tone];

  return (
    <div className="flex min-w-0 items-center gap-4 border-r border-border/40 pr-4 last:border-r-0">
      <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-2xl", toneClass)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="font-display text-xl font-bold text-foreground">{value}</div>
        <div className="text-xs text-muted-foreground">{hint}</div>
      </div>
    </div>
  );
}

function DiagnosticCard({ diagnostic }: { diagnostic: Diagnostic }) {
  const theme = groupTheme[diagnostic.group];
  const severity = severityConfig[diagnostic.severity];
  const SeverityIcon = severity.icon;

  return (
    <article className={cn("relative overflow-hidden rounded-2xl border bg-surface-1/70 p-5", theme.border, severity.className)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70", theme.bg)} />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-border/50 bg-black/20">
              <img src={theme.image} alt={diagnostic.equipment} className="h-14 w-14 object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.12)]" />
            </div>
            <div>
              <div className={cn("font-display text-base font-bold", theme.text)}>{diagnostic.equipment}</div>
              <div className="mt-3 text-[11px] text-muted-foreground">Sintoma identificado</div>
              <div className="text-sm font-semibold text-foreground">{diagnostic.symptom}</div>
            </div>
          </div>
          <div className={cn("flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold", severity.badge)}>
            <SeverityIcon className="h-3.5 w-3.5" />
            {severity.label}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_160px]">
          <div className="space-y-4">
            <SectionList title="Evidências medidas" items={diagnostic.evidence} />
            <SectionList title="Possíveis causas" items={diagnostic.possibleCauses.length ? diagnostic.possibleCauses : ["Nenhuma hipótese de falha relevante com os dados do período."]} />
            <SectionList title="Ações recomendadas" items={diagnostic.recommendedActions} />
          </div>
          <div className="rounded-xl border border-border/50 bg-background/35 p-3">
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{diagnostic.metricLabel}</span>
              <Sparkles className="h-3 w-3" />
            </div>
            <div className="font-display text-3xl font-bold text-foreground">{diagnostic.metricValue}</div>
            <Sparkline values={diagnostic.spark} color={theme.line} />
            <div className="text-[10px] text-muted-foreground">0h → 24h</div>
          </div>
        </div>

        <button className="ml-auto flex items-center gap-2 rounded-lg border border-status-ai/45 bg-status-ai/10 px-4 py-2 text-sm font-semibold text-status-ai transition hover:bg-status-ai/15">
          Ver detalhes
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </article>
  );
}

function SectionList({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-current opacity-70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AIPage() {
  const { period, payload } = useDashboard();
  const diagnostics = makeDiagnostics(payload);
  const periodInfo = labelForPeriod(payload, period);
  const quickQuestions = (payload?.assistente_ia?.perguntas_rapidas || []).slice(0, 5).map((text: string, index: number) => ({ icon: quickQuestionIcons[index] || MessageSquareText, text }));
  const recentEvents = (payload?.alarmes?.timeline || []).slice(0, 5).map((e: any) => ({ time: e.time || "--", text: `${e.title || "Ocorrência"} — ${e.equipment || ""}`, tone: String(e.severity || "").toLowerCase().includes("crit") ? "crit" as Severity : String(e.severity || "").toLowerCase().includes("aten") ? "warn" as Severity : "ok" as Severity }));
  const priorityActions = (payload?.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias || payload?.alarmes?.recomendacoes_operacionais || []).slice(0, 4).map((text: string) => ({ text, severity: "warn" as Severity }));
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-status-ai">
            <Sparkles className="h-3.5 w-3.5" /> Assistente CAG
          </div>
          <h1 className="font-display text-3xl font-bold">Assistente de Manutenção</h1>
          <p className="text-sm text-muted-foreground">Interpretação técnica dos diagnósticos operacionais do período analisado.</p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-status-ai/50 bg-status-ai/10 px-5 py-3 text-sm font-semibold text-status-ai shadow-[0_0_22px_rgba(168,85,247,0.13)] transition hover:bg-status-ai/15">
          <FileText className="h-4 w-4" /> Exportar relatório
        </button>
      </div>

      <section className="rounded-2xl border border-status-ai/45 bg-gradient-to-br from-status-ai/12 via-surface-1/70 to-background/40 p-5 shadow-[0_0_36px_rgba(168,85,247,0.12)]">
        <div className="mb-5 font-display text-sm font-bold uppercase tracking-wider text-foreground">Resumo do período analisado</div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric icon={CalendarDays} label="Período analisado" value={`${periodInfo.label} (${periodInfo.date})`} hint="Período selecionado" tone="ai" />
          <SummaryMetric icon={AlertTriangle} label="Equipamentos em atenção" value={textInt(payload?.assistente_ia?.resumo_periodo?.equipamentos_em_atencao?.length)} hint="monitorados" tone="warn" />
          <SummaryMetric icon={Wrench} label="Principais ocorrências" value={textInt(payload?.assistente_ia?.resumo_periodo?.principais_ocorrencias?.length)} hint="eventos relevantes" tone="crit" />
          <SummaryMetric icon={ClipboardList} label="Recomendações prioritárias" value={textInt(payload?.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias?.length)} hint="ações sugeridas" tone="ai" />
          <SummaryMetric icon={Database} label="Cobertura dos dados" value={textInt(payload?.coverage_pct, "%")} hint="completude do período" tone="ok" />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-4">
        <div className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Perguntas rápidas</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {quickQuestions.map(({ icon: Icon, text }) => (
            <button key={text} className="flex min-h-[72px] items-center gap-3 rounded-xl border border-status-ai/12 bg-status-ai/8 px-4 text-left text-sm font-medium text-foreground transition hover:border-status-ai/40 hover:bg-status-ai/12">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
                <Icon className="h-5 w-5" />
              </span>
              {text}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center gap-2">
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">Diagnósticos do período</h2>
          <span className="grid h-4 w-4 place-items-center rounded-full border border-status-ai/40 text-[10px] text-status-ai">i</span>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {diagnostics.map((diagnostic) => (
            <DiagnosticCard key={diagnostic.id} diagnostic={diagnostic} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-5">
          <div className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Eventos recentes (D-1)</div>
          <div className="space-y-3">
            {recentEvents.map((event) => {
              const severity = severityConfig[event.tone];
              return (
                <div key={`${event.time}-${event.text}`} className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/25 px-4 py-3">
                  <div className="w-12 font-mono text-sm font-bold text-foreground">{event.time}</div>
                  <div className={cn("h-3 w-3 rounded-full", event.tone === "crit" ? "bg-rose-500" : event.tone === "warn" ? "bg-yellow-400" : "bg-sky-400")} />
                  <div className="min-w-0 flex-1 text-sm text-muted-foreground">{event.text}</div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", severity.badge)}>{severity.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-5">
          <div className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">Recomendações prioritárias</div>
          <div className="space-y-3">
            {priorityActions.map((action, index) => {
              const severity = severityConfig[action.severity];
              return (
                <div key={action.text} className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/25 px-4 py-3">
                  <div className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm font-bold", severity.badge)}>{index + 1}</div>
                  <div className="flex-1 text-sm font-medium text-foreground">{action.text}</div>
                  <span className={cn("rounded-full border px-2.5 py-1 text-[10px] font-bold", severity.badge)}>{severity.label}</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-status-ai/45 bg-status-ai/8 p-4 shadow-[0_0_32px_rgba(168,85,247,0.10)]">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
            <Bot className="h-5 w-5" />
          </div>
          <input
            className="h-12 flex-1 rounded-xl border border-status-ai/20 bg-background/45 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-status-ai/60"
            placeholder="Pergunte sobre o período analisado..."
          />
          <button className="grid h-12 w-12 place-items-center rounded-xl border border-status-ai/45 bg-status-ai/15 text-status-ai transition hover:bg-status-ai/20">
            <Send className="h-5 w-5" />
          </button>
        </div>
        <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-status-ai" />
          A IA responde somente com base nos dados consolidados do período selecionado.
        </div>
      </section>
    </div>
  );
}
