import { Link, useRouterState } from "@tanstack/react-router";
import {
  AlertTriangle,
  BarChart3,
  Brain,
  CircuitBoard,
  Droplets,
  FileText,
  LayoutDashboard,
  Settings,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import centerNorteLogo from "@/assets/center-norte-logo.jpg";

const nav = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/chillers", label: "Chillers", icon: CircuitBoard },
  { to: "/pumps", label: "Bombas", icon: Droplets },
  { to: "/ai", label: "Análise IA", icon: Brain },
  { to: "/trends", label: "Tendências", icon: BarChart3 },
  { to: "/alarms", label: "Alarmes", icon: AlertTriangle },
  { to: "/reports", label: "Relatórios Hidrômetros", icon: FileText },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [now, setNow] = useState("");
  const [period, setPeriod] = useState(() => {
    if (typeof window === "undefined") return "d1";
    return window.localStorage.getItem("cag-period") || "d1";
  });

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(
        d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
      );
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/40 bg-sidebar/60 backdrop-blur-xl lg:flex">
        <div className="border-b border-border/40 px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="relative h-11 w-11 overflow-hidden rounded-md border border-primary/35 bg-white/95 p-1 shadow-[0_0_18px_rgba(0,180,255,0.18)]">
              <img
                src={centerNorteLogo}
                alt="Center Norte"
                className="h-full w-full object-contain"
              />
              <div className="absolute inset-0 rounded-md ring-1 ring-primary/20" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-[13px] font-bold tracking-[0.18em]">EXPO</div>
              <div className="text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
                Center Norte
              </div>
            </div>
          </div>
          <div className="mt-3 border-t border-border/30 pt-3">
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">
              CAG
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Centro de Inteligência
            </div>
          </div>
        </div>
        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {nav.map((item) => {
            const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all",
                  active
                    ? "bg-primary/15 text-primary shadow-[inset_2px_0_0_0_var(--primary)]"
                    : "text-muted-foreground hover:bg-accent/40 hover:text-foreground",
                )}
              >
                <item.icon className={cn("h-4 w-4", active && "text-glow")} />
                <span>{item.label}</span>
                {active && (
                  <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />
                )}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/40 px-3 py-3 text-[10px] text-muted-foreground">
          <div className="text-[9px] uppercase tracking-[0.18em] opacity-60">
            v1.0 · build 2026.06
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-12 items-center gap-3 border-b border-border/40 bg-background/70 px-4 backdrop-blur-xl">
          <div className="hidden md:block">
            <div className="font-display text-sm font-semibold leading-none">
              Visão Geral da Central
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              Expo Center Norte · Análise Operacional
            </div>
          </div>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden overflow-hidden rounded-full border border-border bg-surface-2/70 p-0.5 text-[11px] shadow-[inset_0_0_18px_rgba(0,180,255,0.06)] md:flex">
              {[
                { value: "d1", label: "D-1" },
                { value: "7d", label: "7 dias" },
                { value: "1m", label: "1 mês" },
              ].map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setPeriod(p.value);
                    window.localStorage.setItem("cag-period", p.value);
                    window.dispatchEvent(new CustomEvent("cag-period-change", { detail: p.value }));
                  }}
                  className={cn(
                    "min-w-16 rounded-full px-3 py-1.5 font-semibold transition-all",
                    period === p.value
                      ? "bg-primary/25 text-primary shadow-[0_0_18px_rgba(0,180,255,0.25),inset_0_0_14px_rgba(0,180,255,0.12)]"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="hidden items-center gap-3 rounded-full border border-border/60 bg-surface-2/55 px-3 py-1.5 text-[10px] text-muted-foreground shadow-[inset_0_0_16px_rgba(255,255,255,0.03)] xl:flex">
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-[0.16em] opacity-70">Dados da base</span>
                <span className="font-mono font-semibold text-foreground/85">19/06/2026 (D-1)</span>
              </div>
              <span className="h-4 w-px bg-border/70" />
              <div className="flex items-center gap-1.5">
                <span className="uppercase tracking-[0.16em] opacity-70">Atualizado</span>
                <span className="font-mono font-semibold text-foreground/85">20/06/2026 06:05</span>
              </div>
            </div>
            <div className="hidden font-mono text-xs text-muted-foreground md:block">{now}</div>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-bold text-primary">
              OP
            </div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
