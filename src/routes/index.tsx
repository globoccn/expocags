import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  CircuitBoard,
  Clock3,
  Database,
  Droplets,
  Fan,
  Gauge,
  Info,
  LineChart,
  Sparkles,
  ThermometerSun,
  Wrench,
} from "lucide-react";
import { useMemo, useState, type ReactNode } from "react";
import chillerBlue from "@/assets/chiller-blue.png";
import chillerRed from "@/assets/chiller-red.png";
import chillerWhite from "@/assets/chiller-white.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Home — CAG Expo Center Norte" },
      {
        name: "description",
        content: "Centro de inteligência operacional para chillers e bombas do CAG.",
      },
    ],
  }),
  component: Index,
});

type PeriodKey = "d1" | "week" | "month";
type Tone = "info" | "ok" | "warn" | "crit" | "ai";

const periodConfig: Record<
  PeriodKey,
  {
    label: string;
    short: string;
    analyzed: string;
    comparison: string;
    occurrencesTitle: string;
  }
> = {
  d1: {
    label: "D-1 (Ontem)",
    short: "D-1",
    analyzed: "25/05/2025 00:00 até 25/05/2025 23:59",
    comparison: "vs ontem anterior",
    occurrencesTitle: "Principais ocorrências do período",
  },
  week: {
    label: "Semana",
    short: "7 dias",
    analyzed: "19/05/2025 00:00 até 25/05/2025 23:59",
    comparison: "vs semana anterior",
    occurrencesTitle: "Principais ocorrências da semana",
  },
  month: {
    label: "Mês",
    short: "30 dias",
    analyzed: "01/05/2025 00:00 até 25/05/2025 23:59",
    comparison: "vs mês anterior",
    occurrencesTitle: "Principais ocorrências do mês",
  },
};

const periodData: Record<
  PeriodKey,
  {
    kpis: Array<{
      label: string;
      value: string;
      detail: string;
      previous: string;
      delta: string;
      deltaTone: "up" | "down" | "neutral";
      icon: typeof CircuitBoard;
      tone: Tone;
    }>;
    occurrences: Array<{
      title: string;
      desc: string;
      time: string;
      level: "Atenção" | "Crítico" | "Info";
      tone: Tone;
      icon: typeof ThermometerSun;
    }>;
    recommendations: Array<{ title: string; desc: string }>;
    chillers: Array<{
      id: "azul" | "vermelho" | "branco";
      name: string;
      status: "Normal" | "Atenção";
      hours: string;
      deltaT: string;
      setpoint: string;
      compare: string;
      note: string;
      tone: Tone;
    }>;
    summary: string;
  }
