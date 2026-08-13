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
    capacity: asNum(src?.capacidade_avg),
    highPressure: asNum(src?.pressao_descarga_avg),
    lowPressure: asNum(src?.pressao_succao_avg),
    oilPressureC1: asNum(src?.pressao_oleo_cp1_avg),
    oilPressureC2: asNum(src?.pressao_oleo_cp2_avg),
    compressor1Status: stateToStatus(src?.compressor_1_atual),
    compressor2Status: stateToStatus(src?.compressor_2_atual),
    compressor1Hours: asNum(src?.compressor_1_horas_ligado),
    compressor2Hours: asNum(src?.compressor_2_horas_ligado),
    healthScore: c?.status === "normal" ? 90 : 72,
    anomalies: Array.isArray(c?.issues) ? c.issues.length : 0,
  });
  return {
    id: ui,
    name: c?.name || `Chiller ${groupName[ui]}`,
    status: c?.status === "normal" ? "running" : "fault",
    command: "auto",
    healthScore: c?.status === "normal" ? 92 : 74,
    capacityTotal: asNum(c?.capacidade?.avg),
    capacityA: asNum(c?.capacidade?.circuito_a_avg),
    capacityB: asNum(c?.capacidade?.circuito_b_avg),
    setpoint: asNum(c?.setpoint?.avg),
    feedTemp: asNum(c?.temperaturas?.saida_avg),
    returnTemp: asNum(c?.temperaturas?.retorno_avg),
    deltaT: asNum(c?.delta_t?.avg),
    externalTemp: asNum(c?.temperaturas?.externa_avg),
    demandLimit: asNum(c?.limite_demanda_avg),
    operatingHours: asNum(c?.tempo_ligado_horas) === null ? null : asNum(c?.tempo_ligado_horas)! * 1000,
    starts: asNum(c?.numero_partidas_final ?? c?.partidas_estimadas),
    alarms: asNum(c?.alarmes?.ocorrencias_amostras),
    activeAlarms: Array.isArray(c?.issues) ? c.issues.map((i: any) => i.title).filter(Boolean) : [],
    risk: statusTone(c?.status) === "ok" ? "ok" : "warn",
    pumpsOn: asNum(b?.resumo_operacional?.bombas_ligadas_avg) ?? 0,
    aiInsight: c?.principal_ocorrencia || "Sem ocorrências relevantes",
    setpointAtingido: c?.setpoint?.atingido_pct ?? c?.ui?.cards?.find?.((card: any) => card.id === "setpoint_atingido")?.raw_value ?? null,
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
        pressureLine: asNum(b?.pressao?.linha_avg),
        pressureSetpoint: asNum(b?.pressao?.setpoint_avg),
        pressureError: asNum(b?.pressao?.erro_avg),
        bypassValve: asNum(b?.bypass?.avg),
        alarm: p.tem_alarme_atual === true,
        healthScore: p.status === "normal" ? 90 : 72,
        hoursOn: asNum(p.horas_ligada),
        starts: asNum(p.partidas_estimadas),
        lastEvent: p.principal_ocorrencia || "Sem ocorrências relevantes",
      };
    }),
    hydraulic: {
      pressureLine: asNum(b?.pressao?.linha_avg),
      pressureSetpoint: asNum(b?.pressao?.setpoint_avg),
      pressureError: asNum(b?.pressao?.erro_avg),
      bypassValve: asNum(b?.bypass?.avg),
    },
    series: {
      feedReturnSetpoint: (c?.trends?.agua_gelada || []).map((p: any) => ({ t: p.x || p.date || "", feed: asNum(p.saida), ret: asNum(p.entrada), set: asNum(p.setpoint) })),
      deltaT: (c?.trends?.agua_gelada || []).map((p: any) => ({ t: p.x || p.date || "", v: asNum(p.delta_t) })),
      capacity: (c?.trends?.capacidade || []).map((p: any) => ({ t: p.x || p.date || "", total: asNum(p.total), a: asNum(p.circuito_a), b: asNum(p.circuito_b) })),
      pressureHigh: (c?.trends?.pressoes || []).map((p: any) => ({ t: p.x || p.date || "", a: asNum(p.descarga_a), b: asNum(p.descarga_b) })),
      pressureLow: (c?.trends?.pressoes || []).map((p: any) => ({ t: p.x || p.date || "", a: asNum(p.succao_a), b: asNum(p.succao_b) })),
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
  const chillers = getChillers(payload);
  const statusChillers = payload?.home?.status_chillers || payload?.home?.comparativo_chillers || chillers;
  const toneFromStatus = (s: any) => statusTone(s) === "ok" ? "ok" : statusTone(s) === "crit" ? "crit" : "warn";
  const mk = (id: string, icon: any, tone: any, fallbackLabel: string, fallbackDetail = "") => {
    const c = cardBy(id);
    const rawSpark = Array.isArray(c.sparkline) ? c.sparkline : Array.isArray(c.spark) ? c.spark : [];
    return {
      label: c.label || fallbackLabel,
      value: field(c.value),
      detail: c.detail || fallbackDetail,
      previous: c.previous || c.comparison?.label || "",
      delta: c.delta || c.comparison?.text || "",
      deltaTone: c.deltaTone || c.comparison?.direction || "neutral",
      sparkline: rawSpark
        .map((p: any, i: number) => ({ i: Number(p?.i ?? i), v: Number(p?.v ?? p) }))
        .filter((p: any) => Number.isFinite(p.v)),
      icon,
      tone: c.status ? toneFromStatus(c.status) : tone,
    };
  };
  return {
    kpis: [
      mk("chillers_operando", icons.CircuitBoard, "info", "Chillers que operaram"),
      mk("capacidade_utilizada", icons.Gauge, "info", "Capacidade média utilizada"),
      mk("equipamentos_atencao", icons.AlertTriangle, "warn", "Equipamentos em atenção"),
      mk("condicao_climatica", icons.ThermometerSun, "ok", "Condição climática"),
      mk("delta_t_medio", icons.Droplets, "ai", "Delta T médio da central"),
    ],
    chillers: statusChillers.slice(0, 3).map((c: any) => {
      const id = apiIdToUi[c.id] || "blue";
      const full = chillerByUi(payload, id) || c;
      return {
        id: uiIdToApi[id] as "azul" | "vermelho" | "branco",
        name: c.name || full.name || `Chiller ${groupName[id]}`,
        status: (c.status_label || full.status_label || c.status || full.status || "--").toString().toLowerCase().includes("normal") ? "Normal" : "Atenção",
        hours: text(full.tempo_ligado_horas, " h", 1),
        deltaT: text(c.delta_t ?? full.delta_t?.avg, "°C", 1),
        capacity: textInt(c.capacidade ?? full.capacidade?.avg, "%"),
        setpoint: textInt(c.setpoint_atingido ?? full.setpoint?.atingido_pct ?? full.ui?.cards?.find?.((card: any) => card.id === "setpoint_atingido")?.raw_value, "%"),
        compare: "",
        note: c.principal_ocorrencia || full.principal_ocorrencia || "Sem ocorrências relevantes",
        tone: toneFromStatus(c.status || full.status),
      };
    }),
    evolution: Array.isArray(payload?.home?.evolucao_principal?.series) ? payload.home.evolucao_principal.series : [],
    evolutionMeta: payload?.home?.evolucao_principal || {},
    summary: payload?.home?.resumo_executivo || payload?.tendencias?.resumo_automatico_periodo?.join(" ") || "Período consolidado sem resumo disponível.",
  };
}
