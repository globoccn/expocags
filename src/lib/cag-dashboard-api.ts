import { useEffect, useMemo, useState } from "react";

export type UiPeriod = "d1" | "7d" | "1m";
export type ApiPeriod = "d_1" | "week" | "month";

export const periodToApi = (period: UiPeriod): ApiPeriod =>
  period === "7d" ? "week" : period === "1m" ? "month" : "d_1";

export const apiToUi = (period: ApiPeriod): UiPeriod =>
  period === "week" ? "7d" : period === "month" ? "1m" : "d1";

export const periodLabel = (period: UiPeriod) =>
  period === "7d" ? "7 dias" : period === "1m" ? "1 mês" : "D-1";

export const comparisonLabel = (period: UiPeriod) =>
  period === "7d" ? "vs semana anterior" : period === "1m" ? "vs mês anterior" : "vs dia anterior";

export function getDashboardApiBase() {
  const envUrl = import.meta.env.VITE_CAG_DASHBOARD_API_URL as string | undefined;
  return (envUrl || "/webhook/cag/dashboard").replace(/\/$/, "");
}

export async function fetchDashboardPeriod(period: UiPeriod, signal?: AbortSignal) {
  const url = `${getDashboardApiBase()}?period=${periodToApi(period)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API Dashboard retornou HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.ok === false) throw new Error(payload?.message || payload?.error || "API Dashboard retornou erro");
  return payload?.data ?? payload?.payload ?? payload;
}

export function useGlobalPeriod() {
  const [period, setPeriod] = useState<UiPeriod>(() => {
    if (typeof window === "undefined") return "d1";
    const stored = window.localStorage.getItem("cag-period") as UiPeriod | null;
    return stored === "7d" || stored === "1m" || stored === "d1" ? stored : "d1";
  });

  useEffect(() => {
    const onChange = (event: Event) => {
      const detail = (event as CustomEvent).detail as UiPeriod | undefined;
      if (detail === "d1" || detail === "7d" || detail === "1m") setPeriod(detail);
    };
    const onStorage = () => {
      const stored = window.localStorage.getItem("cag-period") as UiPeriod | null;
      if (stored === "d1" || stored === "7d" || stored === "1m") setPeriod(stored);
    };
    window.addEventListener("cag-period-change", onChange);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener("cag-period-change", onChange);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return period;
}

export function useDashboardPeriod() {
  const period = useGlobalPeriod();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    fetchDashboardPeriod(period, controller.signal)
      .then((payload) => setData(payload))
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err?.message || "Falha ao carregar dados da API Dashboard");
        setData(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period]);

  return useMemo(() => ({ period, data, error, loading }), [period, data, error, loading]);
}

const num = (v: any, fallback = 0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : fallback;
};
const fmt = (v: any, digits = 1, suffix = "") => {
  const n = Number(v);
  if (!Number.isFinite(n)) return `--${suffix}`;
  return `${n.toLocaleString("pt-BR", { maximumFractionDigits: digits, minimumFractionDigits: digits })}${suffix}`;
};
const statusTone = (status: any) => String(status || "normal").toLowerCase().includes("crit") ? "crit" : String(status || "normal").toLowerCase().includes("aten") ? "warn" : "ok";

export function normalizeHomePayload(payload: any, period: UiPeriod) {
  const home = payload?.home || {};
  const central = payload?.central || payload?.resumo || {};
  const periodInfo = payload?.period || {};
  const chillers = payload?.chillers?.items || payload?.chillers || [];
  const bombas = payload?.bombas?.items || payload?.bombas || [];
  const alarmes = payload?.alarmes || {};
  const ai = payload?.assistente_ia || payload?.ia || {};
  const diagnostics = ai?.diagnosticos || payload?.diagnosticos_manutencao || [];
  const kpisSrc = Array.isArray(home?.kpis) ? home.kpis : [];

  const equipamentosAtencao = kpisSrc.find((k: any) => String(k.id || k.label || "").includes("atencao"))?.value ?? central?.equipamentos_em_atencao ?? [...chillers, ...bombas].filter((x: any) => x.status && x.status !== "normal").length;
  const alarmesAtivos = alarmes?.resumo?.ativos ?? central?.alarmes_ativos ?? (alarmes?.timeline || []).filter((x: any) => x.status === "ativo").length ?? 0;
  const cobertura = central?.cobertura_media ?? periodInfo?.coverage_pct ?? payload?.coverage_pct ?? payload?.quality?.coverage_pct;

  const normalizedChillers = chillers.map((c: any) => ({
    id: c.id,
    name: c.name || `Chiller ${String(c.id || "").replace(/^./, (m) => m.toUpperCase())}`,
    status: c.status === "normal" ? "Normal" : "Atenção",
    hours: fmt(c.operacao?.horas ?? c.horas_operacao ?? c.operating_hours, 1, " h"),
    deltaT: fmt(c.delta_t?.avg ?? c.delta_t_medio ?? c.deltaT, 2, "°C"),
    setpoint: fmt(c.capacidade?.avg ?? c.capacidade_total ?? c.capacity, 1, "%"),
    compare: comparisonLabel(period),
    note: c.status === "normal" ? "Sem ocorrências relevantes" : (c.principal_ocorrencia || c.issues?.[0]?.title || "Requer atenção"),
    tone: statusTone(c.status),
  }));

  const timeline = alarmes?.timeline || [];
  const occurrences = timeline.slice(0, 3).map((item: any) => ({
    title: item.title || item.evento || "Ocorrência operacional",
    desc: item.description || item.desc || item.equipment_name || item.equipamento || "Evento detectado no período selecionado",
    time: item.time || item.hora || "--:--",
    level: String(item.severity || item.severidade || "info").toLowerCase().includes("crit") ? "Crítico" : String(item.severity || item.severidade || "").toLowerCase().includes("aten") ? "Atenção" : "Info",
    tone: String(item.severity || item.severidade || "").toLowerCase().includes("crit") ? "crit" : String(item.severity || item.severidade || "").toLowerCase().includes("aten") ? "warn" : "info",
  }));

  const recommendations = (alarmes?.recomendacoes_operacionais || ai?.resumo_periodo?.recomendacoes_prioritarias || diagnostics.flatMap((d: any) => d.acoes_recomendadas || []) || [])
    .slice(0, 3)
    .map((r: any) => ({ title: typeof r === "string" ? r : r.title || "Ação recomendada", desc: typeof r === "string" ? "Gerado a partir dos dados operacionais consolidados." : r.desc || r.description || "Gerado a partir dos dados operacionais consolidados." }));

  return {
    kpis: [
      { label: "Chillers operando", value: String(chillers.filter((c: any) => c.status === "normal" || c.operando === true).length || chillers.length || "--"), detail: `de ${chillers.length || 3}`, previous: comparisonLabel(period), delta: "", deltaTone: "neutral", tone: "info" },
      { label: "Bombas operando", value: String(bombas.filter((b: any) => b.status === "normal" || b.operando === true).length || bombas.length || "--"), detail: `de ${bombas.length || 3}`, previous: comparisonLabel(period), delta: "", deltaTone: "neutral", tone: "ok" },
      { label: "Equipamentos em atenção", value: String(equipamentosAtencao ?? "--"), detail: "requerem verificação", previous: comparisonLabel(period), delta: "", deltaTone: "neutral", tone: Number(equipamentosAtencao) > 0 ? "warn" : "ok" },
      { label: "Alarmes ativos", value: String(alarmesAtivos ?? "--"), detail: "eventos ativos", previous: comparisonLabel(period), delta: "", deltaTone: "neutral", tone: Number(alarmesAtivos) > 0 ? "crit" : "ok" },
      { label: "Cobertura dos dados", value: fmt(cobertura, 1, "%"), detail: "leituras válidas", previous: comparisonLabel(period), delta: "", deltaTone: "neutral", tone: num(cobertura, 100) < 95 ? "warn" : "ai" },
    ],
    occurrences: occurrences.length ? occurrences : [{ title: "Sem ocorrências relevantes", desc: "Nenhum evento crítico foi identificado no período.", time: "--:--", level: "Info", tone: "ok" }],
    recommendations: recommendations.length ? recommendations : [{ title: "Manter acompanhamento operacional", desc: "Não há recomendações prioritárias no período selecionado." }],
    chillers: normalizedChillers,
    summary: home?.summary || ai?.resumo_periodo?.texto || central?.resumo || `Dados reais carregados da API Dashboard para ${periodLabel(period)}.`,
    analyzed: periodInfo?.label || periodInfo?.date_range || periodInfo?.date || periodLabel(period),
    coverage: fmt(cobertura, 1, "%"),
    baseDate: periodInfo?.latest_date || periodInfo?.date || payload?.date || "--",
    updatedAt: payload?.generated_at || periodInfo?.generated_at || null,
  };
}

export function mergeChillersFromDashboard<T extends { id: string }>(payload: any, fallback: T[]): T[] {
  const apiItems = payload?.chillers?.items || payload?.chillers || [];
  if (!Array.isArray(apiItems) || !apiItems.length) return fallback;
  const idMap: Record<string, string> = { azul: "blue", vermelho: "red", branco: "white", blue: "blue", red: "red", white: "white" };
  return fallback.map((base: any) => {
    const api = apiItems.find((x: any) => idMap[x.id] === base.id || x.id === base.id);
    if (!api) return base;
    const status = api.status === "normal" ? "running" : "fault";
    return {
      ...base,
      name: api.name || base.name,
      status,
      risk: api.status === "normal" ? "ok" : "alert",
      healthScore: api.score ?? api.healthScore ?? base.healthScore,
      capacityTotal: api.capacidade?.avg ?? api.capacidade_total ?? base.capacityTotal,
      capacityA: api.capacidade?.circuito_a_avg ?? base.capacityA,
      capacityB: api.capacidade?.circuito_b_avg ?? base.capacityB,
      setpoint: api.setpoint?.avg ?? base.setpoint,
      feedTemp: api.temperaturas?.saida_avg ?? base.feedTemp,
      returnTemp: api.temperaturas?.retorno_avg ?? base.returnTemp,
      deltaT: api.delta_t?.avg ?? base.deltaT,
      externalTemp: api.temperaturas?.externa_avg ?? base.externalTemp,
      demandLimit: api.limite_demanda_avg ?? base.demandLimit,
      operatingHours: api.operacao?.horas ?? api.horas_operacao ?? base.operatingHours,
      starts: api.operacao?.partidas ?? api.numero_partidas ?? base.starts,
      alarms: api.issues?.length ?? api.alarmes?.ocorrencias_amostras ?? base.alarms,
      activeAlarms: (api.issues || []).map((i: any) => i.title).slice(0, 3),
      aiInsight: api.aiInsight || api.issues?.[0]?.title || (api.status === "normal" ? "Operação sem ocorrências relevantes no período." : "Equipamento requer atenção no período."),
      circuits: base.circuits?.map((c: any) => {
        const circ = api.circuitos?.[c.id] || {};
        return {
          ...c,
          capacity: circ.capacidade_avg ?? c.capacity,
          highPressure: circ.pressao_descarga_avg ? circ.pressao_descarga_avg / 50 : c.highPressure,
          lowPressure: circ.pressao_succao_avg ? circ.pressao_succao_avg / 50 : c.lowPressure,
          oilPressureC1: circ.pressao_oleo_cpr1_avg ? circ.pressao_oleo_cpr1_avg / 100 : c.oilPressureC1,
          oilPressureC2: circ.pressao_oleo_cpr2_avg ? circ.pressao_oleo_cpr2_avg / 100 : c.oilPressureC2,
        };
      }) || base.circuits,
      series: {
        ...base.series,
        feedReturnSetpoint: (api.trends?.agua_gelada || []).map((p: any) => ({ t: p.t || p.label || "", feed: p.saida ?? p.feed ?? 0, ret: p.entrada ?? p.ret ?? 0, set: p.setpoint ?? p.set ?? 0 })) || base.series?.feedReturnSetpoint,
        deltaT: (api.trends?.agua_gelada || []).map((p: any) => ({ t: p.t || p.label || "", v: p.delta_t ?? p.v ?? 0 })) || base.series?.deltaT,
        capacity: (api.trends?.capacidade || []).map((p: any) => ({ t: p.t || p.label || "", total: p.total ?? 0, a: p.circuito_a ?? 0, b: p.circuito_b ?? 0 })) || base.series?.capacity,
        pressureHigh: (api.trends?.pressoes || []).map((p: any) => ({ t: p.t || p.label || "", a: (p.descarga_a ?? 0) / 50, b: (p.descarga_b ?? 0) / 50 })) || base.series?.pressureHigh,
        pressureLow: (api.trends?.pressoes || []).map((p: any) => ({ t: p.t || p.label || "", a: (p.succao_a ?? 0) / 50, b: (p.succao_b ?? 0) / 50 })) || base.series?.pressureLow,
      },
    };
  });
}

export function dashboardTimeline(payload: any) {
  return payload?.alarmes?.timeline || [];
}

export function dashboardRecommendations(payload: any) {
  return payload?.alarmes?.recomendacoes_operacionais || payload?.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias || [];
}
