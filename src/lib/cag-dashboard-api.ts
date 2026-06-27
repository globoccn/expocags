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
  const dashboardUrl = import.meta.env.VITE_CAG_DASHBOARD_API_URL as string | undefined;
  const apiUrl = import.meta.env.VITE_API_URL as string | undefined;

  // VITE_CAG_DASHBOARD_API_URL can be used when the full endpoint is provided.
  if (dashboardUrl) return dashboardUrl.replace(/\/$/, "");

  // Current production env uses VITE_API_URL=https://.../webhook.
  // The dashboard endpoint must therefore be /cag/dashboard under that base.
  if (apiUrl) return `${apiUrl.replace(/\/$/, "")}/cag/dashboard`;

  // Local/dev fallback keeps the previous relative path.
  return "/webhook/cag/dashboard";
}

export async function fetchDashboardPeriod(period: UiPeriod, signal?: AbortSignal) {
  const url = `${getDashboardApiBase()}?period=${periodToApi(period)}`;
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`API Dashboard retornou HTTP ${response.status}`);
  const payload = await response.json();
  if (payload?.ok === false)
    throw new Error(payload?.message || payload?.error || "API Dashboard retornou erro");
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
const statusTone = (status: any) =>
  String(status || "normal")
    .toLowerCase()
    .includes("crit")
    ? "crit"
    : String(status || "normal")
          .toLowerCase()
          .includes("aten")
      ? "warn"
      : "ok";

const asArray = (v: any) => (Array.isArray(v) ? v : []);
const firstNumber = (...values: any[]) => {
  for (const value of values) {
    const n = Number(value);
    if (Number.isFinite(n)) return n;
  }
  return undefined;
};
const cleanPct = (value: any) => {
  if (typeof value === "string") return Number(value.replace("%", "").replace(",", "."));
  return Number(value);
};
const idToUi: Record<string, string> = {
  azul: "blue",
  vermelho: "red",
  branco: "white",
  blue: "blue",
  red: "red",
  white: "white",
};
const uiToApi: Record<string, string> = { blue: "azul", red: "vermelho", white: "branco" };
const niceId = (id: any) => idToUi[String(id || "").toLowerCase()] || String(id || "blue");
const apiId = (id: any) => uiToApi[String(id || "").toLowerCase()] || String(id || "azul");
const severityTone = (value: any) => {
  const s = String(value || "").toLowerCase();
  if (s.includes("crit") || s.includes("alta")) return "crit";
  if (s.includes("aten") || s.includes("media") || s.includes("warn")) return "warn";
  return "ok";
};
const periodDateLabel = (payload: any, period: UiPeriod) => {
  const p = payload?.period || {};
  if (p.label && p.date) return `${p.label} · ${p.date}`;
  if (p.label) return p.label;
  return periodLabel(period);
};

