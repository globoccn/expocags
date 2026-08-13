import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  CalendarRange,
  CheckCircle2,
  Download,
  Droplets,
  FileBarChart,
  FileText,
  Loader2,
  RefreshCw,
} from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — CAG Intelligence AI" }] }),
  component: ReportsPage,
});

type WaterReportType = "cliente" | "tecnico";
type CagReportPeriod = "daily" | "weekly" | "monthly";

type WaterMeter = {
  id: string;
  label: string;
  waterType: "Água Potável" | "Água de Reuso";
};

type CagReportMetadata = {
  success: boolean;
  available: boolean;
  type: CagReportPeriod;
  action?: string;
  message?: string;
  report?: {
    period_id?: string;
    period_start?: string;
    period_end?: string;
    generated_at?: string;
    label?: string;
    status?: string;
    coverage_pct?: number | null;
    occurrences_total?: number | null;
    critical_total?: number | null;
    attention_total?: number | null;
    summary?: string | null;
    pdf?: {
      generated?: boolean;
      filename?: string;
      mime_type?: string;
      size_bytes?: number | null;
      base64?: string;
    };
  };
};

const WATER_METERS: WaterMeter[] = [
  { id: "pavilhao_vermelho_a", label: "Pavilhão Vermelho A", waterType: "Água Potável" },
  { id: "pavilhao_verde_a", label: "Pavilhão Verde A", waterType: "Água Potável" },
  { id: "pavilhao_vermelho_a_reuso", label: "Pavilhão Vermelho A — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_verde_a_reuso", label: "Pavilhão Verde A — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_vermelho_b", label: "Pavilhão Vermelho B", waterType: "Água Potável" },
  { id: "pavilhao_verde_b", label: "Pavilhão Verde B", waterType: "Água Potável" },
  { id: "pavilhao_branco_b", label: "Pavilhão Branco B", waterType: "Água Potável" },
  { id: "pavilhao_vermelho_b_reuso", label: "Pavilhão Vermelho B — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_verde_b_reuso", label: "Pavilhão Verde B — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_branco_b_reuso", label: "Pavilhão Branco B — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_amarelo_otto", label: "Pavilhão Amarelo Otto", waterType: "Água Potável" },
  { id: "caminhao_pipa", label: "Caminhão Pipa", waterType: "Água Potável" },
  { id: "pavilhao_azul_reuso", label: "Pavilhão Azul — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_branco_reuso", label: "Pavilhão Branco — Reuso", waterType: "Água de Reuso" },
  { id: "centro_de_convencoes_reuso", label: "Centro de Convenções — Reuso", waterType: "Água de Reuso" },
  { id: "pavilhao_azul", label: "Pavilhão Azul", waterType: "Água Potável" },
  { id: "centro_de_convencoes", label: "Centro de Convenções", waterType: "Água Potável" },
];

const CAG_REPORT_PERIODS: Array<{
  value: CagReportPeriod;
  label: string;
  shortLabel: string;
  description: string;
  icon: typeof CalendarDays;
}> = [
  {
    value: "daily",
    label: "Relatório Diário",
    shortLabel: "Diário",
    description: "Último dia com dados consolidados da CAG.",
    icon: CalendarDays,
  },
  {
    value: "weekly",
    label: "Relatório Semanal",
    shortLabel: "Semanal",
    description: "Semana calendário fechada, com comparativos e recorrências.",
    icon: CalendarRange,
  },
  {
    value: "monthly",
    label: "Relatório Mensal",
    shortLabel: "Mensal",
    description: "Mês calendário fechado, com visão executiva e tendências.",
    icon: FileBarChart,
  },
];

const DEFAULT_N8N_WEBHOOK_BASE_URL = "https://ancar-n8n.gpfgqx.easypanel.host/webhook";

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

const N8N_WEBHOOK_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || DEFAULT_N8N_WEBHOOK_BASE_URL;

const WATER_WEBHOOK_URL =
  import.meta.env.VITE_AGUA_DEMONSTRATIVO_URL ||
  joinUrl(N8N_WEBHOOK_BASE_URL, "agua-ai/demonstrativo");

