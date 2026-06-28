import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Configurações — CAG Expo Center Norte" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="mt-1 text-sm text-muted-foreground">Parâmetros gerais da interface operacional.</p>
      </div>
      <section className="rounded-3xl border border-border/60 bg-surface-1/80 p-6">
        <h2 className="font-display text-xl font-bold">Dashboard CAG</h2>
        <p className="mt-2 text-sm text-muted-foreground">Configurações de visualização e preferências do painel.</p>
      </section>
    </div>
  );
}