> = {
  d1: {
    kpis: [
      {
        label: "Chillers operando",
        value: "3",
        detail: "de 3",
        previous: "Ontem: 2 de 3",
        delta: "+1",
        deltaTone: "up",
        icon: CircuitBoard,
        tone: "info",
      },
      {
        label: "Bombas operando",
        value: "4",
        detail: "de 4",
        previous: "Ontem: 3 de 4",
        delta: "+1",
        deltaTone: "up",
        icon: Droplets,
        tone: "ok",
      },
      {
        label: "Equipamentos em atenção",
        value: "2",
        detail: "requerem verificação",
        previous: "Ontem: 3",
        delta: "-1",
        deltaTone: "down",
        icon: AlertTriangle,
        tone: "warn",
      },
      {
        label: "Alarmes ativos",
        value: "1",
        detail: "1 não crítico",
        previous: "Ontem: 3",
        delta: "-2",
        deltaTone: "down",
        icon: Bell,
        tone: "crit",
      },
      {
        label: "Disponibilidade dos dados",
        value: "98%",
        detail: "cobertura das leituras",
        previous: "Ontem: 96%",
        delta: "+2 pp",
        deltaTone: "up",
        icon: LineChart,
        tone: "ai",
      },
    ],
    occurrences: [
      {
        title: "Delta T abaixo do esperado no Chiller Vermelho",
        desc: "Delta T médio de 2,1°C no período analisado (ontem: 3,4°C)",
        time: "07:45",
        level: "Atenção",
        tone: "warn",
        icon: ThermometerSun,
      },
      {
        title: "Pressão abaixo do setpoint — BAG 2",
        desc: "Pressão média 18% abaixo do setpoint durante o período",
        time: "07:30",
        level: "Crítico",
        tone: "crit",
        icon: Gauge,
      },
      {
        title: "Bypass elevado — BAG 3",
        desc: "Válvula de bypass aberta 65% do tempo (ontem: 32%)",
        time: "06:50",
        level: "Atenção",
        tone: "info",
        icon: Fan,
      },
    ],
    recommendations: [
      {
        title: "Verificar fluxo de água gelada do Chiller Vermelho",
        desc: "Delta T baixo pode indicar fluxo elevado ou baixa carga térmica.",
      },
      {
        title: "Inspecionar operação da BAG 2",
        desc: "Pressão da linha abaixo do setpoint durante a maior parte do período.",
      },
      {
        title: "Verificar válvula de bypass da BAG 3",
        desc: "Bypass elevado por período prolongado pode indicar baixa demanda.",
      },
    ],
    chillers: [
      {
        id: "azul",
        name: "Chiller Azul",
        status: "Normal",
        hours: "18,2 h",
        deltaT: "5,8°C",
        setpoint: "92%",
        compare: "▲ 1,2 h  ▲ 0,6°C  ▲ 7 pp",
        note: "Sem ocorrências relevantes",
        tone: "ok",
      },
      {
        id: "vermelho",
        name: "Chiller Vermelho",
        status: "Atenção",
        hours: "21,5 h",
        deltaT: "2,1°C",
        setpoint: "18%",
        compare: "▲ 0,8 h  ▼ 1,3°C  ▼ 24 pp",
        note: "Delta T baixo",
        tone: "warn",
      },
      {
        id: "branco",
        name: "Chiller Branco",
        status: "Normal",
        hours: "16,1 h",
        deltaT: "5,2°C",
        setpoint: "88%",
        compare: "▲ 0,4 h  ▲ 0,3°C  ▲ 5 pp",
        note: "Sem ocorrências relevantes",
        tone: "ok",
      },
    ],
    summary:
      "Com base nos dados do D-1, o sistema identificou 2 ocorrências que merecem atenção, principalmente relacionadas ao Chiller Vermelho e à bomba BAG 2. Não há alarmes críticos no momento.",
  },
  week: {
    kpis: [
      {
        label: "Chillers operando",
        value: "3",
        detail: "de 3",
        previous: "Semana anterior: 3 de 3",
        delta: "0",
        deltaTone: "neutral",
        icon: CircuitBoard,
        tone: "info",
      },
      {
        label: "Bombas operando",
        value: "4",
        detail: "de 4",
        previous: "Semana anterior: 4 de 4",
        delta: "0",
        deltaTone: "neutral",
        icon: Droplets,
        tone: "ok",
      },
      {
        label: "Equipamentos em atenção",
        value: "3",
        detail: "pontos recorrentes",
        previous: "Semana anterior: 2",
        delta: "+1",
        deltaTone: "up",
        icon: AlertTriangle,
        tone: "warn",
      },
      {
        label: "Alarmes ativos",
        value: "4",
        detail: "eventos no período",
        previous: "Semana anterior: 6",
        delta: "-2",
        deltaTone: "down",
        icon: Bell,
        tone: "crit",
      },
      {
        label: "Disponibilidade dos dados",
        value: "97%",
        detail: "cobertura semanal",
        previous: "Semana anterior: 95%",
        delta: "+2 pp",
        deltaTone: "up",
        icon: LineChart,
        tone: "ai",
      },
    ],
    occurrences: [
      {
        title: "Delta T recorrente abaixo do esperado",
        desc: "Chiller Vermelho apresentou desvio em 4 dos 7 dias analisados",
        time: "semana",
        level: "Atenção",
        tone: "warn",
        icon: ThermometerSun,
      },
      {
        title: "Pressão da linha instável nas bombas",
        desc: "Variação observada em janelas de maior demanda operacional",
        time: "semana",
        level: "Atenção",
        tone: "crit",
        icon: Gauge,
      },
      {
        title: "Bypass acima do padrão histórico",
        desc: "Comportamento repetido em mais de um grupo de bombas",
        time: "semana",
        level: "Info",
        tone: "info",
        icon: Fan,
      },
    ],
    recommendations: [
      {
        title: "Programar inspeção do circuito hidráulico vermelho",
        desc: "Recorrência semanal sugere necessidade de verificação operacional.",
      },
      {
        title: "Revisar parâmetros de controle das bombas",
        desc: "Instabilidade de pressão apareceu em mais de uma janela analisada.",
      },
      {
        title: "Validar posição de bypass em horários de baixa carga",
        desc: "Abertura prolongada pode explicar parte do Delta T reduzido.",
      },
    ],
    chillers: [
      {
        id: "azul",
        name: "Chiller Azul",
        status: "Normal",
        hours: "122 h",
        deltaT: "5,6°C",
        setpoint: "91%",
        compare: "▲ 4 h  ▲ 0,2°C  ▲ 3 pp",
        note: "Operação estável",
        tone: "ok",
      },
      {
        id: "vermelho",
        name: "Chiller Vermelho",
        status: "Atenção",
        hours: "141 h",
        deltaT: "3,0°C",
        setpoint: "42%",
        compare: "▲ 9 h  ▼ 0,8°C  ▼ 12 pp",
        note: "Desvio recorrente",
        tone: "warn",
      },
      {
        id: "branco",
        name: "Chiller Branco",
        status: "Normal",
        hours: "116 h",
        deltaT: "5,0°C",
        setpoint: "86%",
        compare: "▼ 2 h  ▲ 0,1°C  ▲ 1 pp",
        note: "Sem recorrências críticas",
        tone: "ok",
      },
    ],
    summary:
      "Na visão semanal, o comportamento que mais se repete está associado ao grupo vermelho: Delta T reduzido, bypass elevado e pressão de linha instável. Recomenda-se uma inspeção planejada antes da próxima operação de maior carga.",
  },
  month: {
    kpis: [
      {
        label: "Chillers operando",
        value: "3",
        detail: "de 3",
        previous: "Mês anterior: 3 de 3",
        delta: "0",
        deltaTone: "neutral",
        icon: CircuitBoard,
        tone: "info",
      },
      {
        label: "Bombas operando",
        value: "4",
        detail: "de 4",
        previous: "Mês anterior: 4 de 4",
        delta: "0",
        deltaTone: "neutral",
        icon: Droplets,
        tone: "ok",
      },
      {
        label: "Equipamentos em atenção",
        value: "4",
        detail: "padrões identificados",
        previous: "Mês anterior: 5",
        delta: "-1",
        deltaTone: "down",
        icon: AlertTriangle,
        tone: "warn",
      },
      {
        label: "Alarmes ativos",
        value: "12",
        detail: "eventos acumulados",
        previous: "Mês anterior: 15",
        delta: "-3",
        deltaTone: "down",
        icon: Bell,
        tone: "crit",
      },
      {
        label: "Disponibilidade dos dados",
        value: "96%",
        detail: "cobertura mensal",
        previous: "Mês anterior: 94%",
        delta: "+2 pp",
        deltaTone: "up",
        icon: LineChart,
        tone: "ai",
      },
    ],
    occurrences: [
      {
        title: "Padrão mensal de baixa troca térmica",
        desc: "Grupo vermelho concentra a maior parte dos desvios de Delta T",
        time: "mês",
        level: "Atenção",
        tone: "warn",
        icon: ThermometerSun,
      },
      {
        title: "Pressão de linha abaixo do setpoint em dias específicos",
        desc: "Eventos concentrados em períodos de transição operacional",
        time: "mês",
        level: "Info",
        tone: "info",
        icon: Gauge,
      },
      {
        title: "Alarmes acumulados em queda",
        desc: "Volume mensal inferior ao período anterior equivalente",
        time: "mês",
        level: "Info",
        tone: "ok",
        icon: Bell,
      },
    ],
    recommendations: [
      {
        title: "Criar plano de verificação mensal do grupo vermelho",
        desc: "Os desvios são recorrentes e devem ser acompanhados por manutenção preventiva.",
      },
      {
        title: "Registrar comportamento de bypass por faixa de carga",
        desc: "A análise mensal sugere relação entre bypass e baixa troca térmica.",
      },
      {
        title: "Comparar leituras com calendário de eventos",
        desc: "A operação por evento pode explicar parte das variações do mês.",
      },
    ],
    chillers: [
      {
        id: "azul",
        name: "Chiller Azul",
        status: "Normal",
        hours: "506 h",
        deltaT: "5,4°C",
        setpoint: "89%",
        compare: "▲ 11 h  ▲ 0,1°C  ▲ 2 pp",
        note: "Comportamento consistente",
        tone: "ok",
      },
      {
        id: "vermelho",
        name: "Chiller Vermelho",
        status: "Atenção",
        hours: "537 h",
        deltaT: "3,4°C",
        setpoint: "54%",
        compare: "▲ 21 h  ▼ 0,4°C  ▼ 7 pp",
        note: "Padrão de atenção mensal",
        tone: "warn",
      },
      {
        id: "branco",
        name: "Chiller Branco",
        status: "Normal",
        hours: "482 h",
        deltaT: "5,1°C",
        setpoint: "84%",
        compare: "▼ 8 h  ▲ 0,2°C  ▲ 2 pp",
        note: "Sem tendência crítica",
        tone: "ok",
      },
    ],
    summary:
      "Na visão mensal, a operação geral permanece estável. O principal padrão de manutenção observado está relacionado ao grupo vermelho, com indícios recorrentes de baixa troca térmica e bypass elevado em algumas janelas.",
  },
};