export function normalizeHomePayload(payload: any, period: UiPeriod) {
  const home = payload?.home || {};
  const central = payload?.central || payload?.raw_summary || {};
  const periodInfo = payload?.period || {};
  const apiChillers = asArray(payload?.chillers?.items || payload?.chillers);
  const apiBombas = asArray(payload?.bombas?.items || payload?.bombas);
  const alarmes = payload?.alarmes || {};
  const ai = payload?.assistente_ia || payload?.ia || {};
  const diagnostics = asArray(ai?.diagnosticos || payload?.diagnosticos_manutencao);
  const cards = asArray(home?.cards || home?.kpis);
  const cardBy = (id: string) =>
    cards.find((c: any) =>
      String(c.id || c.label || "")
        .toLowerCase()
        .includes(id),
    );

  const coberturaRaw =
    cardBy("cobertura")?.value ??
    payload?.data_quality?.coverage_pct ??
    periodInfo?.coverage_pct ??
    central?.coverage_pct;
  const cobertura = cleanPct(coberturaRaw);
  const ativos =
    alarmes?.summary?.ativos ??
    cardBy("alarmes")?.value ??
    asArray(alarmes?.timeline).filter((x: any) =>
      String(x.status || "")
        .toLowerCase()
        .includes("ativo"),
    ).length;
  const atencao =
    cardBy("equipamentos")?.value ??
    central?.equipamentos_em_atencao ??
    diagnostics.filter((d: any) => severityTone(d.prioridade) !== "ok").length;

  const normalizedChillers = asArray(home?.status_chillers).length
    ? asArray(home.status_chillers).map((c: any) => ({
        id: niceId(c.id),
        name: c.name || `Chiller ${c.id}`,
        status:
          c.status_label ||
          (statusTone(c.status) === "crit"
            ? "Crítico"
            : statusTone(c.status) === "warn"
              ? "Atenção"
              : "Normal"),
        hours: "-- h",
        deltaT: fmt(c.delta_t, 2, "°C"),
        setpoint: fmt(c.capacidade, 1, "%"),
        compare: comparisonLabel(period),
        note: c.principal_ocorrencia || "Sem ocorrências relevantes",
        tone: statusTone(c.status),
      }))
    : apiChillers.map((c: any) => ({
        id: niceId(c.id),
        name: c.name || `Chiller ${c.id}`,
        status:
          statusTone(c.status || c.status_label) === "crit"
            ? "Crítico"
            : statusTone(c.status || c.status_label) === "warn"
              ? "Atenção"
              : "Normal",
        hours: fmt(c.tempo_ligado_horas ?? c.operacao?.horas ?? c.horas_operacao, 1, " h"),
        deltaT: fmt(c.delta_t?.avg ?? c.delta_t_medio, 2, "°C"),
        setpoint: fmt(c.capacidade?.avg ?? c.capacidade_total, 1, "%"),
        compare: comparisonLabel(period),
        note:
          c.principal_ocorrencia ||
          c.diagnostics?.principal_ocorrencia ||
          (statusTone(c.status) === "ok" ? "Sem ocorrências relevantes" : "Requer atenção"),
        tone: statusTone(c.status),
      }));

  const occurrencesSource = asArray(home?.ocorrencias_dia).length
    ? home.ocorrencias_dia
    : asArray(alarmes?.timeline);
  const occurrences = asArray(occurrencesSource)
    .slice(0, 4)
    .map((item: any) => ({
      title: item.titulo || item.title || item.evento || "Ocorrência operacional",
      desc:
        item.detalhe ||
        item.description ||
        item.desc ||
        item.equipment_name ||
        item.equipamento ||
        "Evento detectado no período selecionado",
      time: item.time || item.hora || "--:--",
      level:
        severityTone(item.severidade || item.severity) === "crit"
          ? "Crítico"
          : severityTone(item.severidade || item.severity) === "warn"
            ? "Atenção"
            : "Info",
      tone:
        severityTone(item.severidade || item.severity) === "crit"
          ? "crit"
          : severityTone(item.severidade || item.severity) === "warn"
            ? "warn"
            : "info",
    }));

  const recommendations = asArray(
    home?.acoes_recomendadas ||
      alarmes?.recomendacoes_operacionais ||
      ai?.resumo_periodo?.recomendacoes_prioritarias ||
      diagnostics.flatMap((d: any) => d.acoes_recomendadas || []),
  )
    .slice(0, 4)
    .map((r: any) => ({
      title: typeof r === "string" ? r : r.title || r.text || "Ação recomendada",
      desc:
        typeof r === "string"
          ? "Gerado a partir dos dados operacionais consolidados."
          : r.desc ||
            r.description ||
            r.detail ||
            "Gerado a partir dos dados operacionais consolidados.",
    }));

  const chillersCard = cardBy("chillers");
  const bombasCard = cardBy("bombas");
  const alarmesCard = cardBy("alarmes");
  const coberturaCard = cardBy("cobertura");
  const atencaoCard = cardBy("equipamentos");

  return {
    kpis: [
      {
        label: chillersCard?.label || "Chillers operando",
        value: String(
          chillersCard?.value ??
            `${
              apiChillers.filter((c: any) =>
                String(c.estado_atual || "")
                  .toLowerCase()
                  .includes("ligado"),
              ).length
            }/${apiChillers.length || 3}`,
        ),
        detail: apiChillers.length ? `de ${apiChillers.length}` : "do período",
        previous: comparisonLabel(period),
        delta: "",
        deltaTone: "neutral",
        tone: statusTone(chillersCard?.status) === "ok" ? "info" : "warn",
      },
      {
        label: bombasCard?.label || "Bombas operando",
        value: String(bombasCard?.value ?? apiBombas.length),
        detail: apiBombas.length ? `de ${apiBombas.length}` : "grupos",
        previous: comparisonLabel(period),
        delta: "",
        deltaTone: "neutral",
        tone: statusTone(bombasCard?.status) === "ok" ? "ok" : "warn",
      },
      {
        label: atencaoCard?.label || "Equipamentos em atenção",
        value: String(atencaoCard?.value ?? atencao ?? "--"),
        detail: "requerem verificação",
        previous: comparisonLabel(period),
        delta: "",
        deltaTone: "neutral",
        tone: Number(atencaoCard?.value ?? atencao) > 0 ? "warn" : "ok",
      },
      {
        label: alarmesCard?.label || "Alarmes",
        value: String(alarmesCard?.value ?? ativos ?? "--"),
        detail: "eventos no período",
        previous: comparisonLabel(period),
        delta: "",
        deltaTone: "neutral",
        tone: Number(alarmesCard?.value ?? ativos) > 0 ? "crit" : "ok",
      },
      {
        label: coberturaCard?.label || "Cobertura dos dados",
        value: typeof coberturaRaw === "string" ? coberturaRaw : fmt(cobertura, 1, "%"),
        detail: "leituras válidas",
        previous: comparisonLabel(period),
        delta: "",
        deltaTone: "neutral",
        tone: num(cobertura, 100) < 95 ? "warn" : "ai",
      },
    ],
    occurrences: occurrences.length
      ? occurrences
      : [
          {
            title: "Sem ocorrências relevantes",
            desc: "Nenhum evento crítico foi identificado no período.",
            time: "--:--",
            level: "Info",
            tone: "ok",
          },
        ],
    recommendations: recommendations.length
      ? recommendations
      : [
          {
            title: "Manter acompanhamento operacional",
            desc: "Não há recomendações prioritárias no período selecionado.",
          },
        ],
    chillers: normalizedChillers,
    summary:
      home?.summary ||
      ai?.resumo_periodo?.texto ||
      central?.resumo ||
      `Dados reais carregados da API Dashboard para ${periodLabel(period)}.`,
    analyzed: periodDateLabel(payload, period),
    coverage: typeof coberturaRaw === "string" ? coberturaRaw : fmt(cobertura, 1, "%"),
    baseDate: periodInfo?.latest_available_date || periodInfo?.date || payload?.date || "--",
    updatedAt: payload?.generated_at || periodInfo?.generated_at || null,
  };
}

