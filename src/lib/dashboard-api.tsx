import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DashboardPeriod = "d_1" | "week" | "month";
export type UiPeriod = "d1" | "7d" | "1m";

type DashboardContextValue = {
  period: DashboardPeriod;
  uiPeriod: UiPeriod;
  setUiPeriod: (period: UiPeriod) => void;
  data: any | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

export const uiToApiPeriod = (period: UiPeriod): DashboardPeriod => {
  if (period === "7d") return "week";
  if (period === "1m") return "month";
  return "d_1";
};

export const apiToUiPeriod = (period: DashboardPeriod): UiPeriod => {
  if (period === "week") return "7d";
  if (period === "month") return "1m";
  return "d1";
};

const API_BASE = (import.meta.env.VITE_API_URL || "https://ancar-n8n.gpfgqx.easypanel.host/webhook").replace(/\/$/, "");

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [uiPeriod, setUiPeriodState] = useState<UiPeriod>("d1");
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const stored = window.localStorage.getItem("cag-period") as UiPeriod | null;
    if (stored === "d1" || stored === "7d" || stored === "1m") setUiPeriodState(stored);
  }, []);

  const setUiPeriod = (next: UiPeriod) => {
    setUiPeriodState(next);
    window.localStorage.setItem("cag-period", next);
  };

  const period = uiToApiPeriod(uiPeriod);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError(null);
    setData(null);
    fetch(`${API_BASE}/cag/dashboard?period=${period}`, { signal: controller.signal })
      .then(async (res) => {
        const payload = await res.json().catch(() => null);
        if (!res.ok || payload?.success === false || payload?.api_error) {
          throw new Error(payload?.message || `HTTP ${res.status}`);
        }
        return payload;
      })
      .then((payload) => setData(payload))
      .catch((err) => {
        if (err?.name !== "AbortError") setError(err?.message || "Erro ao carregar dados");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [period, reloadKey]);

  const value = useMemo(
    () => ({ period, uiPeriod, setUiPeriod, data, loading, error, refresh: () => setReloadKey((x) => x + 1) }),
    [period, uiPeriod, data, loading, error],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard deve ser usado dentro do DashboardProvider");
  return ctx;
}

export const dash = (value: any, suffix = "") => {
  if (value === null || value === undefined || value === "") return "--";
  return `${value}${suffix}`;
};

export const fmt = (value: any, digits = 1, suffix = "") => {
  const n = Number(value);
  if (!Number.isFinite(n)) return "--";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
};

export const statusTone = (status?: string) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("crit")) return "crit";
  if (s.includes("aten") || s.includes("warn") || s.includes("media")) return "warn";
  if (s.includes("normal") || s.includes("ok")) return "ok";
  return "info";
};

export const periodTitle = (payload: any) => {
  const label = payload?.label || payload?.period?.label || payload?._api?.period || "D-1";
  const start = payload?.start_date;
  const end = payload?.end_date;
  if (start && end && start !== end) return `${label} · ${start} a ${end}`;
  if (end) return `${label} · ${end}`;
  return label;
};

export function LoadingState() {
  return <div className="rounded-3xl border border-border/60 bg-surface-1/70 p-8 text-sm text-muted-foreground">Carregando dados...</div>;
}

export function EmptyState({ message = "Sem dados para exibir." }: { message?: string }) {
  return <div className="rounded-3xl border border-border/60 bg-surface-1/70 p-8 text-sm text-muted-foreground">{message}</div>;
}