const toneClasses: Record<Tone, { text: string; border: string; bg: string; glow: string; soft: string }> = {
  info: {
    text: "text-primary",
    border: "border-primary/35",
    bg: "bg-primary/10",
    glow: "shadow-[0_0_34px_rgba(0,180,255,0.16)]",
    soft: "from-primary/22",
  },
  ok: {
    text: "text-status-ok",
    border: "border-status-ok/35",
    bg: "bg-status-ok/10",
    glow: "shadow-[0_0_34px_oklch(0.82_0.22_150_/_0.12)]",
    soft: "from-status-ok/18",
  },
  warn: {
    text: "text-status-warn",
    border: "border-status-warn/35",
    bg: "bg-status-warn/10",
    glow: "shadow-[0_0_34px_oklch(0.88_0.2_95_/_0.12)]",
    soft: "from-status-warn/20",
  },
  crit: {
    text: "text-status-crit",
    border: "border-status-crit/35",
    bg: "bg-status-crit/10",
    glow: "shadow-[0_0_34px_oklch(0.7_0.28_22_/_0.12)]",
    soft: "from-status-crit/18",
  },
  ai: {
    text: "text-status-ai",
    border: "border-status-ai/40",
    bg: "bg-status-ai/10",
    glow: "shadow-[0_0_40px_oklch(0.75_0.24_300_/_0.16)]",
    soft: "from-status-ai/22",
  },
};

