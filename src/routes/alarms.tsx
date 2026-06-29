import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  Bell,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Download,
  Info,
  Snowflake,
  Waves,
  Wrench,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useDashboard } from "@/lib/dashboard-api";

export const Route = createFileRoute("/alarms")({
  head: () => ({ meta: [{ title: "Alarmes — CAG Expo Center Norte" }] }),
  component: AlarmsPage,
});

type Severity = "all" | "critico" | "atencao" | "info";
type Origin = "all" | "chillers" | "bombas";
type AlarmStatus = "registrado" | "resolvido";

const severityOptions: Array<{ key: Severity; label: string }> = [
  { key: "all", label: "Todos" },
  { key: "critico", label: "Críticos" },
  { key: "atencao", label: "Atenção" },
  { key: "info", label: "Informregistrados" },
];

const originOptions: Array<{ key: Origin; label: string; icon: typeof Snowflake }> = [
  { key: "all", label: "Todos", icon: Wrench },
  { key: "chillers", label: "Chillers", icon: Snowflake },
  { key: "bombas", label: "Bombas", icon: Waves },
];

function buildAlarmEvents(payload: any) {
  return (payload?.alarmes?.timeline || []).map((e: any, index: number) => ({
    id: index + 1,
    time: e.time || "--",
    date: e.date || payload?.end_date || payload?.date || "--",
    title: e.title || "Ocorrência operacional",
    equipment: e.equipment || "--",
    origin: String(e.source || "").toLowerCase().includes("bomba") ? "bombas" as Origin : "chillers" as Origin,
    severity: String(e.severity || "").toLowerCase().includes("crit") ? "critico" as Exclude<Severity, "all"> : String(e.severity || "").toLowerCase().includes("aten") ? "atencao" as Exclude<Severity, "all"> : "info" as Exclude<Severity, "all">,
    status: "registrado" as AlarmStatus,
    details: e.detail || e.status || "Registrado",
  }));
}

function buildRecurrentAlarms(payload: any) {
  return (payload?.alarmes?.recorrentes || []).map((a: any) => ({
    title: a.title || "Ocorrência",
    equipment: a.equipment || "--",
    count: a.count || 0,
    avg: a.avg || "--",
    severity: String(a.severity || "").toLowerCase().includes("crit") ? "critico" as const : String(a.severity || "").toLowerCase().includes("aten") ? "atencao" as const : "info" as const,
  }));
}

function buildEquipmentAlarms(payload: any) {
  return (payload?.alarmes?.por_equipamento || []).map((item: any) => ({
    name: item.name || "--",
    icon: item.type === "bombas" ? Waves : Snowflake,
    crit: item.total || 0,
    label: `${item.total || 0} ocorrência(s)`,
    color: item.type === "bombas" ? "text-yellow-300" : "text-sky-300",
  }));
}

function buildRecommendations(payload: any) {
  return (payload?.alarmes?.recomendacoes_operacionais || []).map((text: string) => ({ icon: Wrench, title: text, subtitle: "", tone: "ai" as const }));
}

const severityTone = {
  critico: {
    label: "Crítico",
    text: "text-status-crit",
    border: "border-status-crit/40",
    bg: "bg-status-crit/10",
    iconBg: "bg-status-crit/15",
    bar: "bg-status-crit",
    icon: AlertTriangle,
  },
  atencao: {
    label: "Atenção",
    text: "text-status-warn",
    border: "border-status-warn/40",
    bg: "bg-status-warn/10",
    iconBg: "bg-status-warn/15",
    bar: "bg-status-warn",
    icon: Bell,
  },
  info: {
    label: "Informregistrado",
    text: "text-status-info",
    border: "border-status-info/40",
    bg: "bg-status-info/10",
    iconBg: "bg-status-info/15",
    bar: "bg-status-info",
    icon: Info,
  },
};

function KpiCard({
  icon: Icon,
  title,
  value,
  subtitle,
  tone,
}: {
  icon: typeof Bell;
  title: string;
  value: string;
  subtitle: string;
  tone: "critico" | "atencao" | "ok" | "ai" | "info";
}) {
  const toneClass = {
    critico: "text-status-crit bg-status-crit/10 border-status-crit/25",
    atencao: "text-status-warn bg-status-warn/10 border-status-warn/25",
    ok: "text-status-ok bg-status-ok/10 border-status-ok/25",
    ai: "text-status-ai bg-status-ai/10 border-status-ai/25",
    info: "text-status-info bg-status-info/10 border-status-info/25",
  }[tone];

  return (
    <div className="glass-card p-4 transition-colors hover:border-status-crit/40 hover:text-white">
      <div className="flex items-center gap-4">
        <div className={cn("grid h-14 w-14 place-items-center rounded-xl border", toneClass)}>
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{title}</div>
          <div className={cn("mt-1 font-display text-3xl font-bold", toneClass.split(" ")[0])}>{value}</div>
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  children,
  onClick,
  className,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border border-border/60 bg-surface-2/40 px-5 py-2 text-sm font-semibold text-muted-foreground transition-all hover:border-status-ai/50 hover:bg-status-ai/15 hover:text-white",
        active && "border-status-ai/60 bg-status-ai/25 text-white shadow-[0_0_22px_oklch(0.7_0.22_300_/_0.22)]",
        className,
      )}
    >
      {children}
    </button>
  );
}

