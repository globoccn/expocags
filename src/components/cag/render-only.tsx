import { AlertTriangle, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { cn } from "@/lib/utils";
import { asArray, statusLabel, statusTone, text } from "@/lib/dashboard-context";

export type Tone = "info" | "ok" | "warn" | "crit" | "ai";

export const toneClass: Record<Tone, string> = {
  info: "border-primary/30 bg-primary/10 text-primary",
  ok: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  warn: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  crit: "border-red-500/30 bg-red-500/10 text-red-200",
  ai: "border-violet-400/30 bg-violet-400/10 text-violet-200",
};

export function PageState({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-2xl border border-border/50 bg-surface-2/40">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Carregando dados da central...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
        <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" /> Falha ao carregar dados</div>
        <p className="mt-2 text-sm text-red-100/80">{error}</p>
      </div>
    );
  }
  return null;
}

export function SectionHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div>
      {eyebrow && <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">{eyebrow}</div>}
      <h1 className="font-display text-3xl font-semibold tracking-tight md:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function Panel({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("rounded-2xl border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_26px_rgba(255,255,255,0.03)]", className)}>{children}</div>;
}

export function StatusBadge({ status }: { status: any }) {
  const tone = statusTone(status);
  return <span className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold", toneClass[tone])}>{statusLabel(status)}</span>;
}

export function CardMetric({ label, value, detail, status, icon: Icon }: { label: string; value: any; detail?: any; status?: any; icon?: any }) {
  const tone = statusTone(status);
  return (
    <Panel className="relative overflow-hidden">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-primary/10 blur-3xl" />
      <div className="relative flex items-start justify-between gap-3">
        <div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
          <div className="mt-3 font-display text-3xl font-semibold text-foreground">{text(value)}</div>
        </div>
        {Icon && <div className={cn("grid h-10 w-10 place-items-center rounded-xl border", toneClass[tone])}><Icon className="h-5 w-5" /></div>}
      </div>
      <div className="relative mt-4 flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{text(detail)}</span>
        {status && <StatusBadge status={status} />}
      </div>
    </Panel>
  );
}

export function ApiLineChart({ data, keys, height = 280 }: { data: any[]; keys: Array<{ key: string; label: string }>; height?: number }) {
  const rows = asArray(data).filter(Boolean);
  if (!rows.length || !keys.length) return <Panel className="text-sm text-muted-foreground">Série não disponível para este período.</Panel>;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 18, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
          <XAxis dataKey="x" tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "rgba(2,6,23,0.94)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12, color: "#fff" }}
            labelStyle={{ color: "#fff" }}
          />
          {keys.map((item) => (
            <Line key={item.key} type="monotone" dataKey={item.key} name={item.label} strokeWidth={2} dot={false} connectNulls />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ApiBarChart({ data, xKey = "label", yKey = "horas", height = 240 }: { data: any[]; xKey?: string; yKey?: string; height?: number }) {
  const rows = asArray(data).filter(Boolean);
  if (!rows.length) return <Panel className="text-sm text-muted-foreground">Distribuição não disponível para este período.</Panel>;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 18, bottom: 0, left: -8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.18)" />
          <XAxis dataKey={xKey} tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: "rgba(226,232,240,0.65)", fontSize: 11 }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ background: "rgba(2,6,23,0.94)", border: "1px solid rgba(148,163,184,0.25)", borderRadius: 12, color: "#fff" }}
            labelStyle={{ color: "#fff" }}
          />
          <Bar dataKey={yKey} radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
