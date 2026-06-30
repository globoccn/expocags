import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  Bot,
  CheckCircle2,
  Clipboard,
  Gauge,
  Info,
  Loader2,
  MessageSquareText,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Wrench,
} from "lucide-react";
import { apiBase, labelForPeriod, useDashboard, type UiPeriod } from "@/lib/dashboard-api";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Copilot de Manutenção — CAG Expo Center Norte" }] }),
  component: AIPage,
});

const fallbackQuestions = [
  "O que aconteceu no período analisado?",
  "Qual chiller merece inspeção primeiro?",
  "Quais alarmes foram registrados?",
  "Compare os três chillers.",
  "O que devo verificar hoje?",
  "Explique o Delta T baixo da central.",
];

const loadingSteps = [
  "Analisando leituras operacionais...",
  "Interpretando alarmes registrados...",
  "Correlacionando chillers e bombas...",
  "Consultando base técnica Carrier 30HX...",
  "Gerando diagnóstico assistido...",
];

type StructuredAnswer = {
  titulo?: string;
  resumo?: string;
  evidencias?: Array<string | Record<string, any>>;
  alarmes?: Array<string | Record<string, any>>;
  hipoteses?: Array<string | Record<string, any>>;
  acoes?: Array<string | Record<string, any>>;
  limitacoes?: Array<string | Record<string, any>>;
  nivel_confianca?: "baixa" | "media" | "alta" | string;
  resposta_curta?: string;
  [key: string]: any;
};

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
  structured?: StructuredAnswer | null;
  ts?: string;
};

type AssistantResponse = {
  answer: string;
  structured?: StructuredAnswer | null;
  history?: ChatMessage[];
};

const periodToApi: Record<UiPeriod, "d_1" | "week" | "month"> = {
  d1: "d_1",
  week: "week",
  month: "month",
};

function getSessionId() {
  if (typeof window === "undefined") return "server-session";
  const key = "cag-ai-session-id";
  const current = window.localStorage.getItem(key);
  if (current) return current;
  const next = `cag-ai-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  window.localStorage.setItem(key, next);
  return next;
}

function cleanText(value: unknown): string {
  return String(value ?? "")
    .replace(/^```json\s*/i, "")
    .replace(/^```\s*/i, "")
    .replace(/```$/g, "")
    .replace(/#{1,6}\s*/g, "")
    .replace(/\*\*/g, "")
    .replace(/^\s*[-*]\s+/gm, "• ")
    .trim();
}

function stringifyItem(item: string | Record<string, any>): string {
  if (typeof item === "string") return cleanText(item);
  const parts = [item.codigo ? `Código ${item.codigo}` : null, item.titulo || item.nome || item.descricao || item.significado]
    .filter(Boolean)
    .join(" — ");
  if (parts) return cleanText(parts);
  return cleanText(JSON.stringify(item));
}

function normalizeList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(stringifyItem).filter(Boolean);
}