const chillerAccent = {
  azul: "oklch(0.82 0.22 230)",
  vermelho: "oklch(0.72 0.28 22)",
  branco: "oklch(0.9 0.02 240)",
};

const chillerImages = {
  azul: chillerBlue,
  vermelho: chillerRed,
  branco: chillerWhite,
};

function Delta({ tone, value }: { tone: "up" | "down" | "neutral"; value: string }) {
  const classes =
    tone === "up"
      ? "text-status-ok"
      : tone === "down"
        ? "text-status-ok"
        : "text-muted-foreground";
  const symbol = tone === "up" ? "▲" : tone === "down" ? "▼" : "—";
  return (
    <span className={cn("font-mono text-[11px] font-semibold", classes)}>
      {value === "0" ? "0" : `${symbol} ${value}`}
    </span>
  );
}

function StatusPill({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = toneClasses[tone];
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold", t.border, t.bg, t.text)}>
      {children}
    </span>
  );
}

function KpiCard({ item }: { item: (typeof periodData)[PeriodKey]["kpis"][number] }) {
  const Icon = item.icon;
  const t = toneClasses[item.tone];
  return (
    <article className={cn("glass-card group relative min-h-[138px] overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5", t.border, t.glow)}>
      <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-transparent opacity-70", t.soft)} />
      <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-current opacity-[0.08] blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div className={cn("grid h-12 w-12 shrink-0 place-items-center rounded-xl border", t.border, t.bg, t.text)}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className={cn("text-[10px] font-bold uppercase tracking-[0.14em]", t.text)}>{item.label}</div>
          <div className="mt-2 flex items-end gap-2">
            <span className="font-display text-4xl font-bold leading-none tracking-tight tabular-nums">{item.value}</span>
            <span className="mb-1 text-sm text-muted-foreground">{item.detail}</span>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-border/35 pt-2 text-[11px] text-muted-foreground">
            <span>{item.previous}</span>
            <Delta tone={item.deltaTone} value={item.delta} />
          </div>
        </div>
      </div>
    </article>
  );
}

