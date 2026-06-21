export type ChillerId = "blue" | "red" | "white";
export type Severity = "info" | "warn" | "alert" | "crit" | "ok";

export interface PumpData {
  id: string;
  name: string;
  status: "on" | "off" | "fault";
  mode: "local" | "remote";
  pressureLine: number;
  pressureSetpoint: number;
  pressureError: number;
  bypassValve: number;
  alarm: boolean;
  healthScore: number;
  lastEvent: string;
}

export interface CompressorData {
  id: string;
  name: string;
  status: "on" | "off" | "fault";
  oilPressure: number;
  hours: number;
  starts: number;
  health: number;
  lastEvent: string;
}

export interface CircuitData {
  id: "A" | "B";
  capacity: number;
  highPressure: number;
  lowPressure: number;
  oilPressureC1: number;
  oilPressureC2: number;
  compressor1Status: "on" | "off" | "fault";
  compressor2Status: "on" | "off" | "fault";
  healthScore: number;
  anomalies: number;
}

export interface ChillerData {
  id: ChillerId;
  name: string;
  status: "running" | "standby" | "fault" | "off";
  command: "auto" | "manual" | "off";
  healthScore: number;
  capacityTotal: number;
  capacityA: number;
  capacityB: number;
  setpoint: number;
  feedTemp: number;
  returnTemp: number;
  deltaT: number;
  externalTemp: number;
  demandLimit: number;
  operatingHours: number;
  starts: number;
  alarms: number;
  activeAlarms: string[];
  risk: Severity;
  pumpsOn: number;
  aiInsight: string;
  circuits: CircuitData[];
  compressors: CompressorData[];
  pumps: PumpData[];
  hydraulic: {
    pressureLine: number;
    pressureSetpoint: number;
    pressureError: number;
    bypassValve: number;
  };
  series: {
    feedReturnSetpoint: { t: string; feed: number; ret: number; set: number }[];
    deltaT: { t: string; v: number }[];
    capacity: { t: string; total: number; a: number; b: number }[];
    pressureHigh: { t: string; a: number; b: number }[];
    pressureLow: { t: string; a: number; b: number }[];
    externalVsCap: { t: string; ext: number; cap: number }[];
    compressorStarts: { name: string; starts: number }[];
  };
}

const mkSeries = (n: number, base: number, jitter: number) =>
  Array.from({ length: n }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    v: +(base + Math.sin(i / 2) * jitter + (Math.random() - 0.5) * jitter * 0.4).toFixed(2),
  }));

const mkFeedReturn = (n: number, set: number, dt: number) =>
  Array.from({ length: n }, (_, i) => {
    const ret = set + dt + Math.sin(i / 3) * 0.6 + (Math.random() - 0.5) * 0.4;
    const feed = set + Math.sin(i / 4) * 0.3 + (Math.random() - 0.5) * 0.3;
    return {
      t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
      feed: +feed.toFixed(2),
      ret: +ret.toFixed(2),
      set,
    };
  });

const mkCap = (n: number, total: number) =>
  Array.from({ length: n }, (_, i) => {
    const a = total / 2 + Math.sin(i / 3) * 8 + (Math.random() - 0.5) * 4;
    const b = total / 2 + Math.cos(i / 3) * 8 + (Math.random() - 0.5) * 4;
    return {
      t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
      total: +(a + b).toFixed(1),
      a: +a.toFixed(1),
      b: +b.toFixed(1),
    };
  });

const mkPress = (n: number, ba: number, bb: number) =>
  Array.from({ length: n }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    a: +(ba + Math.sin(i / 2) * 0.4 + (Math.random() - 0.5) * 0.3).toFixed(2),
    b: +(bb + Math.cos(i / 2) * 0.4 + (Math.random() - 0.5) * 0.3).toFixed(2),
  }));

const mkExtCap = (n: number) =>
  Array.from({ length: n }, (_, i) => ({
    t: `${String(Math.floor(i / 2)).padStart(2, "0")}:${i % 2 === 0 ? "00" : "30"}`,
    ext: +(28 + Math.sin(i / 4) * 5).toFixed(1),
    cap: +(70 + Math.sin(i / 3) * 18).toFixed(1),
  }));

const N = 24;