export function mergeChillersFromDashboard<T extends { id: string }>(
  payload: any,
  fallback: T[],
): T[] {
  const apiItems = asArray(payload?.chillers?.items || payload?.chillers);
  if (!apiItems.length) return fallback;
  return fallback.map((base: any) => {
    const api = apiItems.find((x: any) => niceId(x.id) === base.id);
    if (!api) return base;
    const statusToneValue = api.status
      ? statusTone(api.status)
      : String(api.estado_atual || "")
            .toLowerCase()
            .includes("ligado")
        ? "ok"
        : "warn";
    const trends = api.trends || {};
    const mapWater = (p: any) => ({
      t: p.x || p.t || p.label || "",
      feed: firstNumber(p.saida, p.feed),
      ret: firstNumber(p.entrada, p.ret),
      set: firstNumber(p.setpoint, p.set),
    });
    const mapDelta = (p: any) => ({
      t: p.x || p.t || p.label || "",
      v: firstNumber(p.delta_t, p.deltaT, p.v),
    });
    const mapCap = (p: any) => ({
      t: p.x || p.t || p.label || "",
      total: firstNumber(p.total, p.capacidade_total),
      a: firstNumber(p.circuito_a, p.a),
      b: firstNumber(p.circuito_b, p.b),
    });
    const mapPressHigh = (p: any) => ({
      t: p.x || p.t || p.label || "",
      a: (firstNumber(p.descarga_a, p.pressao_descarga_a, p.a) ?? 0) / 50,
      b: (firstNumber(p.descarga_b, p.pressao_descarga_b, p.b) ?? 0) / 50,
    });
    const mapPressLow = (p: any) => ({
      t: p.x || p.t || p.label || "",
      a: (firstNumber(p.succao_a, p.pressao_succao_a, p.a) ?? 0) / 50,
      b: (firstNumber(p.succao_b, p.pressao_succao_b, p.b) ?? 0) / 50,
    });
    return {
      ...base,
      name: api.name || base.name,
      status: String(api.estado_atual || "")
        .toLowerCase()
        .includes("ligado")
        ? "running"
        : "off",
      risk: statusToneValue === "crit" ? "alert" : statusToneValue === "warn" ? "alert" : "ok",
      healthScore:
        api.score ??
        api.healthScore ??
        (statusToneValue === "crit" ? 55 : statusToneValue === "warn" ? 72 : 90),
      capacityTotal: firstNumber(api.capacidade?.avg, api.capacidade_total, base.capacityTotal),
      capacityA: firstNumber(api.capacidade?.circuito_a_avg, base.capacityA),
      capacityB: firstNumber(api.capacidade?.circuito_b_avg, base.capacityB),
      setpoint: firstNumber(api.setpoint?.avg, base.setpoint),
      feedTemp: firstNumber(api.temperaturas?.saida_avg, base.feedTemp),
      returnTemp: firstNumber(api.temperaturas?.retorno_avg, base.returnTemp),
      deltaT: firstNumber(api.delta_t?.avg, api.delta_t_medio, base.deltaT),
      externalTemp: firstNumber(api.temperaturas?.externa_avg, base.externalTemp),
      demandLimit: firstNumber(api.limite_demanda_avg, base.demandLimit),
      operatingHours: firstNumber(
        api.tempo_ligado_horas,
        api.operacao?.horas,
        api.horas_operacao,
        base.operatingHours,
      ),
      starts: firstNumber(
        api.partidas_estimadas,
        api.operacao?.partidas,
        api.numero_partidas_final,
        base.starts,
      ),
      alarms: firstNumber(api.alarmes?.ocorrencias_amostras, base.alarms),
      activeAlarms: asArray(api.issues)
        .map((i: any) => i.title)
        .concat(
          Object.entries(api.diagnostics || {})
            .filter(([, v]) => v)
            .map(([k]) => k.replaceAll("_", " ")),
        )
        .slice(0, 4),
      aiInsight:
        api.aiInsight ||
        api.principal_ocorrencia ||
        (statusToneValue === "ok"
          ? "Operação sem ocorrências relevantes no período."
          : "Equipamento requer atenção no período."),
      circuits:
        base.circuits?.map((c: any) => {
          const circ = api.circuitos?.[c.id] || {};
          return {
            ...c,
            capacity: firstNumber(circ.capacidade_avg, c.capacity),
            highPressure: firstNumber(circ.pressao_descarga_avg, c.highPressure * 50) / 50,
            lowPressure: firstNumber(circ.pressao_succao_avg, c.lowPressure * 50) / 50,
            oilPressureC1:
              firstNumber(
                circ.pressao_oleo_cp1_avg,
                circ.pressao_oleo_cpr1_avg,
                c.oilPressureC1 * 100,
              ) / 100,
            oilPressureC2:
              firstNumber(
                circ.pressao_oleo_cp2_avg,
                circ.pressao_oleo_cpr2_avg,
                c.oilPressureC2 * 100,
              ) / 100,
            compressor1Status: String(circ.compressor_1_atual || "")
              .toLowerCase()
              .includes("ligado")
              ? "on"
              : "off",
            compressor2Status: String(circ.compressor_2_atual || "")
              .toLowerCase()
              .includes("ligado")
              ? "on"
              : "off",
          };
        }) || base.circuits,
      series: {
        ...base.series,
        feedReturnSetpoint:
          asArray(trends.agua_gelada)
            .map(mapWater)
            .filter((p: any) => p.feed != null || p.ret != null) || base.series?.feedReturnSetpoint,
        deltaT:
          asArray(trends.agua_gelada)
            .map(mapDelta)
            .filter((p: any) => p.v != null) || base.series?.deltaT,
        capacity:
          asArray(trends.capacidade)
            .map(mapCap)
            .filter((p: any) => p.total != null || p.a != null || p.b != null) ||
          base.series?.capacity,
        pressureHigh:
          asArray(trends.pressoes)
            .map(mapPressHigh)
            .filter((p: any) => p.a || p.b) || base.series?.pressureHigh,
        pressureLow:
          asArray(trends.pressoes)
            .map(mapPressLow)
            .filter((p: any) => p.a || p.b) || base.series?.pressureLow,
      },
    };
  });
}