function tryParseStructured(value: unknown): StructuredAnswer | null {
  if (!value) return null;
  if (typeof value === "object") return value as StructuredAnswer;
  if (typeof value !== "string") return null;
  const cleaned = cleanText(value);
  try {
    const parsed = JSON.parse(cleaned);
    return parsed && typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

function extractAnswer(json: any): string {
  const candidates = [
    json?.answer,
    json?.resposta,
    json?.message,
    json?.text,
    json?.output,
    json?.structured?.resposta_curta,
    json?.structured?.resumo,
    json?.data?.answer,
    json?.data?.resposta,
    json?.data?.message,
    json?.data?.text,
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim());
  if (found) return cleanText(found);
  return "Não consegui interpretar a resposta do Copilot. Verifique o retorno do workflow n8n.";
}

function normalizeHistory(history: any[]): ChatMessage[] {
  if (!Array.isArray(history)) return [];
  return history
    .map((item, index) => ({
      id: `${item?.role || "msg"}-${item?.ts || index}-${index}`,
      role: item?.role === "user" ? "user" : "assistant",
      content: cleanText(item?.text || item?.content || item?.answer || ""),
      structured: tryParseStructured(item?.structured),
      ts: item?.ts,
    }))
    .filter((item) => item.content);
}

async function callAssistant(body: Record<string, any>) {
  const res = await fetch(`${apiBase()}/expo-cag-ai-assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { answer: raw };
  }

  if (!res.ok || json?.ok === false) {
    const detail = json?.error || extractAnswer(json) || raw || `HTTP ${res.status}`;
    throw new Error(detail);
  }

  return json;
}

async function askAssistant(question: string, period: UiPeriod, sessionId: string): Promise<AssistantResponse> {
  const json = await callAssistant({
    action: "chat",
    question,
    period: periodToApi[period],
    session_id: sessionId,
    source: "frontend-ai",
  });

  return {
    answer: extractAnswer(json),
    structured: tryParseStructured(json?.structured),
    history: normalizeHistory(json?.history || []),
  };
}

async function loadVisualHistory(sessionId: string): Promise<ChatMessage[]> {
  try {
    const json = await callAssistant({ action: "history", session_id: sessionId, source: "frontend-ai" });
    return normalizeHistory(json?.history || []);
  } catch {
    return [];
  }
}

async function clearVisualHistory(sessionId: string) {
  await callAssistant({ action: "clear", session_id: sessionId, source: "frontend-ai" });
}

function ConfidenceBadge({ level }: { level?: string }) {
  const normalized = String(level || "baixa").toLowerCase();
  const label = normalized === "alta" ? "Alta" : normalized === "media" || normalized === "média" ? "Média" : "Baixa";
  const tone = normalized === "alta" ? "text-status-ok border-status-ok/30 bg-status-ok/10" : normalized === "media" || normalized === "média" ? "text-status-warn border-status-warn/30 bg-status-warn/10" : "text-muted-foreground border-border/60 bg-background/45";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider ${tone}`}>
      <ShieldCheck className="h-3.5 w-3.5" /> Confiança {label}
    </span>
  );
}

function Section({ icon, title, items }: { icon: ReactNode; title: string; items: string[] }) {
  if (!items.length) return null;
  return (
    <div className="rounded-xl border border-border/60 bg-background/35 p-3">
      <div className="mb-2 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
        {icon} {title}
      </div>
      <ul className="space-y-1.5 text-sm leading-6 text-foreground">
        {items.map((item, index) => (
          <li key={`${title}-${index}`} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-status-ai/70" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function AssistantCard({ message }: { message: ChatMessage }) {
  const structured = message.structured;
  const evidencias = normalizeList(structured?.evidencias);
  const alarmes = normalizeList(structured?.alarmes);
  const hipoteses = normalizeList(structured?.hipoteses);
  const acoes = normalizeList(structured?.acoes);
  const limitacoes = normalizeList(structured?.limitacoes);
  const hasStructured = Boolean(structured && (structured.resumo || evidencias.length || alarmes.length || hipoteses.length || acoes.length || limitacoes.length));

  if (!hasStructured) {
    return <div className="whitespace-pre-wrap text-sm leading-6 text-foreground">{message.content}</div>;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <div className="font-display text-base font-bold text-foreground">{cleanText(structured?.titulo || "Diagnóstico operacional")}</div>
          {(structured?.resumo || message.content) && <p className="mt-1 text-sm leading-6 text-foreground">{cleanText(structured?.resumo || message.content)}</p>}
        </div>
        <ConfidenceBadge level={structured?.nivel_confianca} />
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        <Section icon={<Gauge className="h-4 w-4 text-status-ai" />} title="Evidências" items={evidencias} />
        <Section icon={<AlertTriangle className="h-4 w-4 text-status-crit" />} title="Alarmes" items={alarmes} />
        <Section icon={<Info className="h-4 w-4 text-status-warn" />} title="Hipóteses permitidas" items={hipoteses} />
        <Section icon={<Wrench className="h-4 w-4 text-status-ok" />} title="Próximas verificações" items={acoes} />
      </div>
      <Section icon={<Info className="h-4 w-4 text-muted-foreground" />} title="Limitações" items={limitacoes} />
      <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-muted-foreground">
        <span className="rounded-full border border-border/60 bg-background/35 px-2.5 py-1">Fonte: dashboard operacional</span>
        <span className="rounded-full border border-border/60 bg-background/35 px-2.5 py-1">Base: Carrier 30HX / PRO-DIALOG</span>
        <span className="rounded-full border border-border/60 bg-background/35 px-2.5 py-1">Sem memória conversacional na IA</span>
      </div>
    </div>
  );
}

function AIPage() {
  const { period, payload } = useDashboard();
  const periodInfo = labelForPeriod(payload, period);
  const questions = fallbackQuestions;
  const sessionId = useMemo(() => getSessionId(), []);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [loadingStep, setLoadingStep] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setHistoryLoading(true);
    loadVisualHistory(sessionId)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .finally(() => {
        if (!cancelled) setHistoryLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!loading) {
      setLoadingStep(0);
      return;
    }
    const timer = window.setInterval(() => {
      setLoadingStep((prev) => (prev + 1) % loadingSteps.length);
    }, 1100);
    return () => window.clearInterval(timer);
  }, [loading]);

  const introText = useMemo(() => {
    if (!messages.length) return "Faça uma pergunta para gerar uma análise independente baseada no período selecionado. O histórico abaixo é apenas visual e não contamina a IA.";
    return "Cada nova pergunta é analisada de forma independente com base no dashboard atual e na base técnica Carrier.";
  }, [messages.length]);

  const sendQuestion = async (text: string) => {
    const question = text.trim();
    if (!question || loading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: question,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setError(null);
    setLoading(true);

    try {
      const response = await askAssistant(question, period, sessionId);
      if (response.history?.length) {
        setMessages(response.history);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: response.answer,
            structured: response.structured,
          },
        ]);
      }
    } catch (err: any) {
      const message = err?.message || "Falha ao consultar o Copilot de Manutenção.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: `Não consegui consultar o Copilot agora. Detalhe: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = async () => {
    if (loading) return;
    setError(null);
    setMessages([]);
    try {
      await clearVisualHistory(sessionId);
    } catch (err: any) {
      setError(err?.message || "Não foi possível limpar o histórico visual.");
    }
  };

  const copyLastAnswer = async () => {
    const last = [...messages].reverse().find((message) => message.role === "assistant");
    if (!last || typeof navigator === "undefined") return;
    await navigator.clipboard?.writeText(last.content);
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-status-ai">
            <Sparkles className="h-3.5 w-3.5" /> Copiloto técnico
          </div>
          <h1 className="font-display text-3xl font-bold">Copilot de Manutenção</h1>
          <p className="text-sm text-muted-foreground">Diagnóstico assistido baseado em leituras operacionais, alarmes e documentação Carrier 30HX.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={copyLastAnswer}
            disabled={!messages.some((message) => message.role === "assistant")}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/35 px-3 text-xs font-semibold text-muted-foreground transition hover:border-status-ai/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Clipboard className="h-4 w-4" /> Copiar diagnóstico
          </button>
          <button
            type="button"
            onClick={clearChat}
            disabled={loading || historyLoading || !messages.length}
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border/70 bg-background/35 px-3 text-xs font-semibold text-muted-foreground transition hover:border-status-ai/40 hover:text-foreground disabled:cursor-not-allowed disabled:opacity-45"
          >
            <RotateCcw className="h-4 w-4" /> Nova análise
          </button>
          <div className="rounded-xl border border-status-ai/35 bg-status-ai/8 px-4 py-3 text-sm text-muted-foreground">
            <span className="text-[10px] uppercase tracking-[0.18em] text-status-ai">Período analisado</span>
            <div className="mt-1 font-display font-bold text-foreground">{periodInfo.label} ({periodInfo.date})</div>
          </div>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-4">
        <div className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Perguntas para iniciar validação</div>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {questions.map((text: string) => (
            <button
              key={text}
              type="button"
              disabled={loading}
              onClick={() => sendQuestion(text)}
              className="flex min-h-[68px] items-center gap-3 rounded-xl border border-status-ai/12 bg-status-ai/8 px-4 text-left text-sm font-medium text-foreground transition hover:border-status-ai/40 hover:bg-status-ai/12 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
                <MessageSquareText className="h-5 w-5" />
              </span>
              {text}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-2xl border border-status-ai/45 bg-gradient-to-br from-status-ai/10 via-surface-1/70 to-background/40 p-5 shadow-[0_0_36px_rgba(168,85,247,0.12)]">
        <div className="flex flex-1 flex-col justify-center gap-4 py-6">
          {historyLoading ? (
            <div className="mx-auto flex items-center gap-3 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-status-ai" /> Carregando histórico visual...
            </div>
          ) : !messages.length ? (
            <div className="mx-auto max-w-xl text-center">
              <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-status-ai/40 bg-status-ai/15 text-status-ai shadow-[0_0_28px_rgba(168,85,247,0.18)]">
                <Bot className="h-8 w-8" />
              </div>
              <h2 className="mt-5 font-display text-2xl font-bold">Como posso ajudar na análise da central?</h2>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{introText}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                  {message.role === "assistant" && (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
                      <Bot className="h-5 w-5" />
                    </span>
                  )}
                  <div
                    className={`max-w-[min(980px,88%)] rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "border-status-ai/35 bg-status-ai/15 text-foreground"
                        : "border-border/60 bg-background/55 text-foreground"
                    }`}
                  >
                    {message.role === "assistant" ? <AssistantCard message={message} /> : <div className="whitespace-pre-wrap">{message.content}</div>}
                  </div>
                  {message.role === "user" && (
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-background/55 text-muted-foreground">
                      <UserRound className="h-5 w-5" />
                    </span>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
                    <Loader2 className="h-5 w-5 animate-spin" />
                  </span>
                  {loadingSteps[loadingStep]}
                </div>
              )}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-status-ai/45 bg-background/45 p-4 shadow-[0_0_32px_rgba(168,85,247,0.10)]">
          <form
            className="flex items-center gap-3"
            onSubmit={(event) => {
              event.preventDefault();
              sendQuestion(input);
            }}
          >
            <input
              value={input}
              onChange={(event) => setInput(event.target.value)}
              disabled={loading}
              className="h-12 flex-1 rounded-xl border border-status-ai/20 bg-background/45 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-status-ai/60 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder="Ex.: Qual chiller merece inspeção hoje?"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="grid h-12 w-12 place-items-center rounded-xl border border-status-ai/45 bg-status-ai/15 text-status-ai transition hover:bg-status-ai/20 disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Enviar pergunta"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
            </button>
          </form>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-status-ai" />
            A IA não recebe histórico do chat. Cada pergunta usa somente o período selecionado, a base Carrier e os dados consolidados.
          </div>
          {error && <div className="mt-2 text-xs text-status-crit">{error}</div>}
        </div>
      </section>
    </div>
  );
}