const buildChiller = (
  id: ChillerId,
  name: string,
  overrides: Partial<ChillerData>
): ChillerData => ({
  id,
  name,
  status: "running",
  command: "auto",
  healthScore: 88,
  capacityTotal: 78,
  capacityA: 40,
  capacityB: 38,
  setpoint: 7.0,
  feedTemp: 7.2,
  returnTemp: 12.1,
  deltaT: 4.9,
  externalTemp: 31.5,
  demandLimit: 100,
  operatingHours: 18420,
  starts: 1284,
  alarms: 0,
  activeAlarms: [],
  risk: "ok",
  pumpsOn: 3,
  aiInsight: "Operação estável dentro dos parâmetros.",
  circuits: [
    {
      id: "A",
      capacity: 40,
      highPressure: 16.2,
      lowPressure: 4.8,
      oilPressureC1: 2.9,
      oilPressureC2: 2.8,
      compressor1Status: "on",
      compressor2Status: "on",
      healthScore: 90,
      anomalies: 0,
    },
    {
      id: "B",
      capacity: 38,
      highPressure: 16.0,
      lowPressure: 4.7,
      oilPressureC1: 2.8,
      oilPressureC2: 2.9,
      compressor1Status: "on",
      compressor2Status: "off",
      healthScore: 87,
      anomalies: 0,
    },
  ],
  compressors: [
    { id: `${id}-A1`, name: "Compressor A1", status: "on", oilPressure: 2.9, hours: 12840, starts: 412, health: 92, lastEvent: "Partida normal" },
    { id: `${id}-A2`, name: "Compressor A2", status: "on", oilPressure: 2.8, hours: 12120, starts: 398, health: 90, lastEvent: "Partida normal" },
    { id: `${id}-B1`, name: "Compressor B1", status: "on", oilPressure: 2.8, hours: 11890, starts: 376, health: 89, lastEvent: "Partida normal" },
    { id: `${id}-B2`, name: "Compressor B2", status: "off", oilPressure: 0, hours: 11600, starts: 362, health: 86, lastEvent: "Standby" },
  ],
  pumps: [1, 2, 3, 4].map((n) => ({
    id: `${id}-P0${n}`,
    name: `Bomba 0${n}`,
    status: n === 4 ? ("off" as const) : ("on" as const),
    mode: "remote" as const,
    pressureLine: 3.2,
    pressureSetpoint: 3.3,
    pressureError: -0.1,
    bypassValve: 22,
    alarm: false,
    healthScore: 91,
    lastEvent: "Sem ocorrências",
  })),
  hydraulic: { pressureLine: 3.25, pressureSetpoint: 3.3, pressureError: -0.05, bypassValve: 22 },
  series: {
    feedReturnSetpoint: mkFeedReturn(N, 7.0, 4.9),
    deltaT: mkSeries(N, 4.9, 0.5),
    capacity: mkCap(N, 78),
    pressureHigh: mkPress(N, 16.2, 16.0),
    pressureLow: mkPress(N, 4.8, 4.7),
    externalVsCap: mkExtCap(N),
    compressorStarts: [
      { name: "A1", starts: 412 },
      { name: "A2", starts: 398 },
      { name: "B1", starts: 376 },
      { name: "B2", starts: 362 },
    ],
  },
  ...overrides,
});

export const chillers: ChillerData[] = [
  buildChiller("blue", "Chiller Azul", {
    healthScore: 92,
    capacityTotal: 74,
    aiInsight: "Performance ótima. Delta T dentro do esperado.",
    risk: "ok",
  }),
  buildChiller("red", "Chiller Vermelho", {
    healthScore: 68,
    capacityTotal: 82,
    deltaT: 3.4,
    feedTemp: 7.8,
    returnTemp: 11.2,
    alarms: 2,
    activeAlarms: ["Delta T baixo", "Bypass elevado"],
    risk: "alert",
    aiInsight: "Delta T baixo com bypass elevado. Verificar válvula bypass.",
    pumpsOn: 2,
    hydraulic: { pressureLine: 2.8, pressureSetpoint: 3.3, pressureError: -0.5, bypassValve: 58 },
    pumps: [1, 2, 3, 4].map((n) => ({
      id: `red-P0${n}`,
      name: `Bomba 0${n}`,
      status: n <= 2 ? ("on" as const) : ("off" as const),
      mode: n === 3 ? ("local" as const) : ("remote" as const),
      pressureLine: 2.8,
      pressureSetpoint: 3.3,
      pressureError: -0.5,
      bypassValve: 58,
      alarm: n === 3,
      healthScore: n === 3 ? 62 : 80,
      lastEvent: n === 3 ? "Modo Local detectado" : "Bypass elevado",
    })),
    series: {
      feedReturnSetpoint: mkFeedReturn(N, 7.0, 3.4),
      deltaT: mkSeries(N, 3.4, 0.6),
      capacity: mkCap(N, 82),
      pressureHigh: mkPress(N, 17.2, 17.0),
      pressureLow: mkPress(N, 5.1, 5.0),
      externalVsCap: mkExtCap(N),
      compressorStarts: [
        { name: "A1", starts: 612 },
        { name: "A2", starts: 398 },
        { name: "B1", starts: 376 },
        { name: "B2", starts: 362 },
      ],
    },
  }),
  buildChiller("white", "Chiller Branco", {
    healthScore: 84,
    capacityTotal: 70,
    aiInsight: "Operação estável. Monitorar partidas do Compressor A2.",
    risk: "info",
  }),
];