export function mergePumpGroupsFromDashboard<T extends { id: string }>(
  payload: any,
  fallback: T[],
): T[] {
  const apiItems = asArray(payload?.bombas?.items || payload?.bombas);
  if (!apiItems.length) return fallback;
  return fallback.map((base: any) => {
    const api = apiItems.find((x: any) => niceId(x.id) === base.id);
    if (!api) return base;
    const pressureLine =
      firstNumber(
        api.pressao_linha?.avg,
        api.pressao_media,
        api.pressao_linha_avg,
        base.hydraulic?.pressureLine,
      ) ?? 0;
    const pressureSetpoint =
      firstNumber(
        api.pressao_linha?.setpoint,
        api.setpoint_pressao,
        api.pressao_setpoint,
        base.hydraulic?.pressureSetpoint,
        pressureLine,
      ) ?? pressureLine;
    const bypass =
      firstNumber(
        api.bypass?.avg,
        api.bypass_avg,
        api.valvula_bypass_avg,
        base.hydraulic?.bypassValve,
      ) ?? 0;
    const pumpsRaw = asArray(api.bombas || api.pumps || api.items_bombas);
    const pumps = (pumpsRaw.length ? pumpsRaw : [1, 2, 3, 4].map((n) => ({ id: `BAG${n}` }))).map(
      (p: any, idx: number) => {
        const on =
          String(p.status || p.estado || p.comando || "")
            .toLowerCase()
            .includes("lig") ||
          p.operando === true ||
          Number(p.status) === 1;
        return {
          ...(base.pumps?.[idx] || {}),
          id: p.id || p.name || `${base.id}-P0${idx + 1}`,
          name: p.name || p.nome || `Bomba 0${idx + 1}`,
          status: on ? "on" : "off",
          mode: String(p.modo || p.mode || "remote")
            .toLowerCase()
            .includes("local")
            ? "local"
            : "remote",
          pressureLine,
          pressureSetpoint,
          pressureError: Number((pressureLine - pressureSetpoint).toFixed(2)),
          bypassValve: bypass,
          alarm: p.alarme === true || p.alarm === true,
          healthScore: on ? 85 : 75,
          lastEvent:
            p.ultima_ocorrencia ||
            p.lastEvent ||
            (on ? "Operação no período" : "Sem operação no período"),
        };
      },
    );
    return {
      ...base,
      name: api.name || `Bombas ${api.id}`,
      risk: statusTone(api.status) === "ok" ? "ok" : "alert",
      hydraulic: {
        pressureLine,
        pressureSetpoint,
        pressureError: Number((pressureLine - pressureSetpoint).toFixed(2)),
        bypassValve: bypass,
      },
      pumps,
      series: {
        ...base.series,
        bombas: asArray(api.trends?.bombas || api.trends?.operacao),
        pressoes: asArray(api.trends?.pressoes),
        bypass: asArray(api.trends?.bypass),
      },
    };
  });
}

