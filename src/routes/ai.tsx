import { createFileRoute } from "@tanstack/react-router";
import { Bot, CheckCircle2, MessageSquareText, Send, Sparkles } from "lucide-react";
import { labelForPeriod, useDashboard } from "@/lib/dashboard-api";

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

function AIPage() {
  const { period, payload } = useDashboard();
  const periodInfo = labelForPeriod(payload, period);
  const questions = (payload?.assistente_ia?.perguntas_rapidas?.length ? payload.assistente_ia.perguntas_rapidas : fallbackQuestions).slice(0, 6);

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
            <button key={text} className="flex min-h-[68px] items-center gap-3 rounded-xl border border-status-ai/12 bg-status-ai/8 px-4 text-left text-sm font-medium text-foreground transition hover:border-status-ai/40 hover:bg-status-ai/12">
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-status-ai/15 text-status-ai">
                <MessageSquareText className="h-5 w-5" />
              </span>
              {text}
            </button>
          ))}
        </div>
      </section>

      <section className="flex flex-1 flex-col rounded-2xl border border-status-ai/45 bg-gradient-to-br from-status-ai/10 via-surface-1/70 to-background/40 p-5 shadow-[0_0_36px_rgba(168,85,247,0.12)]">
        <div className="flex flex-1 items-center justify-center py-16 text-center">
          <div className="max-w-xl">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl border border-status-ai/40 bg-status-ai/15 text-status-ai shadow-[0_0_28px_rgba(168,85,247,0.18)]">
              <Bot className="h-8 w-8" />
            </div>
            <h2 className="mt-5 font-display text-2xl font-bold">Como posso ajudar na análise da central?</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Use o chat para investigar alarmes, padrões, comportamento dos equipamentos e possíveis relações entre clima, carga térmica e operação.</p>
          </div>
        </div>

        <div className="rounded-2xl border border-status-ai/45 bg-background/45 p-4 shadow-[0_0_32px_rgba(168,85,247,0.10)]">
          <div className="flex items-center gap-3">
            <input className="h-12 flex-1 rounded-xl border border-status-ai/20 bg-background/45 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-status-ai/60" placeholder="Pergunte sobre o período analisado..." />
            <button className="grid h-12 w-12 place-items-center rounded-xl border border-status-ai/45 bg-status-ai/15 text-status-ai transition hover:bg-status-ai/20">
              <Send className="h-5 w-5" />
            </button>
          </div>
          <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-status-ai" />
            A análise considera somente os dados consolidados do período selecionado.
          </div>
        </div>
      </section>
    </div>
  );
}