export const aiInsights = [
  {
    id: "ai-1",
    title: "Delta T baixo no Chiller Vermelho",
    chiller: "red" as ChillerId,
    equipment: "Chiller Vermelho — Circuito A/B",
    severity: "alert" as Severity,
    confidence: 0.92,
    cause: "Possível bypass aberto reduzindo troca térmica efetiva.",
    recommendation: "Inspecionar válvula bypass e ajustar setpoint hidráulico.",
    impact: "Queda de desempenho operacional e maior instabilidade térmica.",
    occurredAt: "há 14 min",
    status: "ativo" as const,
  },
  {
    id: "ai-2",
    title: "Bypass elevado nas bombas do Chiller Vermelho",
    chiller: "red" as ChillerId,
    equipment: "Bombas 01-04",
    severity: "warn" as Severity,
    confidence: 0.88,
    cause: "Pressão de linha 15% abaixo do setpoint com bypass em 58%.",
    recommendation: "Verificar estrangulamento na linha e estado dos filtros.",
    impact: "Pressão insuficiente para distribuição.",
    occurredAt: "há 22 min",
    status: "ativo" as const,
  },
  {
    id: "ai-3",
    title: "Partidas excessivas no Compressor A1",
    chiller: "white" as ChillerId,
    equipment: "Chiller Branco — Compressor A1",
    severity: "warn" as Severity,
    confidence: 0.81,
    cause: "Ciclos curtos por oscilação de carga térmica.",
    recommendation: "Revisar histerese do controle de capacidade.",
    impact: "Desgaste prematuro do compressor.",
    occurredAt: "há 1h",
    status: "ativo" as const,
  },
  {
    id: "ai-4",
    title: "Bomba 03 em modo Local",
    chiller: "red" as ChillerId,
    equipment: "Bomba 03 — Chiller Vermelho",
    severity: "info" as Severity,
    confidence: 0.99,
    cause: "Chave seletora em LOCAL no painel.",
    recommendation: "Retornar para modo REMOTO após manutenção.",
    impact: "Bomba fora da automação.",
    occurredAt: "há 2h",
    status: "ativo" as const,
  },
  {
    id: "ai-5",
    title: "Pressão alta normalizada no Circuito B",
    chiller: "blue" as ChillerId,
    equipment: "Chiller Azul — Circuito B",
    severity: "ok" as Severity,
    confidence: 0.95,
    cause: "Estabilização após ajuste de capacidade.",
    recommendation: "Nenhuma ação necessária.",
    impact: "Sem impacto.",
    occurredAt: "há 3h",
    status: "resolvido" as const,
  },
];

export const events = [
  { id: "e1", time: "14:32", chiller: "red" as ChillerId, type: "ai", text: "IA detectou Delta T baixo persistente." },
  { id: "e2", time: "14:18", chiller: "red" as ChillerId, type: "alarm", text: "Bypass elevou para 58%." },
  { id: "e3", time: "13:55", chiller: "blue" as ChillerId, type: "info", text: "Compressor B1 partiu." },
  { id: "e4", time: "13:40", chiller: "white" as ChillerId, type: "warn", text: "Pressão alta elevada momentânea." },
  { id: "e5", time: "13:12", chiller: "blue" as ChillerId, type: "ok", text: "Alarme resolvido — Circuito B." },
  { id: "e6", time: "12:48", chiller: "red" as ChillerId, type: "info", text: "Bomba 03 alterada para LOCAL." },
];