function OccurrenceRow({ item }: { item: (typeof periodData)[PeriodKey]["occurrences"][number] }) {
  const Icon = item.icon;
  const t = toneClasses[item.tone];
  return (
    <div className="group relative grid grid-cols-[4px_52px_minmax(0,1fr)_auto] items-center gap-4 border-b border-border/35 py-3 last:border-b-0">
      <div className={cn("h-16 rounded-full", item.tone === "crit" ? "bg-status-crit" : item.tone === "warn" ? "bg-status-warn" : "bg-primary")} />
      <div className={cn("grid h-12 w-12 place-items-center rounded-xl border", t.border, t.bg, t.text)}>
        <Icon className="h-6 w-6" />
      </div>
      <div className="min-w-0">
        <div className="font-display text-sm font-semibold leading-tight">{item.title}</div>
        <div className="mt-1 text-xs leading-snug text-muted-foreground">{item.desc}</div>
      </div>
      <div className="flex items-center gap-3">
        <StatusPill tone={item.tone}>{item.level}</StatusPill>
        <span className="font-mono text-xs text-muted-foreground">{item.time}</span>
      </div>
    </div>
  );
}

function RecommendationRow({ index, item }: { index: number; item: { title: string; desc: string } }) {
  return (
    <div className="grid grid-cols-[48px_minmax(0,1fr)] gap-3 border-b border-border/35 py-4 last:border-b-0">
      <div className="grid h-10 w-10 place-items-center rounded-full border border-status-ok/35 bg-status-ok/15 font-display text-lg font-bold text-status-ok shadow-[0_0_22px_oklch(0.82_0.22_150_/_0.18)]">
        {index + 1}
      </div>
      <div>
        <div className="font-display text-sm font-semibold">{item.title}</div>
        <div className="mt-1 text-xs leading-snug text-muted-foreground">{item.desc}</div>
      </div>
    </div>
  );
}