function StatusBadge({ status, severity }: { status: AlarmStatus; severity: Exclude<Severity, "all"> }) {
  if (status === "resolvido") {
    return <span className="rounded-md bg-status-ok/15 px-3 py-1 text-[11px] font-bold uppercase text-status-ok">Resolvido</span>;
  }
  const tone = severityTone[severity];
  return <span className={cn("rounded-md px-3 py-1 text-[11px] font-bold uppercase", tone.bg, tone.text)}>Ativo</span>;
}

function AlarmsPage() {
  const { payload } = useDashboard();
  const [severity, setSeverity] = useState<Severity>("all");
  const [origin, setOrigin] = useState<Origin>("all");
  const alarmEvents = buildAlarmEvents(payload);
  const recurrentAlarms = buildRecurrentAlarms(payload);
  const equipmentAlarms = buildEquipmentAlarms(payload);
  const recommendations = buildRecommendations(payload);

  const filteredEvents = useMemo(() => {
    return alarmEvents.filter((event) => {
      const matchesSeverity = severity === "all" || event.severity === severity;
      const matchesOrigin = origin === "all" || event.origin === origin;
      return matchesSeverity && matchesOrigin;
    });
  }, [severity, origin, alarmEvents]);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Bell className="h-7 w-7 text-status-crit" />
            <h1 className="font-display text-3xl font-bold tracking-tight">Alarmes</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Central de eventos operacionais e ocorrências do CAG.</p>
        </div>
        <button className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-surface-2/40 px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-status-ai/60 hover:bg-status-ai/15 hover:text-white">
          <Download className="h-4 w-4" /> Exportar dados
        </button>
      </div>

      <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3 sm:grid-cols-2">
        <KpiCard icon={Bell} title="Alarmes registrados" value={String(payload?.alarmes?.summary?.registrados ?? "--")} subtitle="Período selecionado" tone="critico" />
        <KpiCard icon={AlertTriangle} title="Críticos" value={String(payload?.alarmes?.summary?.criticos ?? "--")} subtitle="Período selecionado" tone="critico" />
        <KpiCard icon={XCircle} title="Em atenção" value={String(payload?.alarmes?.summary?.atencao ?? "--")} subtitle="Período selecionado" tone="atencao" />
        <KpiCard icon={CheckCircle2} title="Resolvidos" value={String(payload?.alarmes?.summary?.resolvidos ?? "--")} subtitle="Período selecionado" tone="ok" />
        <KpiCard icon={Clock3} title="Tempo médio" value={String(payload?.alarmes?.summary?.tempo_medio_resolucao_min ?? "--")} subtitle="Período selecionado" tone="ai" />
        <KpiCard icon={ActivityIcon} title="Mais recorrente" value={String(payload?.alarmes?.summary?.mais_recorrente ?? "--")} subtitle="Mais recorrente" tone="info" />
      </div>

      <div className="glass-card p-4">
        <div className="grid gap-5 lg:grid-cols-[1fr_1.5fr]">
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Severidade</div>
            <div className="flex flex-wrap gap-2">
              {severityOptions.map((option) => (
                <FilterPill key={option.key} active={severity === option.key} onClick={() => setSeverity(option.key)}>
                  {option.label}
                </FilterPill>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">Origem / Equipamento</div>
            <div className="flex flex-wrap gap-2">
              {originOptions.map((option) => {
                const Icon = option.icon;
                return (
                  <FilterPill key={option.key} active={origin === option.key} onClick={() => setOrigin(option.key)} className="inline-flex items-center gap-2">
                    <Icon className="h-4 w-4" /> {option.label}
                  </FilterPill>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
        <section className="glass-card p-4">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-sm font-bold uppercase tracking-[0.12em]">Linha do tempo de alarmes</h2>
            <span className="text-xs text-muted-foreground">{filteredEvents.length} eventos filtrados</span>
          </div>
          <div className="relative space-y-0 pl-3">
            <div className="absolute bottom-8 left-[27px] top-8 w-px bg-border/60" />
            {filteredEvents.map((event) => {
              const tone = severityTone[event.severity];
              const Icon = tone.icon;
              return (
                <div key={event.id} className="group relative grid grid-cols-[54px_1fr_auto] gap-4 border-b border-border/30 py-4 last:border-b-0 hover:text-white">
                  <div className={cn("relative z-10 grid h-11 w-11 place-items-center rounded-full border", tone.border, tone.iconBg, tone.text)}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="grid gap-1 sm:grid-cols-[88px_1fr]">
                    <div>
                      <div className="font-mono text-lg font-bold text-foreground group-hover:text-white">{event.time}</div>
                      <div className="text-xs text-muted-foreground group-hover:text-slate-200">{event.date}</div>
                    </div>
                    <div>
                      <div className="font-display text-base font-semibold text-foreground group-hover:text-white">{event.title}</div>
                      <div className="text-sm text-muted-foreground group-hover:text-slate-200">{event.equipment}</div>
                    </div>
                  </div>
                  <div className="flex min-w-28 items-center justify-end gap-3 text-right">
                    <div>
                      <StatusBadge status={event.status} severity={event.severity} />
                      <div className={cn("mt-1 text-xs font-semibold", tone.text)}>{event.details}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground transition-colors group-hover:text-white" />
                  </div>
                </div>
              );
            })}
          </div>
          <button className="mt-4 w-full rounded-xl border border-border/60 bg-surface-2/30 px-4 py-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-status-ai/60 hover:bg-status-ai/15 hover:text-white">
            Carregar mais eventos
          </button>
        </section>

        <div className="grid gap-4">
          <section className="glass-card p-4">
            <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.12em]">Alarmes mais recorrentes <span className="text-muted-foreground">(período)</span></h2>
            <div className="space-y-4">
              {recurrentAlarms.map((alarm) => {
                const tone = severityTone[alarm.severity];
                const Icon = tone.icon;
                return (
                  <div key={alarm.title} className="grid grid-cols-[36px_1fr_auto] items-center gap-3 rounded-xl p-2 transition-colors hover:bg-surface-2/40 hover:text-white">
                    <div className={cn("grid h-9 w-9 place-items-center rounded-lg", tone.iconBg, tone.text)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-foreground">{alarm.title}</div>
                      <div className="text-xs text-muted-foreground">{alarm.equipment}</div>
                      <div className="mt-2 h-2 rounded-full bg-surface-2">
                        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.min(100, alarm.count * 12)}%` }} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display text-lg font-bold text-foreground">{alarm.count}</div>
                      <div className="text-xs text-muted-foreground">ocorrências</div>
                      <div className="text-xs text-muted-foreground">{alarm.avg} média</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="glass-card p-4">
              <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.12em]">Alarmes por equipamento <span className="text-muted-foreground">(registrados)</span></h2>
              <div className="space-y-3">
                {equipmentAlarms.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.name} className="flex items-center justify-between rounded-xl border border-border/30 bg-surface-2/20 p-3 transition-colors hover:border-status-info/40 hover:bg-status-info/10 hover:text-white">
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-5 w-5", item.color)} />
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={cn("grid h-6 min-w-6 place-items-center rounded-md px-2 text-xs font-bold", item.crit > 0 ? "bg-status-alert/25 text-status-warn" : "bg-status-ok/20 text-status-ok")}>{item.crit}</span>
                        <span className="text-sm text-muted-foreground">{item.label}</span>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="glass-card p-4">
              <h2 className="mb-4 font-display text-sm font-bold uppercase tracking-[0.12em]">Recomendações operacionais</h2>
              <div className="space-y-3">
                {recommendations.map((rec) => {
                  const Icon = rec.icon;
                  const tone = rec.tone === "ai" ? { text: "text-status-ai", iconBg: "bg-status-ai/15" } : severityTone[rec.tone];
                  return (
                    <div key={rec.title} className="grid grid-cols-[42px_1fr] gap-3 rounded-xl border border-border/30 bg-surface-2/20 p-3 transition-colors hover:border-status-ai/50 hover:bg-status-ai/10 hover:text-white">
                      <div className={cn("grid h-10 w-10 place-items-center rounded-lg", tone.iconBg, tone.text)}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="font-semibold text-foreground">{rec.title}</div>
                        <div className="text-xs text-muted-foreground">{rec.subtitle}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border/50 bg-surface-2/20 px-4 py-3 text-xs text-muted-foreground">
        Os alarmes são consolidados a partir dos eventos operacionais e respeitam o período global selecionado no topo da página.
      </div>
    </div>
  );
}

function ActivityIcon(props: React.ComponentProps<typeof Activity>) {
  return <Activity {...props} />;
}