export const alarms = [
  { id: "al1", chiller: "red" as ChillerId, equipment: "Chiller Vermelho", severity: "alert" as Severity, title: "Delta T baixo", at: "2026-06-20 14:32", duration: "00:14", status: "ativo" as const, recommendation: "Verificar bypass." },
  { id: "al2", chiller: "red" as ChillerId, equipment: "Bomba 03", severity: "warn" as Severity, title: "Modo Local", at: "2026-06-20 12:48", duration: "01:58", status: "ativo" as const, recommendation: "Retornar para Remoto." },
  { id: "al3", chiller: "white" as ChillerId, equipment: "Compressor A1", severity: "warn" as Severity, title: "Partidas excessivas", at: "2026-06-20 13:30", duration: "01:16", status: "ativo" as const, recommendation: "Revisar histerese." },
  { id: "al4", chiller: "blue" as ChillerId, equipment: "Circuito B", severity: "ok" as Severity, title: "Pressão alta normalizada", at: "2026-06-20 11:05", duration: "00:32", status: "resolvido" as const, recommendation: "Sem ação." },
  { id: "al5", chiller: "red" as ChillerId, equipment: "Bombas 01-04", severity: "warn" as Severity, title: "Bypass elevado", at: "2026-06-20 14:18", duration: "00:28", status: "ativo" as const, recommendation: "Inspecionar filtros." },
];

export const plant = {
  name: "Central de Água Gelada",
  location: "Planta Industrial — Setor Norte",
  summary: {
    healthScore: 81,
    risk: "warn" as Severity,
    anomalies: 4,
    chillersOnline: 3,
    pumpsOn: 8,
    compressorsOn: 9,
    events: 23,
    communication: "online" as const,
  },
  trends: {
    healthOverTime: Array.from({ length: 30 }, (_, i) => ({
      day: `D${i + 1}`,
      score: 75 + Math.sin(i / 3) * 8 + (Math.random() - 0.5) * 4,
    })),
    alarmsPerPeriod: Array.from({ length: 14 }, (_, i) => ({
      day: `D${i + 1}`,
      crit: Math.floor(Math.random() * 2),
      warn: Math.floor(Math.random() * 5),
    })),
  },
};

export const periodOptions = [
  { value: "d1", label: "D-1" },
  { value: "7d", label: "7 dias" },
  { value: "30d", label: "30 dias" },
  { value: "month", label: "Mês" },
];

export const compareOptions = [
  { value: "d2", label: "D-2" },
  { value: "avg7", label: "Média 7 dias" },
  { value: "avg30", label: "Média 30 dias" },
  { value: "same-weekday", label: "Mesmo dia semana anterior" },
];

export const healthFactors = [
  { label: "Delta T baixo", points: -8 },
  { label: "Pressão alta elevada", points: -6 },
  { label: "Bypass elevado", points: -5 },
  { label: "Partidas excessivas", points: -4 },
  { label: "Alarme ativo", points: -10 },
];

export const chillerTheme: Record<ChillerId, { hex: string; ring: string; label: string; soft: string }> = {
  blue: { hex: "var(--chiller-blue)", ring: "neon-border-blue", label: "Azul", soft: "oklch(0.78 0.22 230 / 0.15)" },
  red: { hex: "var(--chiller-red)", ring: "neon-border-red", label: "Vermelho", soft: "oklch(0.7 0.28 22 / 0.15)" },
  white: { hex: "var(--chiller-white)", ring: "neon-border-white", label: "Branco", soft: "oklch(0.92 0.01 240 / 0.15)" },
};

export const getChiller = (id: string): ChillerData | undefined =>
  chillers.find((c) => c.id === (id as ChillerId));

/* ============================================================
 * HOME ANALYTICS — comparativos, ranking, correlações, timeline
 * Valores demonstrativos para validação visual.
 * ============================================================ */

const spark = (n: number, base: number, jit: number, drift = 0) =>
  Array.from({ length: n }, (_, i) => ({
    i,
    v: +(base + Math.sin(i / 2) * jit + drift * (i / n) + (Math.random() - 0.5) * jit * 0.5).toFixed(2),
  }));

export type Trend = "up" | "down" | "flat";

export interface KpiSpark {
  key: string;
  label: string;
  value: string;
  unit?: string;
  delta: string;
  trend: Trend;
  tone: "ok" | "warn" | "alert" | "crit" | "info" | "ai" | "default";
  spark: { i: number; v: number }[];
  hint?: string;
}