function ChillerStatusCard({ item, comparison }: { item: (typeof periodData)[PeriodKey]["chillers"][number]; comparison: string }) {
  const color = chillerAccent[item.id];
  const image = chillerImages[item.id];
  const isWarn = item.tone === "warn";
  return (
    <Link
      to="/chillers/$id"
      params={{ id: item.id }}
      className="group relative min-h-[252px] overflow-hidden rounded-xl border border-border/45 bg-surface-2/35 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary/50"
    >
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ background: `radial-gradient(circle at 18% 38%, ${color.replace(")", " / 0.26)")}, transparent 36%)` }} />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="font-display text-sm font-bold uppercase tracking-wide">{item.name}</div>
          <div className="mt-1 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">comparação {comparison}</div>
        </div>
        <StatusPill tone={item.tone}>{item.status}</StatusPill>
      </div>
      <div className="relative mt-5 grid grid-cols-[136px_minmax(0,1fr)] gap-5">
        <div className="relative h-32 overflow-hidden rounded-xl border border-border/35 bg-black/20">
          <div className="absolute inset-0 opacity-70" style={{ background: `radial-gradient(circle at 50% 50%, ${color.replace(")", " / 0.34)")}, transparent 72%)` }} />
          <div className="absolute inset-x-4 bottom-3 h-6 rounded-[50%] bg-black/35 blur-sm" />
          <img src={image} alt={item.name} className="absolute inset-0 m-auto max-h-[104px] w-[92%] object-contain drop-shadow-[0_14px_22px_rgba(0,0,0,0.58)] transition-transform duration-500 group-hover:scale-[1.035]" />
        </div>
        <div className="space-y-3 text-xs">
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Horas de operação</span><strong>{item.hours}</strong></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Delta T médio</span><strong className={isWarn ? "text-status-crit" : ""}>{item.deltaT}</strong></div>
          <div className="flex justify-between gap-2"><span className="text-muted-foreground">Setpoint atingido</span><strong className={isWarn ? "text-status-crit" : ""}>{item.setpoint}</strong></div>
        </div>
      </div>
      <div className="relative mt-4 border-t border-border/35 pt-3">
        <div className={cn("font-mono text-[11px]", isWarn ? "text-status-crit" : "text-status-ok")}>{item.compare}</div>
        <div className={cn("mt-2 inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[11px]", isWarn ? "border-status-warn/35 bg-status-warn/10 text-status-warn" : "border-status-ok/35 bg-status-ok/10 text-status-ok")}>
          {isWarn ? <AlertTriangle className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
          {item.note}
        </div>
      </div>
    </Link>
  );
}

function InfoFooter({ icon: Icon, label, value, detail }: { icon: typeof CalendarDays; label: string; value: string; detail?: string }) {
  return (
    <div className="glass-card relative overflow-hidden p-4">
      <div className="absolute -left-8 -top-8 h-20 w-20 rounded-full bg-primary/10 blur-2xl" />
      <div className="relative flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl border border-primary/35 bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{label}</div>
          <div className="mt-1 font-display text-lg font-bold leading-tight">{value}</div>
          {detail ? <div className="mt-0.5 text-[11px] text-muted-foreground">{detail}</div> : null}
        </div>
      </div>
    </div>
  );
}

