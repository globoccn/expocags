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
    impact: "Redução de eficiência ~12% e aumento do consumo elétrico.",
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
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "24h", label: "Últimas 24h" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "30d", label: "Últimos 30 dias" },
  { value: "mtd", label: "Este mês" },
  { value: "lastmonth", label: "Mês passado" },
  { value: "custom", label: "Personalizado" },
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