export const headerKpis: KpiSpark[] = [
  { key: "health", label: "Saúde Geral", value: "81", unit: "/100", delta: "↓ 4 pts vs D-2", trend: "down", tone: "warn", spark: spark(24, 82, 3, -2) },
  { key: "deltaT", label: "Delta T Médio", value: "4.4", unit: "°C", delta: "↓ 18% vs média 7d", trend: "down", tone: "alert", spark: spark(24, 4.6, 0.4, -0.4) },
  { key: "bypass", label: "Bypass Médio", value: "34", unit: "%", delta: "↑ 42% vs média 7d", trend: "up", tone: "alert", spark: spark(24, 28, 6, 8) },
  { key: "online", label: "Chillers Online", value: "2/3", delta: "1 em manutenção", trend: "flat", tone: "ok", spark: spark(24, 2.8, 0.2) },
  { key: "pumps", label: "Bombas Atenção", value: "4", delta: "2 alarmes ativos", trend: "up", tone: "warn", spark: spark(24, 3, 1, 1) },
  { key: "comps", label: "Compressores", value: "9/12", delta: "75% em operação", trend: "flat", tone: "info", spark: spark(24, 9, 0.6) },
  { key: "events", label: "Eventos D-1", value: "23", delta: "↑ 6 vs D-2", trend: "up", tone: "default", spark: spark(24, 18, 4, 5) },
  { key: "comm", label: "Comunicação", value: "Online", delta: "Dados disponíveis", trend: "flat", tone: "ok", spark: spark(24, 1, 0) },
];

export interface Comparative {
  key: string;
  label: string;
  value: string;
  unit?: string;
  d1: { label: string; delta: string; trend: Trend };
  d7: { label: string; delta: string; trend: Trend };
  spark: { i: number; v: number }[];
  tone: "ok" | "warn" | "alert" | "crit" | "info" | "default";
}

export const comparatives: Comparative[] = [
  { key: "health", label: "Saúde Geral", value: "81", unit: "/100",
    d1: { label: "vs D-2", delta: "↓ 4 pts", trend: "down" },
    d7: { label: "vs 7d", delta: "↓ 6 pts", trend: "down" },
    spark: spark(24, 84, 3, -3), tone: "warn" },
  { key: "dt", label: "Δ T Médio", value: "4.4", unit: "°C",
    d1: { label: "vs D-2", delta: "↓ 0.5", trend: "down" },
    d7: { label: "vs 7d", delta: "↓ 18%", trend: "down" },
    spark: spark(24, 5.0, 0.4, -0.6), tone: "alert" },
  { key: "bp", label: "Bypass Médio", value: "34", unit: "%",
    d1: { label: "vs D-2", delta: "↑ 4 pp", trend: "up" },
    d7: { label: "vs 7d", delta: "↑ 42%", trend: "up" },
    spark: spark(24, 26, 5, 8), tone: "alert" },
  { key: "cap", label: "Capacidade Média", value: "75", unit: "%",
    d1: { label: "vs D-2", delta: "↑ 3 pp", trend: "up" },
    d7: { label: "vs 7d", delta: "↑ 16%", trend: "up" },
    spark: spark(24, 68, 6, 7), tone: "info" },
  { key: "err", label: "Erro Setpoint", value: "+0.4", unit: "°C",
    d1: { label: "vs D-2", delta: "↑ 0.1", trend: "up" },
    d7: { label: "vs 7d", delta: "↑ 100%", trend: "up" },
    spark: spark(24, 0.3, 0.15, 0.1), tone: "warn" },
  { key: "pr", label: "Pressão Linha", value: "6.2", unit: "bar",
    d1: { label: "vs D-2", delta: "↓ 8%", trend: "down" },
    d7: { label: "vs 7d", delta: "↓ 8%", trend: "down" },
    spark: spark(24, 6.6, 0.3, -0.4), tone: "warn" },
  { key: "ext", label: "Temp. Externa", value: "31.5", unit: "°C",
    d1: { label: "vs D-2", delta: "↑ 4°", trend: "up" },
    d7: { label: "vs 7d", delta: "↑ 4°", trend: "up" },
    spark: spark(24, 27, 3, 4), tone: "default" },
  { key: "starts", label: "Partidas (D-1)", value: "187", delta: "↑ 22%",
    d1: { label: "vs D-2", delta: "↑ 22%", trend: "up" },
    d7: { label: "vs 7d", delta: "↑ 38%", trend: "up" },
    spark: spark(24, 140, 20, 50), tone: "alert" } as Comparative,
];