function Index() {
  const [period, setPeriod] = useState<PeriodKey>("d1");
  const cfg = periodConfig[period];
  const data = periodData[period];

  const suggestedQuestions = useMemo(
    () => [
      "Por que o Chiller Vermelho está em atenção?",
      "Quais bombas precisam de inspeção?",
      period === "d1" ? "O que mudou desde ontem?" : period === "week" ? "O que mudou versus a semana anterior?" : "O que mudou versus o mês anterior?",
      "Mostrar apenas ocorrências críticas",
    ],
    [period],
  );

  return (
    <div className="relative space-y-5 overflow-hidden pb-2">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-status-ai/10 blur-3xl" />
      <div className="pointer-events-none absolute left-1/4 top-40 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />

      <section className="relative flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.28em] text-primary/80">Centro de Inteligência Operacional</div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight md:text-4xl">Visão Operacional da Central</h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-base">Resumo consolidado de chillers, bombas e ocorrências operacionais.</p>
        </div>
        <div className="flex flex-col gap-3 lg:items-end">
          <div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Período analisado</div>
            <div className="inline-flex rounded-xl border border-border/60 bg-surface-2/50 p-1 shadow-[inset_0_0_22px_rgba(0,180,255,0.05)]">
              {(Object.keys(periodConfig) as PeriodKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setPeriod(key)}
                  className={cn(
                    "rounded-lg px-4 py-2 text-sm font-semibold transition-all",
                    period === key
                      ? "bg-primary/25 text-primary shadow-[0_0_20px_rgba(0,180,255,0.24),inset_0_0_14px_rgba(0,180,255,0.12)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {periodConfig[key].label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface-2/45 px-4 py-3">
            <CalendarDays className="h-4 w-4 text-primary" />
            <div className="text-right">
              <div className="font-display text-sm font-semibold">26 de Maio de 2025</div>
              <div className="text-[11px] text-muted-foreground">Base comparativa: {cfg.short}</div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {data.kpis.map((item) => <KpiCard key={item.label} item={item} />)}
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 text-primary" />
        Comparações realizadas com o período anterior equivalente: <span className="text-foreground/80">{cfg.comparison}</span>.
      </div>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <div className="glass-card overflow-hidden p-5">
          <div className="mb-2 flex items-center justify-between border-b border-border/35 pb-3">
            <h2 className="font-display text-base font-bold uppercase tracking-wide">{cfg.occurrencesTitle}</h2>
            <Link to="/alarms" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:text-primary/80">
              Ver todas <ChevronRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <div>{data.occurrences.map((item) => <OccurrenceRow key={item.title} item={item} />)}</div>
        </div>

        <div className="glass-card overflow-hidden p-5">
          <div className="mb-2 flex items-center justify-between border-b border-border/35 pb-3">
            <h2 className="font-display text-base font-bold uppercase tracking-wide">Recomendações principais</h2>
            <Wrench className="h-4 w-4 text-status-ok" />
          </div>
          <div>{data.recommendations.map((item, index) => <RecommendationRow key={item.title} index={index} item={item} />)}</div>
          <Link to="/ai" className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-primary/30 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15">
            Ver todas as recomendações <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_400px]">
        <div className="glass-card overflow-hidden p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-base font-bold uppercase tracking-wide">Status dos chillers</h2>
            <span className="text-xs text-muted-foreground">Clique em um chiller para abrir o detalhe</span>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {data.chillers.map((item) => <ChillerStatusCard key={item.id} item={item} comparison={cfg.comparison} />)}
          </div>

        </div>

        <aside className="glass-card relative overflow-hidden border-status-ai/45 p-5 shadow-[0_0_42px_oklch(0.75_0.24_300_/_0.14)]">
          <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-status-ai/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-24 right-0 h-px w-40 bg-gradient-to-r from-transparent via-status-ai/60 to-transparent" />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl border border-status-ai/40 bg-status-ai/15 text-status-ai">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h2 className="font-display text-base font-bold uppercase tracking-wide">Resumo operacional</h2>
                <div className="text-[11px] text-muted-foreground">Gerado a partir do período selecionado</div>
              </div>
            </div>
            <span className="rounded-full border border-status-ai/30 bg-status-ai/15 px-2 py-1 text-[10px] font-bold uppercase text-status-ai">Beta</span>
          </div>
          <p className="relative mt-5 text-sm leading-7 text-foreground/90">{data.summary}</p>

          <div className="relative mt-5 border-t border-border/35 pt-4">
            <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Perguntas sugeridas</div>
            <div className="space-y-2">
              {suggestedQuestions.map((q) => (
                <button key={q} type="button" className="flex w-full items-center justify-between rounded-lg border border-status-ai/25 bg-status-ai/5 px-3 py-2 text-left text-xs text-status-ai transition hover:border-status-ai/45 hover:bg-status-ai/10">
                  <span>{q}</span>
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
          </div>

          <Link to="/ai" className="relative mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-status-ai/45 bg-status-ai/12 px-4 py-3 font-display text-sm font-bold text-status-ai shadow-[0_0_28px_oklch(0.75_0.24_300_/_0.16)] hover:bg-status-ai/18">
            <Bot className="h-4 w-4" /> Abrir Assistente IA <ArrowRight className="h-4 w-4" />
          </Link>
        </aside>
      </section>

      <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <InfoFooter icon={CalendarDays} label="Período analisado" value={cfg.analyzed.split(" até ")[0]} detail={`até ${cfg.analyzed.split(" até ")[1]}`} />
        <InfoFooter icon={LineChart} label="Cobertura das leituras" value={period === "month" ? "96%" : period === "week" ? "97%" : "98%"} detail={period === "d1" ? "+2 pp vs ontem" : `comparado ao período anterior`} />
        <InfoFooter icon={Database} label="Dados coletados" value="100%" detail="Qualidade dos dados tratados" />
        <InfoFooter icon={Clock3} label="Atualização dos dados" value="07:00" detail="Diariamente pela manhã" />
      </section>
    </div>
  );
}
