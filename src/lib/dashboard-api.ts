import { useEffect, useMemo, useState } from "react";

export type UiPeriod = "d1" | "week" | "month";
export type ApiPeriod = "d_1" | "week" | "month";

export type ApiPayload = Record<string, any> | null;

const periodToApi: Record<UiPeriod, ApiPeriod> = { d1: "d_1", week: "week", month: "month" };
const apiToPeriod: Record<string, UiPeriod> = { d_1: "d1", d1: "d1", week: "week", month: "month" };

export function getInitialPeriod(): UiPeriod {
  if (typeof window === "undefined") return "d1";
  const saved = window.localStorage.getItem("cag-period") || "d1";
  return saved === "7d" ? "week" : saved === "1m" ? "month" : apiToPeriod[saved] || "d1";
}

export function setGlobalPeriod(period: UiPeriod) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem("cag-period", period);
  window.dispatchEvent(new CustomEvent("cag-period-change", { detail: period }));
}

export function useDashboardPeriod() {
  const [period, setPeriodState] = useState<UiPeriod>(getInitialPeriod);
  useEffect(() => {
    const handler = (event: Event) => {
      const value = (event as CustomEvent).detail;
      setPeriodState(value === "7d" ? "week" : value === "1m" ? "month" : apiToPeriod[value] || "d1");
    };
    window.addEventListener("cag-period-change", handler);
    return () => window.removeEventListener("cag-period-change", handler);
  }, []);
  const setPeriod = (next: UiPeriod) => {
    setPeriodState(next);
    setGlobalPeriod(next);
  };
  return [period, setPeriod] as const;
}

function apiBase() {
  const envBase = (import.meta as any).env?.VITE_API_URL;
  return (envBase || "https://ancar-n8n.gpfgqx.easypanel.host/webhook").replace(/\/$/, "");
}

