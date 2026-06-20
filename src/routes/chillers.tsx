import { createFileRoute, Link } from "@tanstack/react-router";
import { chillers } from "@/data/mockCagData";
import { ChillerCard } from "@/components/cag/chiller-card";

export const Route = createFileRoute("/chillers")({
  head: () => ({ meta: [{ title: "Chillers — CAG Intelligence AI" }] }),
  component: ChillersPage,
});

function ChillersPage() {
  return (
    <div className="space-y-6">
      <div>
        <div className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground">Equipamentos</div>
        <h1 className="font-display text-3xl font-bold">Chillers</h1>
        <p className="text-sm text-muted-foreground">3 unidades · 6 circuitos · 12 bombas</p>
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        {chillers.map((c) => <ChillerCard key={c.id} chiller={c} />)}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        <Link to="/" className="underline">← Voltar à visão geral</Link>
      </p>
    </div>
  );
}