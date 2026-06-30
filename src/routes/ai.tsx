import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Bot, CheckCircle2, Loader2, MessageSquareText, Send, Sparkles, UserRound } from "lucide-react";
import { apiBase, labelForPeriod, useDashboard, type UiPeriod } from "@/lib/dashboard-api";

export const Route = createFileRoute("/ai")({
  head: () => ({ meta: [{ title: "Assistente IA — CAG Expo Center Norte" }] }),
  component: AIPage,
});

const fallbackQuestions = [
  "O que aconteceu no período analisado?",
  "Compare os chillers entre si.",
  "Quais ocorrências se repetiram na semana?",
  "A temperatura externa influenciou a capacidade utilizada?",
  "Existe relação entre bombas, Delta T e setpoint?",
  "Quais alarmes ocorreram no Chiller Azul?",
];

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  content: string;
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

function extractAnswer(json: any): string {
  const candidates = [
    json?.answer,
    json?.resposta,
    json?.message,
    json?.text,
    json?.output,
    json?.data?.answer,
    json?.data?.resposta,
    json?.data?.message,
    json?.data?.text,
  ];
  const found = candidates.find((value) => typeof value === "string" && value.trim());
  if (found) return found.trim();
  return "Não consegui interpretar a resposta do assistente. Verifique o retorno do workflow n8n.";
}

async function askAssistant(question: string, period: UiPeriod) {
  const res = await fetch(`${apiBase()}/expo-cag-ai-assistant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      question,
      period: periodToApi[period],
      session_id: getSessionId(),
      source: "frontend-ai",
    }),
  });

  const raw = await res.text();
  let json: any = null;
  try {
    json = raw ? JSON.parse(raw) : null;
  } catch {
    json = { answer: raw };
  }

  if (!res.ok) {
    const detail = extractAnswer(json) || raw || `HTTP ${res.status}`;
    throw new Error(detail);
  }

  return extractAnswer(json);
}

function AIPage() {
  const { period, payload } = useDashboard();
  const periodInfo = labelForPeriod(payload, period);
  const questions = (payload?.assistente_ia?.perguntas_rapidas?.length ? payload.assistente_ia.perguntas_rapidas : fallbackQuestions).slice(0, 6);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  const introText = useMemo(() => {
    if (!messages.length) return "Use o chat para investigar alarmes, padrões, comportamento dos equipamentos e possíveis relações entre clima, carga térmica e operação.";
    return "A resposta abaixo considera somente o contexto operacional consolidado pelo workflow.";
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
      const answer = await askAssistant(question, period);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: answer,
        },
      ]);
    } catch (err: any) {
      const message = err?.message || "Falha ao consultar o assistente IA.";
      setError(message);
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-error-${Date.now()}`,
          role: "assistant",
          content: `Não consegui consultar o assistente agora. Detalhe: ${message}`,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-7rem)] flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-status-ai">
            <Sparkles className="h-3.5 w-3.5" /> Assistente operacional
          </div>
          <h1 className="font-display text-3xl font-bold">Assistente IA</h1>
          <p className="text-sm text-muted-foreground">Pergunte sobre comportamento, ocorrências e tendências do período analisado.</p>
        </div>
        <div className="rounded-xl border border-status-ai/35 bg-status-ai/8 px-4 py-3 text-sm text-muted-foreground">
          <span className="text-[10px] uppercase tracking-[0.18em] text-status-ai">Período analisado</span>
          <div className="mt-1 font-display font-bold text-foreground">{periodInfo.label} ({periodInfo.date})</div>
        </div>
      </div>

      <section className="rounded-2xl border border-border/60 bg-surface-1/70 p-4">
        <div className="mb-3 font-display text-xs font-bold uppercase tracking-wider text-muted-foreground">Perguntas sugeridas</div>
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
          {!messages.length ? (
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
                    className={`max-w-[min(860px,85%)] whitespace-pre-wrap rounded-2xl border px-4 py-3 text-sm leading-6 ${
                      message.role === "user"
                        ? "border-status-ai/35 bg-status-ai/15 text-foreground"
                        : "border-border/60 bg-background/55 text-foreground"
                    }`}
                  >
                    {message.content}
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
                  Consultando contexto governado no n8n...
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
              placeholder="Pergunte sobre o período analisado..."
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
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-status-ai" />
            A análise considera somente os dados consolidados do período selecionado.
          </div>
          {error && <div className="mt-2 text-xs text-status-crit">{error}</div>}
        </div>
      </section>
    </div>
  );
}
