import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  Droplets,
  FileText,
  Loader2,
} from "lucide-react";

export const Route = createFileRoute("/reports")({
  head: () => ({ meta: [{ title: "Relatórios — CAG Intelligence AI" }] }),
  component: ReportsPage,
});

type ReportType = "cliente" | "tecnico";

type WaterMeter = {
  id: string;
  label: string;
  waterType: "Água Potável" | "Água de Reuso";
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

const DEFAULT_N8N_WEBHOOK_BASE_URL = "https://ancar-n8n.gpfgqx.easypanel.host/webhook";

function joinUrl(base: string, path: string) {
  return `${base.replace(/\/+$/, "")}/${path.replace(/^\/+/, "")}`;
}

const N8N_WEBHOOK_BASE_URL =
  import.meta.env.VITE_N8N_WEBHOOK_BASE_URL || DEFAULT_N8N_WEBHOOK_BASE_URL;

const WEBHOOK_URL =
  import.meta.env.VITE_AGUA_DEMONSTRATIVO_URL ||
  joinUrl(N8N_WEBHOOK_BASE_URL, "agua-ai/demonstrativo");

function moneyInputToNumber(value: string) {
  const normalized = String(value || "")
    .trim()
    .replace(/\./g, "")
    .replace(",", ".");
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function base64ToBlob(base64: string, mimeType = "application/pdf") {
  const byteCharacters = atob(base64);
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

function ReportsPage() {
  const [localId, setLocalId] = useState("pavilhao_azul");
  const [dataInicio, setDataInicio] = useState("");
  const [horaInicio, setHoraInicio] = useState("00:00");
  const [dataFim, setDataFim] = useState("");
  const [horaFim, setHoraFim] = useState("23:00");
  const [tipoRelatorio, setTipoRelatorio] = useState<ReportType>("cliente");
  const [tarifaM3, setTarifaM3] = useState("31,84");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

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

  async function handleGenerate() {
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
      const response = await fetch(WEBHOOK_URL, {
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
        const filename =
          response.headers
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
          `O endpoint não retornou JSON/PDF. Verifique a URL configurada: ${WEBHOOK_URL}. Resposta: ${preview}`,
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

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Documentação</div>
        <h1 className="font-display text-3xl font-bold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Gere demonstrativos operacionais a partir dos dados dos hidrômetros.
        </p>
      </div>

      <div>
        <section className="glass-card p-6 xl:p-7">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-primary">
                <Droplets className="h-5 w-5" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.22em]">Água</span>
              </div>
              <h2 className="mt-2 font-display text-xl font-semibold">Demonstrativo de Consumo</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Selecione o hidrômetro, o período de medição e a tarifa para gerar o PDF.
              </p>
            </div>
            <FileText className="h-5 w-5 text-muted-foreground" />
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <label className="space-y-1.5 md:col-span-2 xl:col-span-2">
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

            <div className="rounded-lg border border-border/70 bg-muted/20 p-3 md:col-span-2 xl:col-span-2">
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">Tipo da água</div>
              <div className="mt-1 font-semibold">{selectedMeter.waterType}</div>
            </div>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Data inicial</span>
              <input
                type="date"
                value={dataInicio}
                onChange={(event) => setDataInicio(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hora inicial</span>
              <input
                type="time"
                value={horaInicio}
                onChange={(event) => setHoraInicio(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Data final</span>
              <input
                type="date"
                value={dataFim}
                onChange={(event) => setDataFim(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Hora final</span>
              <input
                type="time"
                value={horaFim}
                onChange={(event) => setHoraFim(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tarifa R$/m³</span>
              <input
                inputMode="decimal"
                value={tarifaM3}
                onChange={(event) => setTarifaM3(event.target.value)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
                placeholder="31,84"
              />
            </label>

            <label className="space-y-1.5">
              <span className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tipo do relatório</span>
              <select
                value={tipoRelatorio}
                onChange={(event) => setTipoRelatorio(event.target.value as ReportType)}
                className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm outline-none transition focus:border-primary"
              >
                <option value="cliente">Cliente</option>
                <option value="tecnico">Técnico</option>
              </select>
            </label>
          </div>

          {message && (
            <div
              className={`mt-4 flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${
                message.type === "success"
                  ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-300"
                  : "border-destructive/30 bg-destructive/10 text-destructive"
              }`}
            >
              {message.type === "success" ? <CheckCircle2 className="mt-0.5 h-4 w-4" /> : <AlertCircle className="mt-0.5 h-4 w-4" />}
              <span>{message.text}</span>
            </div>
          )}

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleGenerate}
              disabled={!isValid || isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
              {isSubmitting ? "Gerando..." : "Gerar demonstrativo"}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
