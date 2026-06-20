import { cn } from "@/lib/utils";
import type { ChillerId } from "@/data/mockCagData";

const palette: Record<ChillerId, { main: string; glow: string; accent: string; filter: string; label: string }> = {
  blue: {
    main: "var(--chiller-blue)",
    glow: "var(--chiller-blue-glow)",
    accent: "rgba(0, 218, 255, 0.34)",
    filter: "saturate(1.12) hue-rotate(0deg)",
    label: "CHILLER AZUL",
  },
  red: {
    main: "var(--chiller-red)",
    glow: "var(--chiller-red-glow)",
    accent: "rgba(255, 45, 85, 0.36)",
    filter: "saturate(1.2) hue-rotate(145deg)",
    label: "CHILLER VERMELHO",
  },
  white: {
    main: "var(--chiller-white)",
    glow: "var(--chiller-white-glow)",
    accent: "rgba(230, 242, 255, 0.28)",
    filter: "grayscale(0.35) saturate(0.75) brightness(1.08)",
    label: "CHILLER BRANCO",
  },
};

export function EquipmentRender({
  chillerId,
  size = "md",
  highlight = "none",
  className,
}: {
  chillerId: ChillerId;
  size?: "sm" | "md" | "lg";
  highlight?: "compressor" | "pump" | "circuit" | "none";
  className?: string;
}) {
  const p = palette[chillerId];
  const height = size === "lg" ? "h-[330px]" : size === "sm" ? "h-[132px]" : "h-[185px]";
  const labelSize = size === "lg" ? "text-[11px]" : "text-[8px]";
  const accentWidth = size === "lg" ? "w-32" : "w-16";

  return (
    <div
      className={cn(
        "equipment-render group relative w-full overflow-hidden rounded-xl border bg-[#06101f]/70",
        height,
        className,
      )}
      style={{
        borderColor: p.main,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 0 34px color-mix(in oklch, ${p.glow} 42%, transparent)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        style={{
          background: `radial-gradient(circle at 50% 20%, ${p.accent}, transparent 46%), linear-gradient(90deg, ${p.accent}, transparent 20%, transparent 80%, ${p.accent})`,
        }}
      />

      <img
        src="/assets/chiller-render-base.png"
        alt={p.label}
        className="absolute inset-0 h-full w-full object-cover object-center opacity-95 transition-transform duration-500 group-hover:scale-[1.025]"
        style={{ filter: p.filter }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
      <div className="pointer-events-none absolute inset-x-6 bottom-5 h-px" style={{ background: p.main, boxShadow: `0 0 14px ${p.main}` }} />
      <div className={cn("absolute left-0 top-0 h-full", accentWidth)} style={{ background: `linear-gradient(90deg, ${p.accent}, transparent)` }} />
      <div className={cn("absolute right-0 top-0 h-full", accentWidth)} style={{ background: `linear-gradient(270deg, ${p.accent}, transparent)` }} />

      <div
        className={cn("absolute left-4 top-3 rounded border px-2 py-1 font-mono uppercase tracking-[0.24em]", labelSize)}
        style={{ color: p.main, borderColor: p.main, background: "rgba(0,0,0,.35)" }}
      >
        {p.label}
      </div>

      {highlight !== "none" && (
        <div className="absolute right-4 top-4 rounded-md border border-status-alert/60 bg-status-alert/15 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-status-alert shadow-[0_0_20px_rgba(255,166,0,.22)]">
          {highlight === "compressor" ? "Compressor" : highlight === "pump" ? "Bomba" : "Circuito"} em atenção
        </div>
      )}
    </div>
  );
}