export const ranking = [
  { pos: 1, chiller: "blue" as ChillerId, name: "Chiller Azul", score: 92, capacity: 74, stability: 96 },
  { pos: 2, chiller: "white" as ChillerId, name: "Chiller Branco", score: 84, capacity: 70, stability: 88 },
  { pos: 3, chiller: "red" as ChillerId, name: "Chiller Vermelho", score: 68, capacity: 82, stability: 74 },
];

export interface Correlation {
  key: string;
  title: string;
  desc: string;
  impact: "Baixo" | "Médio" | "Alto" | "Crítico";
  scope: string;
  tone: "ok" | "warn" | "alert" | "crit" | "info";
}

export const correlations: Correlation[] = [
  { key: "c1", title: "Δ T baixo + Bypass alto", desc: "Risco de recirculação hidráulica", impact: "Alto", scope: "Chiller Vermelho", tone: "alert" },
  { key: "c2", title: "Temp. externa alta + Carga alta", desc: "Comportamento dentro do esperado", impact: "Médio", scope: "Central", tone: "info" },
  { key: "c3", title: "Erro setpoint + Carga alta", desc: "Esforço operacional elevado", impact: "Alto", scope: "Chiller Vermelho", tone: "alert" },
  { key: "c4", title: "Pressão abaixo do setpoint", desc: "Risco de vazão insuficiente", impact: "Médio", scope: "Bombas", tone: "warn" },
  { key: "c5", title: "Muitas partidas + Baixa carga", desc: "Desgaste mecânico elevado", impact: "Médio", scope: "Chiller Branco", tone: "warn" },
];

export interface TimelineItem {
  id: string;
  time: string;
  chiller: ChillerId;
  title: string;
  desc: string;
  tone: "ok" | "warn" | "alert" | "crit" | "info" | "ai";
  spark: { i: number; v: number }[];
}

export const homeTimeline: TimelineItem[] = [
  { id: "t1", time: "22:14", chiller: "red", title: "Chiller Vermelho", desc: "Bypass aumentou para 58%.", tone: "alert", spark: spark(16, 40, 6, 18) },
  { id: "t2", time: "21:48", chiller: "red", title: "Bypass Vermelho", desc: "Δ T caiu para 3.4°C.", tone: "warn", spark: spark(16, 4.2, 0.5, -0.8) },
  { id: "t3", time: "21:32", chiller: "red", title: "Bombas", desc: "BAG2 entrou em falha.", tone: "crit", spark: spark(16, 3.1, 0.2, -0.5) },
  { id: "t4", time: "21:10", chiller: "blue", title: "Saúde geral", desc: "Carga aumentou para 74%.", tone: "info", spark: spark(16, 60, 6, 14) },
  { id: "t5", time: "20:45", chiller: "white", title: "Compressor A2", desc: "Partidas excessivas detectadas.", tone: "warn", spark: spark(16, 6, 1.4, 3) },
  { id: "t6", time: "20:12", chiller: "blue", title: "IA", desc: "Padrão de operação estabilizado.", tone: "ai", spark: spark(16, 88, 2, 2) },
];

export const homeIntel = {
  resumo: "Durante o D-1, o Chiller Vermelho concentrou a maior carga, apresentou queda de Delta T frente à média semanal e bypass acima do padrão. O padrão sugere recirculação hidráulica ou baixa troca térmica efetiva.",
  equipamento: "Chiller Vermelho — Circuito A/B",
  causa: "Recirculação hidráulica",
  impacto: "Desempenho reduzido",
  confianca: 92,
  acao: "Inspecionar válvula bypass, balanceamento hidráulico e operação das bombas.",
  status: "alert" as Severity,
};

export const chillerGroup: Record<ChillerId, string> = {
  blue: "CAG Principal · Sala A",
  red: "CAG Principal · Sala A",
  white: "CAG Secundária · Sala B",
};

export const chillerInsight: Record<ChillerId, { tag: string; tone: "ok" | "warn" | "alert" | "info" }> = {
  blue: { tag: "Operação dentro do esperado", tone: "ok" },
  red: { tag: "Bypass elevado + Δ T reduzido", tone: "alert" },
  white: { tag: "Excesso de partidas detectado", tone: "warn" },
};