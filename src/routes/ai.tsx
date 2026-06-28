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
import { dashboardTimeline, normalizeAiPayload, useDashboardPeriod } from "@/lib/cag-dashboard-api";

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
    className:
      "border-rose-500/55 bg-rose-500/10 text-rose-300 shadow-[0_0_28px_rgba(244,63,94,0.16)]",
    badge: "border-rose-500/45 bg-rose-500/15 text-rose-300",
    icon: AlertTriangle,
  },
  warn: {
    label: "Atenção",
    className:
      "border-yellow-400/45 bg-yellow-400/10 text-yellow-300 shadow-[0_0_26px_rgba(250,204,21,0.12)]",
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

const diagnostics: Diagnostic[] = [
  {
    id: "dx-red-01",
    equipment: "Chiller Vermelho",
    group: "red",
    severity: "crit",
    symptom: "Delta T abaixo do esperado",
    evidence: [
      "Delta T médio: 2,1 °C (abaixo da meta de 3,0 °C)",
      "Setpoint atingido em 18% do período",
      "Bypass do grupo Vermelho elevado: 64%",
      "Capacidade média do equipamento: 42%",
    ],
    possibleCauses: [
      "Fluxo elevado de água gelada",
      "Válvula bypass aberta",
      "Baixa troca térmica efetiva",
    ],
    recommendedActions: [
      "Verificar posição e condição da válvula bypass",
      "Conferir fluxo de água gelada no grupo Vermelho",
      "Validar sensores de temperatura de entrada e saída",
    ],
    metricLabel: "Delta T médio (°C)",
    metricValue: "2,1",
    spark: [3.2, 2.8, 2.5, 2.4, 2.2, 2.0, 2.1, 1.9, 2.1, 2.0, 1.8, 2.1],
  },
  {
    id: "dx-blue-01",
    equipment: "Chiller Azul",
    group: "blue",
    severity: "warn",
    symptom: "Setpoint não atingido com frequência",
    evidence: [
      "Setpoint atingido em 71% do tempo",
      "Delta T médio: 2,7 °C",
      "Capacidade média: 67%",
      "Pressão da linha: 0,85 bar abaixo do setpoint",
    ],
    possibleCauses: [
      "Pressão da linha abaixo do setpoint",
      "BAG2 operando por período reduzido",
      "Válvula bypass parcialmente aberta",
    ],
    recommendedActions: [
      "Verificar operação da BAG2",
      "Ajustar válvula bypass do grupo Azul",
      "Investigar causa da baixa pressão da linha",
    ],
    metricLabel: "Setpoint atingido (%)",
    metricValue: "71%",
    spark: [78, 76, 75, 71, 69, 68, 70, 72, 71, 69, 73, 71],
  },
  {
    id: "dx-white-01",
    equipment: "Chiller Branco",
    group: "white",
    severity: "ok",
    symptom: "Operação dentro do esperado",
    evidence: [
      "Delta T médio: 3,3 °C",
      "Setpoint atingido em 96% do tempo",
      "Capacidade média: 78%",
      "Pressão da linha dentro do setpoint",
    ],
    possibleCauses: [],
    recommendedActions: [
      "Manter monitoramento contínuo",
      "Validar leituras no próximo ciclo diário",
    ],
    metricLabel: "Delta T médio (°C)",
    metricValue: "3,3",
    spark: [3.1, 3.2, 3.4, 3.3, 3.2, 3.4, 3.5, 3.3, 3.2, 3.3, 3.4, 3.3],
  },
];

const quickQuestions = [
  { icon: MessageSquareText, text: "Por que o Chiller Vermelho está em atenção?" },
  { icon: ClipboardList, text: "Quais ações devo executar primeiro?" },
  { icon: Wrench, text: "As bombas explicam o comportamento dos chillers?" },
  { icon: AlertTriangle, text: "Mostrar apenas ocorrências críticas" },
  { icon: FileText, text: "Resumo executivo do período" },
];

const recentEvents = [
  {
    time: "06:45",
    text: "Delta T abaixo do esperado — Chiller Vermelho",
    tone: "crit" as Severity,
  },
  {
    time: "05:12",
    text: "Pressão da linha abaixo do setpoint — Grupo Azul",
    tone: "warn" as Severity,
  },
  { time: "03:18", text: "BAG2 do grupo Azul parada por baixa pressão", tone: "warn" as Severity },
  {
    time: "02:30",
    text: "Válvula bypass do grupo Vermelho aberta em 64%",
    tone: "warn" as Severity,
  },
  {
    time: "01:22",
    text: "BAG3 do grupo Vermelho iniciada automaticamente",
    tone: "ok" as Severity,
  },
];

const priorityActions = [
  { text: "Verificar e ajustar a válvula bypass do grupo Vermelho", severity: "crit" as Severity },
  { text: "Conferir fluxo de água gelada no grupo Vermelho", severity: "crit" as Severity },
  { text: "Investigar causa da baixa pressão no grupo Azul", severity: "warn" as Severity },
  { text: "Validar sensores de temperatura dos chillers", severity: "warn" as Severity },
];

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
      <polyline
        fill="none"
        points={points}
        stroke={`url(#spark-${color.replace("#", "")})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      />
    </svg>
  );
}

function SummaryMetric({
  icon: Icon,
  label,
  value,
  hint,
  tone = "ai",
}: {
  icon: typeof CalendarDays;
  label: string;
  value: string;
  hint: string;
  tone?: "ai" | "warn" | "crit" | "ok";
}) {
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
    <article
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-surface-1/70 p-5",
        theme.border,
        severity.className,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-0 bg-gradient-to-br opacity-70",
          theme.bg,
        )}
      />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex gap-4">
            <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-xl border border-border/50 bg-black/20">
              <img
                src={theme.image}
                alt={diagnostic.equipment}
                className="h-14 w-14 object-contain drop-shadow-[0_0_16px_rgba(255,255,255,0.12)]"
              />
            </div>
            <div>
              <div className={cn("font-display text-base font-bold", theme.text)}>
                {diagnostic.equipment}
              </div>
              <div className="mt-3 text-[11px] text-muted-foreground">Sintoma identificado</div>
              <div className="text-sm font-semibold text-foreground">{diagnostic.symptom}</div>
            </div>
          </div>
          <div
            className={cn(
              "flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-bold",
              severity.badge,
            )}
          >
            <SeverityIcon className="h-3.5 w-3.5" />
            {severity.label}
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[1fr_160px]">
          <div className="space-y-4">
            <SectionList title="Evidências medidas" items={diagnostic.evidence} />
            <SectionList
              title="Possíveis causas"
              items={
                diagnostic.possibleCauses.length
                  ? diagnostic.possibleCauses
                  : ["Nenhuma hipótese de falha relevante com os dados do período."]
              }
            />
            <SectionList title="Ações recomendadas" items={diagnostic.recommendedActions} />
          </div>
          <div className="rounded-xl border border-border/50 bg-background/35 p-3">
            <div className="mb-1 flex items-center justify-between gap-2 text-[10px] uppercase tracking-wider text-muted-foreground">
              <span>{diagnostic.metricLabel}</span>
              <Sparkles className="h-3 w-3" />
            </div>
            <div className="font-display text-3xl font-bold text-foreground">
              {diagnostic.metricValue}
            </div>
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
      <div className="mb-2 text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
        {title}
      </div>
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
  const { period, data: apiPayload, loading, error } = useDashboardPeriod();
  const aiData = normalizeAiPayload(apiPayload);
  if (loading || !apiPayload) {
    return <div className="glass-card p-6 text-sm text-muted-foreground">Carregando análise real da API...</div>;
  }
  if (error) {
    return <div className="glass-card border-status-warn/40 p-6 text-sm text-status-warn">{error}</div>;
  }
  const diagnosticsToShow = aiData.diagnostics;
  const quickQuestionsToShow = aiData.quickQuestions.length
    ? aiData.quickQuestions.map((text: string, index: number) => ({
        icon: quickQuestions[index % quickQuestions.length].icon,
        text,
      }))
    : [];
  const recentEventsToShow = dashboardTimeline(apiPayload)
    .slice(0, 5)
    .map((e: any) => ({
      time: e.time,
      text: `${e.title} — ${e.equipment}`,
      tone: String(e.severity).toLowerCase().includes("crit")
        ? ("crit" as Severity)
        : String(e.severity).toLowerCase().includes("aten")
          ? ("warn" as Severity)
          : ("ok" as Severity),
    }));
  const priorityActionsToShow = aiData.recommendations
    .slice(0, 5)
    .map((text: string, index: number) => ({
      text,
      severity: index < 2 ? ("crit" as Severity) : ("warn" as Severity),
    }));
  const summary = aiData.summary || {};
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-status-ai">
            <Sparkles className="h-3.5 w-3.5" /> Assistente CAG
          </div>
          <h1 className="font-display text-3xl font-bold">Assistente de Manutenção</h1>
          <p className="text-sm text-muted-foreground">
            Interpretação técnica dos diagnósticos operacionais do período analisado.
          </p>
        </div>
        <button className="flex items-center gap-2 rounded-xl border border-status-ai/50 bg-status-ai/10 px-5 py-3 text-sm font-semibold text-status-ai shadow-[0_0_22px_rgba(168,85,247,0.13)] transition hover:bg-status-ai/15">
          <FileText className="h-4 w-4" /> Exportar relatório
        </button>
      </div>

      <section className="rounded-2xl border border-status-ai/45 bg-gradient-to-br from-status-ai/12 via-surface-1/70 to-background/40 p-5 shadow-[0_0_36px_rgba(168,85,247,0.12)]">
        <div className="mb-5 font-display text-sm font-bold uppercase tracking-wider text-foreground">
          Resumo do período analisado
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryMetric
            icon={CalendarDays}
            label="Período analisado"
            value={
              summary.periodo_analisado ||
              (period === "7d" ? "7 dias" : period === "1m" ? "1 mês" : "D-1")
            }
            hint={summary.intervalo || "Período selecionado"}
            tone="ai"
          />
          <SummaryMetric
            icon={AlertTriangle}
            label="Equipamentos em atenção"
            value={String(summary.equipamentos_em_atencao ?? diagnosticsToShow.length)}
            hint="equipamentos monitorados"
            tone="warn"
          />
          <SummaryMetric
            icon={Wrench}
            label="Principais ocorrências"
            value={String(summary.principais_ocorrencias ?? diagnosticsToShow.length)}
            hint="eventos relevantes"
            tone="crit"
          />
          <SummaryMetric
            icon={ClipboardList}
            label="Recomendações prioritárias"
            value={String(summary.recomendacoes_prioritarias ?? priorityActionsToShow.length)}
            hint="ações sugeridas"
            tone="ai"
          />
          <SummaryMetric
            icon={Database}
            label="Cobertura dos dados"
            value={summary.cobertura_dados || "--"}
            hint="completude do período"
            tone="ok"
          />
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-4">
        <div className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Perguntas rápidas
        </div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
          {quickQuestionsToShow.map(({ icon: Icon, text }) => (
            <button
              key={text}
              className="flex min-h-[72px] items-center gap-3 rounded-xl border border-status-ai/12 bg-status-ai/8 px-4 text-left text-sm font-medium text-foreground transition hover:border-status-ai/40 hover:bg-status-ai/12"
            >
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
          <h2 className="font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Diagnósticos do período
          </h2>
          <span className="grid h-4 w-4 place-items-center rounded-full border border-status-ai/40 text-[10px] text-status-ai">
            i
          </span>
        </div>
        <div className="grid gap-4 xl:grid-cols-3">
          {diagnosticsToShow.map((diagnostic) => (
            <DiagnosticCard key={diagnostic.id} diagnostic={diagnostic} />
          ))}
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-2">
        <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-5">
          <div className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Eventos recentes
          </div>
          <div className="space-y-3">
            {recentEventsToShow.map((event) => {
              const severity = severityConfig[event.tone];
              return (
                <div
                  key={`${event.time}-${event.text}`}
                  className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/25 px-4 py-3"
                >
                  <div className="w-12 font-mono text-sm font-bold text-foreground">
                    {event.time}
                  </div>
                  <div
                    className={cn(
                      "h-3 w-3 rounded-full",
                      event.tone === "crit"
                        ? "bg-rose-500"
                        : event.tone === "warn"
                          ? "bg-yellow-400"
                          : "bg-sky-400",
                    )}
                  />
                  <div className="min-w-0 flex-1 text-sm text-muted-foreground">{event.text}</div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                      severity.badge,
                    )}
                  >
                    {severity.label}
                  </span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-5">
          <div className="mb-4 font-display text-sm font-bold uppercase tracking-wider text-foreground">
            Recomendações prioritárias
          </div>
          <div className="space-y-3">
            {priorityActionsToShow.map((action, index) => {
              const severity = severityConfig[action.severity];
              return (
                <div
                  key={action.text}
                  className="flex items-center gap-4 rounded-xl border border-border/35 bg-background/25 px-4 py-3"
                >
                  <div
                    className={cn(
                      "grid h-8 w-8 shrink-0 place-items-center rounded-full border font-display text-sm font-bold",
                      severity.badge,
                    )}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 text-sm font-medium text-foreground">{action.text}</div>
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-[10px] font-bold",
                      severity.badge,
                    )}
                  >
                    {severity.label}
                  </span>
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
          <CheckCircle2 className="h-4 w-4 text-status-ai" />A IA responde somente com base nos
          dados consolidados do período selecionado.
        </div>
      </section>
    </div>
  );
}