export function normalizeTrendsPayload(payload: any, context: string, group: string) {
  const contexts = payload?.tendencias?.contexts || {};
  const keyMap: any = {
    water: "agua_gelada",
    capacity: "capacidade",
    pressure: "pressoes",
    pumps: "bombas",
  };
  const ctx = contexts[keyMap[context] || context] || {};
  const source = asArray(ctx.series || ctx.data || ctx.rows || ctx.trends);
  const rows = source.map((p: any) => ({
    t: p.x || p.t || p.label || p.data || p.timestamp || "",
    entrada: firstNumber(p.entrada, p.temp_entrada, p.ret),
    saida: firstNumber(p.saida, p.temp_saida, p.feed),
    setpoint: firstNumber(p.setpoint, p.set),
    deltaT: firstNumber(p.delta_t, p.deltaT),
    capacidade: firstNumber(p.capacidade, p.total, p.media),
    capacidadeA: firstNumber(p.circuito_a, p.capacidade_a, p.a),
    capacidadeB: firstNumber(p.circuito_b, p.capacidade_b, p.b),
    succao: firstNumber(p.succao, p.succao_media),
    descarga: firstNumber(p.descarga, p.descarga_media),
    oleo: firstNumber(p.oleo, p.pressao_oleo),
    pressure: firstNumber(p.pressao, p.pressao_linha),
    bypass: firstNumber(p.bypass, p.valvula_bypass),
  }));
  return {
    rows: rows.length ? rows : null,
    insights: asArray(payload?.tendencias?.resumo_automatico_periodo || ctx.insights),
    comparativo: asArray(
      payload?.tendencias?.comparativo_grupos?.[keyMap[context]] ||
        payload?.tendencias?.comparativo_grupos ||
        ctx.comparativo,
    ),
    distribuicao: asArray(ctx.distribuicao || ctx.distribution),
    kpis: ctx.kpis || ctx.resumo || {},
  };
}

