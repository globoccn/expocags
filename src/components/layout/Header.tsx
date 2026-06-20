import { Bell, CalendarDays, CircleUserRound, DatabaseZap } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-cyan-400/10 bg-[#050b14]/80 backdrop-blur-xl">
      <div className="flex h-[68px] items-center gap-4 px-6">
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-cyan-200/60">Monitoramento Inteligente</div>
          <div className="text-lg font-semibold text-white">Centro de Inteligência da CAG</div>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <div className="hidden items-center gap-2 rounded-xl border border-cyan-400/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 md:flex">
            <DatabaseZap className="h-4 w-4 text-emerald-300" />
            n8n / Redis preparado
          </div>
          <div className="hidden items-center gap-2 rounded-xl border border-cyan-400/15 bg-slate-950/70 px-3 py-2 text-sm text-slate-300 sm:flex">
            <CalendarDays className="h-4 w-4 text-cyan-300" />
            09/05/2025 10:30:45
          </div>
          <button className="relative grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/15 bg-slate-950/70 text-slate-300">
            <Bell className="h-4 w-4" />
            <span className="absolute -right-1 -top-1 rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">5</span>
          </button>
          <button className="grid h-10 w-10 place-items-center rounded-xl border border-cyan-400/15 bg-slate-950/70 text-slate-300">
            <CircleUserRound className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
