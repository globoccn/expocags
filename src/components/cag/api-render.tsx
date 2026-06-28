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

export function PageState({ loading, error }: { loading: boolean; error: string | null }) {
  if (loading) {
    return (
      <div className="grid min-h-[55vh] place-items-center rounded-2xl border border-border/50 bg-surface-2/40">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          Carregando dados reais da API Dashboard...
        </div>
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-red-100">
        <div className="flex items-center gap-2 font-semibold"><AlertTriangle className="h-5 w-5" /> Falha ao carregar API</div>
        <p className="mt-2 text-sm text-red-100/80">{error}</p>
      </div>
    );
  }
  return null;
}

export function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground md:text-3xl">{title}</h1>
      {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
    </div>
  );
}

export function MetricCard({ label, value, detail, status }: { label: string; value: any; detail?: string; status?: any }) {
  return (
    <div className="rounded-2xl border border-border/50 bg-surface-2/55 p-4 shadow-[inset_0_0_26px_rgba(255,255,255,0.03)]">
      <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted-foreground">{label}</div>
      <div className="mt-3 text-2xl font-bold text-foreground">{text(value)}</div>
      <div className="mt-3 flex items-center justify-between gap-2">
        <span className="text-xs text-muted-foreground">{detail || "Dados do workflow"}</span>
        {status && <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold ${statusClass(status)}`}>{text(status)}</span>}
      </div>
    </div>
  );
}

export function EmptyData({ label = "Sem dados para este período" }: { label?: string }) {
  return <div className="rounded-2xl border border-dashed border-border/60 bg-surface-2/25 p-6 text-sm text-muted-foreground">{label}</div>;
}

export function StatusPill({ status }: { status: any }) {
  return <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusClass(status)}`}>{text(status)}</span>;
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