export function useDashboardPayload(period: UiPeriod) {
  const [payload, setPayload] = useState<ApiPayload>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    setPayload(null);
    fetch(`${apiBase()}/cag/dashboard?period=${periodToApi[period]}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (!cancelled) setPayload(json);
      })
      .catch((err) => {
        if (!cancelled) setError(err?.message || "Falha ao carregar dados");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [period]);
  return { payload, loading, error };
}

export function useDashboard() {
  const [period, setPeriod] = useDashboardPeriod();
  const state = useDashboardPayload(period);
  return { period, setPeriod, ...state };
}

export const dash = "--";
export const ids = ["blue", "red", "white"] as const;
export type UiGroupId = typeof ids[number];

export const apiIdToUi: Record<string, UiGroupId> = { azul: "blue", vermelho: "red", branco: "white", blue: "blue", red: "red", white: "white" };
export const uiIdToApi: Record<UiGroupId, string> = { blue: "azul", red: "vermelho", white: "branco" };
export const groupName: Record<UiGroupId, string> = { blue: "Azul", red: "Vermelho", white: "Branco" };

export function asNum(v: any): number | null {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

export function text(v: any, suffix = "", digits = 1): string {
  const n = asNum(v);
  if (n === null) return dash;
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
}

export function textInt(v: any, suffix = ""): string {
  const n = asNum(v);
  if (n === null) return dash;
  return `${Math.round(n).toLocaleString("pt-BR")}${suffix}`;
}

export function statusTone(status: any): "ok" | "warn" | "crit" | "info" | "ai" {
  const s = String(status || "").toLowerCase();
  if (s.includes("crit") || s.includes("alert")) return "crit";
  if (s.includes("aten") || s.includes("warn")) return "warn";
  if (s.includes("normal") || s.includes("ok")) return "ok";
  return "info";
}

export function labelForPeriod(payload: ApiPayload, period: UiPeriod) {
  const p = payload || {};
  const label = p.label || p.period?.label || (period === "d1" ? "D-1" : period === "week" ? "Semana" : "Mês");
  const start = p.start_date || p.period?.start_date || p.date || p.period?.date;
  const end = p.end_date || p.period?.end_date || p.date || p.period?.date;
  const date = start && end && start !== end ? `${start} a ${end}` : start || end || "--";
  return { label, date };
}

export function getChillers(payload: ApiPayload): any[] {
  return Array.isArray(payload?.chillers?.items) ? payload!.chillers.items : [];
}

export function getBombas(payload: ApiPayload): any[] {
  return Array.isArray(payload?.bombas?.items) ? payload!.bombas.items : [];
}

export function chillerByUi(payload: ApiPayload, id: UiGroupId) {
  return getChillers(payload).find((c) => apiIdToUi[c?.id] === id) || null;
}

export function bombaByUi(payload: ApiPayload, id: UiGroupId) {
  return getBombas(payload).find((b) => apiIdToUi[b?.id] === id) || null;
}

function stateToStatus(v: any): "on" | "off" | "fault" {
  const s = String(v || "").toLowerCase();
  if (s.includes("alarme") || s.includes("falha")) return "fault";
  if (s.includes("lig")) return "on";
  return "off";
}

export function toLegacyChiller(c: any, b?: any) {
  const ui = apiIdToUi[c?.id] || "blue";
  const circA = c?.circuitos?.A || {};
  const circB = c?.circuitos?.B || {};
  const pumps = Array.isArray(b?.bombas) ? b.bombas : [];
  const makeCircuit = (src: any, id: "A" | "B") => ({
    id,
    capacity: asNum(src?.capacidade_avg) ?? 0,
    highPressure: asNum(src?.pressao_descarga_avg) ?? 0,
    lowPressure: asNum(src?.pressao_succao_avg) ?? 0,
    oilPressureC1: asNum(src?.pressao_oleo_cp1_avg) ?? 0,
    oilPressureC2: asNum(src?.pressao_oleo_cp2_avg) ?? 0,
    compressor1Status: stateToStatus(src?.compressor_1_atual),
    compressor2Status: stateToStatus(src?.compressor_2_atual),
    healthScore: c?.status === "normal" ? 90 : 72,
    anomalies: Array.isArray(c?.issues) ? c.issues.length : 0,
  });
  return {
    id: ui,
    name: c?.name || `Chiller ${groupName[ui]}`,
    status: c?.status === "normal" ? "running" : "fault",
    command: "auto",
    healthScore: c?.status === "normal" ? 92 : 74,
    capacityTotal: asNum(c?.capacidade?.avg) ?? 0,
    capacityA: asNum(c?.capacidade?.circuito_a_avg) ?? 0,
    capacityB: asNum(c?.capacidade?.circuito_b_avg) ?? 0,
    setpoint: asNum(c?.setpoint?.avg) ?? 0,
    feedTemp: asNum(c?.temperaturas?.saida_avg) ?? 0,
    returnTemp: asNum(c?.temperaturas?.retorno_avg) ?? 0,
    deltaT: asNum(c?.delta_t?.avg) ?? 0,
    externalTemp: asNum(c?.temperaturas?.externa_avg) ?? 0,
    demandLimit: asNum(c?.limite_demanda_avg) ?? 0,
    operatingHours: (asNum(c?.tempo_ligado_horas) ?? 0) * 1000,
    starts: asNum(c?.numero_partidas_final ?? c?.partidas_estimadas) ?? 0,
    alarms: asNum(c?.alarmes?.ocorrencias_amostras) ?? 0,
    activeAlarms: Array.isArray(c?.issues) ? c.issues.map((i: any) => i.title).filter(Boolean) : [],
    risk: statusTone(c?.status) === "ok" ? "ok" : "warn",
    pumpsOn: asNum(b?.resumo_operacional?.bombas_ligadas_avg) ?? 0,
    aiInsight: c?.principal_ocorrencia || "Sem ocorrências relevantes",
    setpointAtingido: c?.setpoint_atingido ?? c?.ui?.setpoint_atingido ?? null,
    eventos_recentes: c?.eventos_recentes || [],
    acoes_recomendadas: c?.acoes_recomendadas || [],
    circuits: [makeCircuit(circA, "A"), makeCircuit(circB, "B")],
    compressors: [],
    pumps: [1, 2, 3, 4].map((id) => {
      const p = pumps.find((x: any) => Number(x.id) === id) || {};
      return {
        id: `BAG${id}`,
        name: `BAG${id}`,
        status: stateToStatus(p.estado_atual),
        mode: String(p.modo_atual || "Remoto").toLowerCase().includes("local") ? "local" : "remote",
        pressureLine: asNum(b?.pressao?.linha_avg) ?? 0,
        pressureSetpoint: asNum(b?.pressao?.setpoint_avg) ?? 0,
        pressureError: asNum(b?.pressao?.erro_avg) ?? 0,
        bypassValve: asNum(b?.bypass?.avg) ?? 0,
        alarm: p.tem_alarme_atual === true,
        healthScore: p.status === "normal" ? 90 : 72,
        lastEvent: p.principal_ocorrencia || "Sem ocorrências relevantes",
      };
    }),
    hydraulic: {
      pressureLine: asNum(b?.pressao?.linha_avg) ?? 0,
      pressureSetpoint: asNum(b?.pressao?.setpoint_avg) ?? 0,
      pressureError: asNum(b?.pressao?.erro_avg) ?? 0,
      bypassValve: asNum(b?.bypass?.avg) ?? 0,
    },
    series: {
      feedReturnSetpoint: (c?.trends?.agua_gelada || []).map((p: any) => ({ t: p.x || p.date || "", feed: asNum(p.saida) ?? 0, ret: asNum(p.entrada) ?? 0, set: asNum(p.setpoint) ?? 0 })),
      deltaT: (c?.trends?.agua_gelada || []).map((p: any) => ({ t: p.x || p.date || "", v: asNum(p.delta_t) ?? 0 })),
      capacity: (c?.trends?.capacidade || []).map((p: any) => ({ t: p.x || p.date || "", total: asNum(p.total) ?? 0, a: asNum(p.circuito_a) ?? 0, b: asNum(p.circuito_b) ?? 0 })),
      pressureHigh: (c?.trends?.pressoes || []).map((p: any) => ({ t: p.x || p.date || "", a: asNum(p.descarga_a) ?? 0, b: asNum(p.descarga_b) ?? 0 })),
      pressureLow: (c?.trends?.pressoes || []).map((p: any) => ({ t: p.x || p.date || "", a: asNum(p.succao_a) ?? 0, b: asNum(p.succao_b) ?? 0 })),
      externalVsCap: [],
      compressorStarts: [],
    },
  } as any;
}

export function legacyChillers(payload: ApiPayload) {
  return ids.map((id) => toLegacyChiller(chillerByUi(payload, id) || { id: uiIdToApi[id], name: `Chiller ${groupName[id]}` }, bombaByUi(payload, id))).filter(Boolean);
}

export function getTrendGroups(payload: ApiPayload, key: string) {
  return payload?.tendencias?.contexts?.[key]?.groups || [];
}

export function apiSeries(rows: any[] = [], map: Record<string, string>) {
  return rows.map((row) => {
    const out: Record<string, any> = { t: row.x || row.date || row.timestamp || "--" };
    Object.entries(map).forEach(([to, from]) => { out[to] = asNum(row[from]) ?? null; });
    return out;
  });
}

export function field(value: any, fallback = dash) {
  return value === null || value === undefined || value === "" ? fallback : value;
}

export function homePageData(payload: ApiPayload, period: UiPeriod, icons: any) {
  const cards = payload?.home?.cards || [];
  const cardBy = (id: string) => cards.find((c: any) => c.id === id) || {};
  const occ = payload?.home?.ocorrencias_dia || payload?.alarmes?.timeline || [];
  const rec = payload?.home?.acoes_recomendadas || payload?.alarmes?.recomendacoes_operacionais || [];
  const chillers = getChillers(payload);
  const statusChillers = payload?.home?.status_chillers || chillers;
  const toneFromStatus = (s: any) => statusTone(s) === "ok" ? "ok" : statusTone(s) === "crit" ? "crit" : "warn";
  const mk = (id: string, icon: any, tone: any, fallbackLabel: string) => {
    const c = cardBy(id);
    return {
      label: c.label || fallbackLabel,
      value: field(c.value),
      detail: c.detail || "",
      previous: c.previous || "",
      delta: c.delta || "",
      deltaTone: c.deltaTone || "neutral",
      icon,
      tone: c.status ? toneFromStatus(c.status) : tone,
    };
  };
  return {
    kpis: [
      mk("chillers_operando", icons.CircuitBoard, "info", "Chillers operando"),
      mk("bombas_operando", icons.Droplets, "ok", "Bombas operando"),
      mk("equipamentos_atencao", icons.AlertTriangle, "warn", "Equipamentos em atenção"),
      mk("alarmes", icons.Bell, "crit", "Alarmes ativos"),
      mk("cobertura_dados", icons.LineChart, "ai", "Disponibilidade dos dados"),
    ],
    occurrences: occ.slice(0, 3).map((o: any) => ({
      title: o.titulo || o.title || field(o.sintoma, "Sem ocorrências relevantes"),
      desc: o.detalhe || o.detail || o.desc || "",
      time: o.time || "--",
      level: String(o.severidade || o.severity || "Info").toLowerCase().includes("crit") ? "Crítico" : String(o.severidade || o.severity || "").toLowerCase().includes("aten") ? "Atenção" : "Info",
      tone: statusTone(o.severidade || o.severity),
      icon: icons.ThermometerSun,
    })),
    recommendations: rec.slice(0, 3).map((r: any) => typeof r === "string" ? { title: r, desc: "" } : { title: r.title || r.titulo || field(r), desc: r.desc || r.subtitle || r.detalhe || "" }),
    chillers: statusChillers.slice(0, 3).map((c: any) => {
      const id = apiIdToUi[c.id] || "blue";
      const full = chillerByUi(payload, id) || c;
      return {
        id: uiIdToApi[id] as "azul" | "vermelho" | "branco",
        name: c.name || full.name || `Chiller ${groupName[id]}`,
        status: (c.status_label || full.status_label || c.status || full.status || "--").toString().toLowerCase().includes("normal") ? "Normal" : "Atenção",
        hours: text(full.tempo_ligado_horas, " h", 1),
        deltaT: text(c.delta_t ?? full.delta_t?.avg, "°C", 1),
        setpoint: textInt(full.setpoint_atingido ?? full.ui?.setpoint_atingido, "%"),
        compare: "",
        note: c.principal_ocorrencia || full.principal_ocorrencia || "Sem ocorrências relevantes",
        tone: toneFromStatus(c.status || full.status),
      };
    }),
    summary: payload?.assistente_ia?.resumo_periodo?.principais_ocorrencias?.join(". ") || payload?.tendencias?.resumo_automatico_periodo?.join(" ") || "Sem ocorrências relevantes no período selecionado.",
  };
}