export function normalizeAiPayload(payload: any) {
  const ai = payload?.assistente_ia || {};
  const diagnostics = asArray(ai.diagnosticos).map((d: any, index: number) => ({
    id: d.id || `DX-${index + 1}`,
    equipment: d.equipamento || d.equipment || "Equipamento",
    group: niceId(d.equipamento_id || d.group || d.id),
    severity:
      severityTone(d.prioridade) === "crit"
        ? "crit"
        : severityTone(d.prioridade) === "warn"
          ? "warn"
          : "ok",
    symptom: d.sintoma || d.symptom || "Diagnóstico operacional",
    evidence: asArray(d.evidencias || d.evidence),
    possibleCauses: asArray(d.possiveis_causas || d.possibleCauses),
    recommendedActions: asArray(d.acoes_recomendadas || d.recommendedActions),
    metricLabel: d.metricLabel || "Indicador",
    metricValue: d.metricValue || "--",
    spark: d.spark || [1, 2, 1.5, 2.2, 1.8, 2.4, 2.1],
  }));
  return {
    summary: ai.resumo_periodo || {},
    quickQuestions: asArray(ai.perguntas_rapidas),
    diagnostics,
    recommendations: asArray(
      ai.resumo_periodo?.recomendacoes_prioritarias ||
        diagnostics.flatMap((d: any) => d.recommendedActions),
    ).slice(0, 6),
  };
}

export function dashboardTimeline(payload: any) {
  return asArray(payload?.alarmes?.timeline).map((e: any, index: number) => ({
    id: e.id || `AL-${index + 1}`,
    time: e.time || e.hora || "--:--",
    title: e.title || e.titulo || e.evento || "Evento operacional",
    equipment: e.equipment || e.equipamento || e.equipment_name || "CAG",
    severity: e.severity || e.severidade || "info",
    status: e.status || "registrado",
    description: e.description || e.detalhe || e.desc || "Evento detectado no período.",
  }));
}

export function dashboardRecommendations(payload: any) {
  return asArray(
    payload?.alarmes?.recomendacoes_operacionais ||
      payload?.assistente_ia?.resumo_periodo?.recomendacoes_prioritarias,
  );
}

export function dashboardAlarmSummary(payload: any) {
  return payload?.alarmes?.summary || {};
}

export function dashboardAlarmRecurrences(payload: any) {
  return asArray(payload?.alarmes?.recorrentes);
}

export function dashboardAlarmsByEquipment(payload: any) {
  return asArray(payload?.alarmes?.por_equipamento);
}
