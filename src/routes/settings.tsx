import { createFileRoute } from "@tanstack/react-router";
import { useTheme } from "@/components/cag/theme-provider";
import { chillers, chillerTheme } from "@/data/mockCagData";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — CAG Intelligence AI" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Sistema</div>
        <h1 className="font-display text-3xl font-bold">Configurações</h1>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Tema</h3>
          <div className="grid grid-cols-3 gap-2">
            {(["dark", "light", "auto"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`rounded-md border px-3 py-2 text-sm capitalize transition ${
                  theme === t ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Planta</h3>
          <label className="text-[11px] uppercase tracking-wider text-muted-foreground">Nome da planta</label>
          <input
            defaultValue="Central de Água Gelada"
            className="mt-1 w-full rounded-md border border-border bg-surface-2/60 px-3 py-2 text-sm focus:border-primary focus:outline-none"
          />
        </div>

        <div className="glass-card p-5 lg:col-span-2">
          <h3 className="mb-3 font-display text-sm font-semibold">Chillers e cores</h3>
          <div className="grid gap-3 md:grid-cols-3">
            {chillers.map((c) => {
              const t = chillerTheme[c.id];
              return (
                <div key={c.id} className={`glass-card ${t.ring} p-4`}>
                  <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{c.id}</div>
                  <div className="font-display text-lg font-bold" style={{ color: t.hex }}>{c.name}</div>
                  <div className="mt-2 flex items-center gap-2 text-xs">
                    <span className="h-4 w-4 rounded-full" style={{ background: t.hex }} />
                    <span className="font-mono text-muted-foreground">{t.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Limites de Alerta</h3>
          {[
            { label: "Delta T mínimo (°C)", value: 4.0 },
            { label: "Bypass máximo (%)", value: 40 },
            { label: "Pressão alta máxima (bar)", value: 18 },
          ].map((l) => (
            <div key={l.label} className="mb-2 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">{l.label}</span>
              <input
                defaultValue={l.value}
                className="w-24 rounded-md border border-border bg-surface-2/60 px-2 py-1 text-right font-mono text-sm focus:border-primary focus:outline-none"
              />
            </div>
          ))}
        </div>

        <div className="glass-card p-5">
          <h3 className="mb-3 font-display text-sm font-semibold">Preferências</h3>
          <div className="space-y-2 text-sm">
            <label className="flex items-center justify-between">
              <span>Período padrão</span>
              <select className="rounded-md border border-border bg-surface-2/60 px-2 py-1 text-xs">
                <option>Hoje</option>
                <option>Últimas 24h</option>
              </select>
            </label>
            <label className="flex items-center justify-between">
              <span>Animações</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </label>
            <label className="flex items-center justify-between">
              <span>Glow neon</span>
              <input type="checkbox" defaultChecked className="h-4 w-4 accent-primary" />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}