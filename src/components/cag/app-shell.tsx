import { Link, useRouterState } from "@tanstack/react-router";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Brain,
  ChevronDown,
  CircuitBoard,
  Droplets,
  FileText,
  LayoutDashboard,
  Moon,
  Settings,
  Signal,
  Sun,
  Wand2,
  Wifi,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { useTheme } from "./theme-provider";
import { cn } from "@/lib/utils";
import { periodOptions } from "@/data/mockCagData";

const nav = [
  { to: "/", label: "Visão Geral", icon: LayoutDashboard },
  { to: "/chillers", label: "Chillers", icon: CircuitBoard },
  { to: "/pumps", label: "Bombas", icon: Droplets },
  { to: "/ai", label: "Análise IA", icon: Brain },
  { to: "/trends", label: "Tendências", icon: BarChart3 },
  { to: "/alarms", label: "Alarmes", icon: AlertTriangle },
  { to: "/reports", label: "Relatórios", icon: FileText },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { theme, setTheme } = useTheme();
  const [now, setNow] = useState("");
  const [period, setPeriod] = useState("today");

  useEffect(() => {
    const tick = () => {
      const d = new Date();
      setNow(d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    tick();
    const i = setInterval(tick, 1000);
    return () => clearInterval(i);
  }, []);

  const cycleTheme = () => setTheme(theme === "dark" ? "light" : theme === "light" ? "auto" : "dark");
  const ThemeIcon = theme === "dark" ? Moon : theme === "light" ? Sun : Wand2;

  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      {/* Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-border/40 bg-sidebar/60 backdrop-blur-xl lg:flex">
        <div className="border-b border-border/40 px-5 py-5">
          <div className="font-display text-2xl font-black leading-none tracking-tight text-foreground">★ EXPO</div>
          <div className="mt-0.5 text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Center Norte</div>
          <div className="mt-5 text-sm font-bold uppercase leading-tight tracking-[0.12em] text-foreground/90">CAG</div>
          <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">Centrais de<br />Água Gelada</div>
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
                {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-primary animate-pulse-glow" />}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border/40 p-3 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <Wifi className="h-3 w-3 text-status-ok" />
            <span>n8n · pronto p/ conectar</span>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Header */}
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border/40 bg-background/70 px-4 backdrop-blur-xl">
          <div className="hidden md:block">
            <div className="font-display text-sm font-semibold leading-none">Central de Água Gelada</div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Expo Center Norte · CAG principal e Pavimento Branco</div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="appearance-none rounded-md border border-border bg-surface-2/60 px-3 py-1.5 pr-7 text-xs font-medium focus:border-primary focus:outline-none"
              >
                {periodOptions.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            </div>
            <div className="hidden items-center gap-1.5 rounded-md border border-status-ok/40 bg-status-ok/10 px-2.5 py-1 text-[11px] text-status-ok md:flex">
              <Signal className="h-3 w-3 animate-pulse-glow" />
              <span>ONLINE</span>
            </div>
            <button
              onClick={cycleTheme}
              title={`Tema: ${theme}`}
              className="grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-2/60 text-muted-foreground transition hover:text-foreground"
            >
              <ThemeIcon className="h-3.5 w-3.5" />
            </button>
            <button className="relative grid h-8 w-8 place-items-center rounded-md border border-border bg-surface-2/60 text-muted-foreground hover:text-foreground">
              <Bell className="h-3.5 w-3.5" />
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-status-alert animate-pulse-glow" />
            </button>
            <div className="hidden font-mono text-xs text-muted-foreground md:block">{now}</div>
            <div className="grid h-8 w-8 place-items-center rounded-full border border-primary/40 bg-primary/10 text-[11px] font-bold text-primary">OP</div>
          </div>
        </header>
        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}