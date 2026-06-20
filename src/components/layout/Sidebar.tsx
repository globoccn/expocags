import { Link, useLocation } from "@tanstack/react-router";
import { Activity, BarChart3, Bell, Bot, FileText, Gauge, Home, Settings, Snowflake } from "lucide-react";
import { chillers } from "@/lib/cag-data";

const nav = [
  { to: "/", label: "Visão Geral", icon: Home },
  { to: "/chillers", label: "Chillers", icon: Snowflake },
  { to: "/analytics", label: "Bombas", icon: Gauge },
  { to: "/esg", label: "Análise IA", icon: Bot },
  { to: "/reports", label: "Tendências", icon: BarChart3 },
  { to: "/settings", label: "Configurações", icon: Settings },
] as const;

export function Sidebar() {
  const { pathname } = useLocation();
  const avgHealth = Math.round(chillers.reduce((sum, c) => sum + c.health, 0) / chillers.length);

  return (
    <aside className="hidden w-[244px] shrink-0 flex-col border-r border-cyan-400/10 bg-[#050b14]/95 text-slate-200 lg:flex">
      <div className="px-5 pb-7 pt-6">
        <div className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-cyan-300/30 bg-cyan-400/10 text-cyan-300 shadow-[0_0_24px_rgba(34,211,238,.25)]">
            <Activity className="h-6 w-6" />
          </div>
          <div>
            <div className="text-[15px] font-bold uppercase tracking-wide text-white">CAG Intelligence AI</div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-cyan-200/60">Central de Água Gelada</div>
          </div>
        </div>
      </div>

      <nav className="space-y-1 px-3">
        {nav.map(({ to, label, icon: Icon }) => {
          const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className={[
                "group flex items-center gap-3 rounded-xl border px-3 py-3 text-sm font-medium transition",
                active
                  ? "border-cyan-300/30 bg-cyan-400/12 text-cyan-200 shadow-[inset_0_0_18px_rgba(34,211,238,.12)]"
                  : "border-transparent text-slate-400 hover:border-cyan-400/15 hover:bg-cyan-400/5 hover:text-slate-100",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              {label}
              {label === "Alarmes" && <span className="ml-auto rounded-full bg-red-500 px-1.5 text-[10px] text-white">5</span>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto p-4">
        <div className="rounded-2xl border border-cyan-400/15 bg-slate-950/60 p-4">
          <div className="text-xs uppercase tracking-wider text-slate-400">Health Engine</div>
          <div className="mt-3 flex items-end gap-2">
            <div className="text-4xl font-bold text-emerald-300">{avgHealth}</div>
            <div className="pb-1 text-sm text-slate-400">/100</div>
          </div>
          <div className="mt-2 h-2 rounded-full bg-slate-800">
            <div className="h-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,.5)]" style={{ width: `${avgHealth}%` }} />
          </div>
          <div className="mt-3 text-xs text-slate-400">V1.1 • dados mockados prontos para Redis/n8n</div>
        </div>
      </div>
    </aside>
  );
}