const CAG_REPORTS_API_URL =
  import.meta.env.VITE_CAG_REPORTS_URL || joinUrl(N8N_WEBHOOK_BASE_URL, "cag/reports");

function moneyInputToNumber(value: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function base64ToBlob(base64: string, mimeType = "application/pdf") {
  const cleanBase64 = base64.includes(",") ? base64.split(",").pop() || "" : base64;
  const byteCharacters = atob(cleanBase64);
  const byteArrays: Uint8Array[] = [];

  for (let offset = 0; offset < byteCharacters.length; offset += 512) {
    const slice = byteCharacters.slice(offset, offset + 512);
    const byteNumbers = Array.from(slice, (char) => char.charCodeAt(0));
    byteArrays.push(new Uint8Array(byteNumbers));
  }

  return new Blob(byteArrays, { type: mimeType });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function formatDate(value?: string) {
  if (!value) return "—";
  const [year, month, day] = value.slice(0, 10).split("-");
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatDateTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function reportPeriodLabel(report?: CagReportMetadata["report"]) {
  if (!report) return "—";
  if (report.period_start && report.period_end && report.period_start !== report.period_end) {
    return `${formatDate(report.period_start)} a ${formatDate(report.period_end)}`;
  }
  return formatDate(report.period_id || report.period_start || report.period_end);
}

function ReportsPage() {
  const [cagPeriod, setCagPeriod] = useState<CagReportPeriod>("daily");
  const [cagMetadata, setCagMetadata] = useState<CagReportMetadata | null>(null);
  const [isLoadingCag, setIsLoadingCag] = useState(false);
  const [isDownloadingCag, setIsDownloadingCag] = useState(false);
  const [cagMessage, setCagMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [localId, setLocalId] = useState("pavilhao_azul");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("00:00");
  const [dataFim, setDataFim] = useState("");
  const [horaFim, setHoraFim] = useState("23:00");
  const [tipoRelatorio, setTipoRelatorio] = useState<WaterReportType>("cliente");
  const [tarifaM3, setTarifaM3] = useState("31,84");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const selectedCagPeriod = useMemo(
    () => CAG_REPORT_PERIODS.find((period) => period.value === cagPeriod) || CAG_REPORT_PERIODS[0],
    [cagPeriod],
  );

  const selectedMeter = useMemo(
    () => WATER_METERS.find((meter) => meter.id === localId) || WATER_METERS[0],
    [localId],
  );

  const payload = useMemo(
    () => ({
      local_id: localId,
      data_inicio: dataInicio,
      hora_inicio: horaInicio,
      data_fim: dataFim,
      hora_fim: horaFim,
      tipo_relatorio: tipoRelatorio,
      tarifa_m3: moneyInputToNumber(tarifaM3),
    }),
    [dataFim, dataInicio, horaFim, horaInicio, localId, tarifaM3, tipoRelatorio],
  );

  const isValid =
    Boolean(localId) &&
    Boolean(dataInicio) &&
    Boolean(horaInicio) &&
    Boolean(dataFim) &&
    Boolean(horaFim) &&
    moneyInputToNumber(tarifaM3) > 0;

  const loadCagMetadata = useCallback(async (period: CagReportPeriod) => {
    setIsLoadingCag(true);
    setCagMessage(null);

    try {
      const url = new URL(CAG_REPORTS_API_URL);
      url.searchParams.set("type", period);
      url.searchParams.set("action", "metadata");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const text = await response.text();
      let data: CagReportMetadata | null = null;

      try {
        data = text ? (JSON.parse(text) as CagReportMetadata) : null;
      } catch {
        throw new Error(`A API de relatórios não retornou JSON válido. Resposta: ${text.slice(0, 140)}`);
      }

      if (!response.ok || !data || data.success === false) {
        throw new Error(data?.message || "Não foi possível consultar os relatórios da CAG.");
      }

      setCagMetadata(data);
    } catch (error) {
      setCagMetadata(null);
      setCagMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro inesperado ao consultar relatório CAG.",
      });
    } finally {
      setIsLoadingCag(false);
    }
  }, []);

  useEffect(() => {
    void loadCagMetadata(cagPeriod);
  }, [cagPeriod, loadCagMetadata]);

  async function handleDownloadCag() {
    setCagMessage(null);
    setIsDownloadingCag(true);

    try {
      const url = new URL(CAG_REPORTS_API_URL);
      url.searchParams.set("type", cagPeriod);
      url.searchParams.set("action", "download");

      const response = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        cache: "no-store",
      });
      const text = await response.text();
      let data: CagReportMetadata | null = null;

      try {
        data = text ? (JSON.parse(text) as CagReportMetadata) : null;
      } catch {
        throw new Error(`A API de relatórios não retornou JSON válido. Resposta: ${text.slice(0, 140)}`);
      }

      if (!response.ok || !data || data.success === false || data.available === false) {
        throw new Error(data?.message || "O relatório selecionado ainda não está disponível.");
      }

      const base64 = data.report?.pdf?.base64;
      if (!base64) {
        throw new Error("A API respondeu sem o conteúdo do PDF.");
      }

      const filename = data.report?.pdf?.filename || `relatorio-cag-${cagPeriod}.pdf`;
      const blob = base64ToBlob(base64, data.report?.pdf?.mime_type || "application/pdf");
      downloadBlob(blob, filename);
      setCagMetadata(data);
      setCagMessage({ type: "success", text: "Relatório CAG baixado com sucesso." });
    } catch (error) {
      setCagMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro inesperado ao baixar relatório CAG.",
      });
    } finally {
      setIsDownloadingCag(false);
    }
  }

  async function handleGenerateWater() {
    setMessage(null);

    if (!isValid) {
      setMessage({ type: "error", text: "Preencha local, período e tarifa antes de gerar o demonstrativo." });
      return;
    }

    if (`${dataFim}T${horaFim}` < `${dataInicio}T${horaInicio}`) {
      setMessage({ type: "error", text: "A data/hora final deve ser maior que a inicial." });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(WATER_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json, application/pdf",
        },
        body: JSON.stringify(payload),
      });

      const contentType = response.headers.get("content-type") || "";

      if (contentType.includes("application/pdf")) {
        const blob = await response.blob();
        const filename = response.headers
          .get("content-disposition")
          ?.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
          ?.slice(1)
          .find(Boolean);
        downloadBlob(blob, filename ? decodeURIComponent(filename) : "demonstrativo-agua.pdf");
        setMessage({ type: "success", text: "Demonstrativo gerado e download iniciado." });
        return;
      }

      const responseText = await response.text();
      let data: any = null;

      try {
        data = responseText ? JSON.parse(responseText) : null;
      } catch {
        const preview = responseText.trim().slice(0, 160);
        throw new Error(
          `O endpoint não retornou JSON/PDF. Verifique a URL configurada: ${WATER_WEBHOOK_URL}. Resposta: ${preview}`,
        );
      }

      if (!response.ok || data?.success === false) {
        throw new Error(data?.resposta || data?.error || "Não foi possível gerar o demonstrativo.");
      }

      const base64 = data?.pdf?.base64;
      if (!base64) {
        throw new Error("O workflow respondeu sem o PDF em base64.");
      }

      const filename = data?.pdf?.filename || "demonstrativo-agua.pdf";
      const blob = base64ToBlob(base64, data?.pdf?.mime_type || "application/pdf");
      downloadBlob(blob, filename);

      setMessage({ type: "success", text: "Demonstrativo gerado e download iniciado." });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Erro inesperado ao gerar demonstrativo.",
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const reportAvailable = Boolean(cagMetadata?.available && cagMetadata.report?.pdf?.generated !== false);

  return (
    <div className="space-y-7">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Documentação</div>
        <h1 className="font-display text-3xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Consulte os relatórios operacionais da CAG e gere demonstrativos de consumo de água.
        </p>
      </div>

      <section className="glass-card overflow-hidden">
        <div className="border-b border-border/60 bg-gradient-to-r from-primary/10 via-transparent to-transparent p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <FileBarChart className="h-5 w-5" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Relatório CAG</span>
              </div>
              <h2 className="mt-2 font-display text-2xl font-semibold">Inteligência Operacional da Central</h2>
              <p className="mt-1 max-w-3xl text-sm text-muted-foreground">
                Relatórios consolidados com indicadores, tendências, desempenho dos equipamentos, ocorrências e análise redigida por Gemini.
              </p>
            </div>
            <button
              type="button"
              onClick={() => void loadCagMetadata(cagPeriod)}
              disabled={isLoadingCag}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-border bg-background/60 px-3 py-2 text-xs font-semibold text-muted-foreground transition hover:border-primary/50 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingCag ? "animate-spin" : ""}`} />
              Atualizar
            </button>
          </div>
        </div>

        <div className="grid gap-5 p-5 md:p-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,0.65fr)]">
          <div>
            <div className="grid gap-3 md:grid-cols-3">
              {CAG_REPORT_PERIODS.map((period) => {
                const Icon = period.icon;
                const active = period.value === cagPeriod;
                return (
                  <button
                    key={period.value}
                    type="button"
                    onClick={() => setCagPeriod(period.value)}
                    className={`rounded-xl border p-4 text-left transition ${
                      active
                        ? "border-primary/55 bg-primary/10 shadow-[inset_0_0_24px_rgba(0,180,255,0.08)]"
                        : "border-border/70 bg-muted/10 hover:border-primary/30 hover:bg-muted/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className={`grid h-9 w-9 place-items-center rounded-lg ${active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      {active && <span className="h-2 w-2 rounded-full bg-primary shadow-[0_0_12px_rgba(0,180,255,.75)]" />}
                    </div>
                    <div className="mt-3 font-display text-base font-semibold">{period.shortLabel}</div>
                    <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">{period.description}</div>
                  </button>
                );
              })}
            </div>

            <div className="mt-5 rounded-xl border border-border/70 bg-muted/10 p-5">
              {isLoadingCag ? (
                <div className="flex min-h-44 items-center justify-center gap-3 text-sm text-muted-foreground">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  Consultando último relatório {selectedCagPeriod.shortLabel.toLowerCase()}...
                </div>
              ) : reportAvailable ? (
                <div className="space-y-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-emerald-300">
                        <CheckCircle2 className="h-3 w-3" /> Disponível
                      </div>
                      <h3 className="mt-3 font-display text-xl font-semibold">{selectedCagPeriod.label}</h3>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Período: <span className="font-semibold text-foreground">{reportPeriodLabel(cagMetadata?.report)}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleDownloadCag}
                      disabled={isDownloadingCag}
                      className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {isDownloadingCag ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      {isDownloadingCag ? "Baixando..." : "Baixar PDF"}
                    </button>
                  </div>

                  {cagMetadata?.report?.summary && (
                    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs leading-relaxed text-foreground/85">
                      {cagMetadata.report.summary}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex min-h-44 flex-col items-center justify-center text-center">
                  <div className="grid h-11 w-11 place-items-center rounded-full border border-border bg-muted/30 text-muted-foreground">
                    <FileText className="h-5 w-5" />
                  </div>
                  <h3 className="mt-3 font-display text-lg font-semibold">Ainda não publicado</h3>
                  <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground">
                    {cagMetadata?.message || `O relatório ${selectedCagPeriod.shortLabel.toLowerCase()} ainda não foi gerado. A interface já está preparada para recebê-lo quando o workflow for ativado.`}
                  </p>
                </div>
              )}
            </div>

            {cagMessage && (
              <div
                className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                  cagMessage.type === "success"
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                    : "border-destructive/30 bg-destructive/10 text-destructive"
                }`}
              >
                {cagMessage.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                <span>{cagMessage.text}</span>
              </div>
            )}
          </div>

          <aside className="rounded-xl border border-border/70 bg-black/10 p-5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Último relatório</div>
            <div className="mt-3 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Tipo</div>
                <div className="mt-1 font-display text-lg font-semibold">{selectedCagPeriod.shortLabel}</div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Período</div>
                  <div className="mt-1 text-xs font-semibold">{reportAvailable ? reportPeriodLabel(cagMetadata?.report) : "—"}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Cobertura</div>
                  <div className="mt-1 text-xs font-semibold">
                    {typeof cagMetadata?.report?.coverage_pct === "number" ? `${cagMetadata.report.coverage_pct.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "—"}
                  </div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Ocorrências</div>
                  <div className="mt-1 text-xs font-semibold">{cagMetadata?.report?.occurrences_total ?? "—"}</div>
                </div>
                <div className="rounded-lg border border-border/60 bg-background/30 p-3">
                  <div className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Críticas</div>
                  <div className="mt-1 text-xs font-semibold text-status-crit">{cagMetadata?.report?.critical_total ?? "—"}</div>
                </div>
              </div>
              <div className="border-t border-border/50 pt-3">
                <div className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">Gerado em</div>
                <div className="mt-1 font-mono text-[11px] text-foreground/80">
                  {reportAvailable ? formatDateTime(cagMetadata?.report?.generated_at) : "—"}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </section>

      <div className="border-t border-border/50 pt-7">
        <div className="mb-4">
          <div className="flex items-center gap-2 text-primary">
            <Droplets className="h-5 w-5" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Água</span>
          </div>
          <h2 className="mt-2 font-display text-2xl font-semibold">Demonstrativo de Consumo</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Gere demonstrativos sob demanda a partir dos dados dos hidrômetros.
          </p>
        </div>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]">
          <section className="glass-card p-5">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h3 className="font-display text-xl font-semibold">Parâmetros do demonstrativo</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Selecione o hidrômetro, o período de medição e a tarifa para gerar o PDF.
                </p>
              </div>
              <FileText className="h-5 w-5 text-muted-foreground" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1.5 md:col-span-2">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hidrômetro</span>
                <select
                  value={localId}
                  onChange={(event) => setLocalId(event.target.value)}
                  className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                >
                  {WATER_METERS.map((meter) => (
                    <option key={meter.id} value={meter.id}>
                      {meter.label}
                    </option>
                  ))}
                </select>
              </label>

              <div className="rounded-lg border border-border/70 bg-muted/20 p-3 md:col-span-2">
                <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tipo da água</div>
                <div className="mt-1 text-sm font-semibold text-foreground">{selectedMeter.waterType}</div>
              </div>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Data inicial</span>
                <input type="date" value={dataInicio} onChange={(event) => setDataInicio(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary" />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hora inicial</span>
                <input type="time" value={horaInicio} onChange={(event) => setHoraInicio(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary" />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Data final</span>
                <input type="date" value={dataFim} onChange={(event) => setDataFim(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary" />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hora final</span>
                <input type="time" value={horaFim} onChange={(event) => setHoraFim(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary" />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tarifa R$/m³</span>
                <input inputMode="decimal" value={tarifaM3} onChange={(event) => setTarifaM3(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary" placeholder="31,84" />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tipo do relatório</span>
                <select value={tipoRelatorio} onChange={(event) => setTipoRelatorio(event.target.value as WaterReportType)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary">
                  <option value="cliente">Cliente</option>
                  <option value="tecnico">Técnico</option>
                </select>
              </label>
            </div>

            {message && (
              <div className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${message.type === "success" ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300" : "border-destructive/30 bg-destructive/10 text-destructive"}`}>
                {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
                <span>{message.text}</span>
              </div>
            )}

            <div className="mt-5 flex flex-wrap gap-3">
              <button type="button" onClick={handleGenerateWater} disabled={!isValid || isSubmitting} className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                {isSubmitting ? "Gerando..." : "Gerar demonstrativo"}
              </button>
            </div>
          </section>

          <aside className="glass-card p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Prévia do envio</div>
            <h3 className="mt-2 font-display text-lg font-semibold">Contrato com o n8n</h3>
            <p className="mt-1 text-xs text-muted-foreground">Payload enviado ao workflow do demonstrativo de água.</p>
            <div className="mt-4 rounded-lg border border-border/70 bg-black/20 p-3 font-mono text-[11px] leading-relaxed text-muted-foreground">
              <pre className="overflow-auto whitespace-pre-wrap">{JSON.stringify(payload, null, 2)}</pre>
            </div>
            <div className="mt-4 rounded-lg border border-border/70 bg-muted/20 p-3 text-xs text-muted-foreground">
              <div className="font-semibold text-foreground">Endpoint configurado</div>
              <div className="mt-1 break-all font-mono">{WATER_WEBHOOK_URL}</div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
