import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type DashboardPeriod = "d_1" | "week" | "month";

type DashboardContextValue = {
  period: DashboardPeriod;
  setPeriod: (period: DashboardPeriod) => void;
  payload: any | null;
  loading: boolean;
  error: string | null;
  refresh: () => void;
};

const DashboardContext = createContext<DashboardContextValue | null>(null);

const periodStorageKey = "cag-period-v2";

const normalizePeriod = (value: string | null | undefined): DashboardPeriod => {
  if (value === "week" || value === "7d") return "week";
  if (value === "month" || value === "1m") return "month";
  return "d_1";
};

const apiBase = () => {
  const fromEnv = import.meta.env.VITE_API_URL as string | undefined;
  return (fromEnv || "https://ancar-n8n.gpfgqx.easypanel.host/webhook").replace(/\/$/, "");
};

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<DashboardPeriod>("d_1");
  const [payload, setPayload] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = normalizePeriod(window.localStorage.getItem(periodStorageKey) || window.localStorage.getItem("cag-period"));
    setPeriodState(stored);
  }, []);

  const setPeriod = (next: DashboardPeriod) => {
    setPayload(null);
    setPeriodState(next);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(periodStorageKey, next);
      window.localStorage.setItem("cag-period", next === "d_1" ? "d1" : next === "week" ? "7d" : "1m");
    }
  };

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${apiBase()}/cag/dashboard?period=${period}`, {
          signal: controller.signal,
          headers: { Accept: "application/json" },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const json = await response.json();
        if (!cancelled) setPayload(json);
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        setPayload(null);
        setError(err instanceof Error ? err.message : "Falha ao carregar API Dashboard");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [period, refreshToken]);

  const value = useMemo<DashboardContextValue>(
    () => ({ period, setPeriod, payload, loading, error, refresh: () => setRefreshToken((v) => v + 1) }),
    [period, payload, loading, error],
  );

  return <DashboardContext.Provider value={value}>{children}</DashboardContext.Provider>;
}

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard deve ser usado dentro de DashboardProvider");
  return ctx;
}

export const periodLabel = (period: DashboardPeriod) =>
  period === "d_1" ? "D-1" : period === "week" ? "7 dias" : "1 mês";

export const fmt = (value: any, suffix = "", digits = 1) => {
  const n = Number(value);
  if (value === null || value === undefined || value === "" || !Number.isFinite(n)) return "--";
  return `${n.toLocaleString("pt-BR", { minimumFractionDigits: digits, maximumFractionDigits: digits })}${suffix}`;
};

export const text = (value: any) => {
  if (value === null || value === undefined || value === "") return "--";
  return String(value);
};

export const asArray = (value: any) => (Array.isArray(value) ? value : []);

export const statusClass = (status: any) => {
  const s = String(status || "").toLowerCase();
  if (s.includes("crit")) return "border-red-500/40 bg-red-500/10 text-red-200";
  if (s.includes("aten") || s.includes("warn") || s.includes("media")) return "border-amber-400/40 bg-amber-400/10 text-amber-100";
  return "border-emerald-400/35 bg-emerald-400/10 text-emerald-100";
};

export const groupLabel = (id: any) => {
  const value = String(id || "").toLowerCase();
  if (value === "azul" || value === "blue") return "Azul";
  if (value === "vermelho" || value === "red") return "Vermelho";
  if (value === "branco" || value === "white") return "Branco";
  return text(id);
};
