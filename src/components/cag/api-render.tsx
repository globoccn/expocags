import type { ReactNode } from "react";
import { AlertTriangle, Loader2 } from "lucide-react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Bar,
  BarChart,
} from "recharts";
import { asArray, fmt, statusClass, text } from "@/lib/dashboard-context";
import { cn } from "@/lib/utils";

export function PageState({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="relative grid min-h-[55vh] place-items-center overflow-hidden rounded-[28px] border border-primary/20 bg-[radial-gradient(circle_at_50%_0%,rgba(0,180,255,0.16),transparent_42%),rgba(15,23,42,0.42)] shadow-[inset_0_0_60px_rgba(255,255,255,0.04)]">
        <div className="absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-primary/50 to-transparent" />
        <div className="flex items-center gap-3 rounded-full border border-border/50 bg-background/45 px-5 py-3 text-sm text-muted-foreground backdrop-blur-xl">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Carregando dados reais da API Dashboard...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-[26px] border border-red-500/30 bg-red-500/10 p-6 text-red-100 shadow-[0_0_30px_rgba(239,68,68,0.08)]">
        <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" /> Falha ao carregar API</div>
        <p className="mt-2 text-sm text-red-100/80">{error}</p>
      </div>
    );
  }
  return null;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="relative overflow-hidden rounded-[28px] border border-border/50 bg-[radial-gradient(circle_at_12%_0%,rgba(0,180,255,0.16),transparent_36%),linear-gradient(135deg,rgba(15,23,42,0.72),rgba(2,6,23,0.35))] p-5 shadow-[inset_0_0_40px_rgba(255,255,255,0.035)]">
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/70 to-transparent" />
      <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-primary/80">Centro de Inteligência CAG</div>
      <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function MetricCard({ label, value, detail, status, className }: { label: string; value: any; detail?: string; status?: any; className?: string }) {
  return (
    <div className={cn("group relative overflow-hidden rounded-[22px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_26px_rgba(255,255,255,0.03)] transition hover:border-primary/35 hover:shadow-[0_0_30px_rgba(0,180,255,0.10),inset_0_0_26px_rgba(255,255,255,0.04)]", className)}>
      <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 blur-2xl transition group-hover:bg-primary/15" />
      <div className="relative text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="relative mt-3 font-mono text-2xl font-bold text-foreground">{text(value)}</div>
      <div className="relative mt-3 flex items-center justify-between gap-2">
        <span className="min-w-0 truncate text-xs text-muted-foreground">{detail || "Dados do workflow"}</span>
        {status && <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(status)}`}>{text(status)}</span>}
      </div>
    </div>
  );
}

export function EmptyData({ label = "Sem dados para este período" }: { label?: string }) {
  return <div className="rounded-[22px] border border-dashed border-border/60 bg-surface-2/25 p-6 text-sm text-muted-foreground">{label}</div>;
}

export function StatusPill({ status }: { status: any }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{text(status)}</span>;
}

export function DataPanel({ title, icon, children, actions, className }: { title?: string; icon?: ReactNode; children: ReactNode; actions?: ReactNode; className?: string }) {
  return (
    <section className={cn("relative overflow-hidden rounded-[26px] border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_34px_rgba(255,255,255,0.035)]", className)}>
      <div className="pointer-events-none absolute inset-x-8 top-0 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
      {(title || actions) && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          {title && <div className="flex items-center gap-2 font-display text-lg font-semibold">{icon}<span>{title}</span></div>}
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

export function SimpleLineChart({ data, keys, height = 260 }: { data: any[]; keys: Array<{ key: string; label: string }>; height?: number }) {
  const rows = asArray(data).filter(Boolean);
  if (!rows.length || !keys.length) return <EmptyData label="Série não enviada pelo workflow para este período." />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={rows} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
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

export function SimpleBarChart({ data, xKey, yKey, height = 240 }: { data: any[]; xKey: string; yKey: string; height?: number }) {
  const rows = asArray(data).filter(Boolean);
  if (!rows.length) return <EmptyData label="Distribuição não enviada pelo workflow para este período." />;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={rows} margin={{ top: 10, right: 18, bottom: 0, left: -10 }}>
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

export function fmtMetric(value: any, suffix = "", digits = 1) {
  return fmt(value, suffix, digits);
}
