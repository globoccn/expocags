import { cn } from "@/lib/utils";
import type { ChillerId } from "@/data/mockCagData";

const palette: Record<ChillerId, { main: string; glow: string; accent: string; filter: string; label: string }> = {
  blue: {
    main: "var(--chiller-blue)",
    glow: "var(--chiller-blue-glow)",
    accent: "rgba(0, 218, 255, 0.34)",
    filter: "saturate(1.08) hue-rotate(0deg) contrast(1.04)",
    label: "CHILLER AZUL",
  },
  red: {
    main: "var(--chiller-red)",
    glow: "var(--chiller-red-glow)",
    accent: "rgba(255, 45, 85, 0.36)",
    filter: "saturate(1.18) hue-rotate(142deg) contrast(1.08)",
    label: "CHILLER VERMELHO",
  },
  white: {
    main: "var(--chiller-white)",
    glow: "var(--chiller-white-glow)",
    accent: "rgba(230, 242, 255, 0.30)",
    filter: "grayscale(0.42) saturate(0.72) brightness(1.1) contrast(1.05)",
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
  const height = size === "lg" ? "h-[340px]" : size === "sm" ? "h-[120px]" : "h-[154px]";

  return (
    <div
      className={cn(
        "equipment-render group relative w-full overflow-hidden rounded-xl border bg-[#030814]/60",
        height,
        className,
      )}
      style={{
        borderColor: `color-mix(in oklch, ${p.main} 72%, transparent)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.08), 0 0 30px color-mix(in oklch, ${p.glow} 42%, transparent)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-90"
        style={{
          background: `radial-gradient(circle at 50% 8%, ${p.accent}, transparent 42%), linear-gradient(90deg, ${p.accent}, transparent 16%, transparent 84%, ${p.accent})`,
        }}
      />

      <img
        src="/assets/chiller-render-base.png"
        alt={p.label}
        className="absolute inset-0 h-full w-full object-contain object-center opacity-95 transition-transform duration-500 group-hover:scale-[1.03]"
        style={{ filter: p.filter }}
      />

      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-14 bg-gradient-to-t from-background/95 via-background/28 to-transparent" />
      <div className="pointer-events-none absolute inset-x-8 bottom-4 h-px" style={{ background: p.main, boxShadow: `0 0 16px ${p.main}` }} />
      <div className="pointer-events-none absolute -inset-x-10 top-1/2 h-24 -translate-y-1/2 blur-3xl" style={{ background: p.accent }} />

      {highlight !== "none" && (
        <div className="absolute right-3 top-3 rounded-md border border-status-alert/60 bg-status-alert/15 px-2 py-1 text-[9px] font-semibold uppercase tracking-wider text-status-alert shadow-[0_0_20px_rgba(255,166,0,.22)]">
          {highlight === "compressor" ? "Compressor" : highlight === "pump" ? "Bomba" : "Circuito"} em atenção
        </div>
      )}
    </div>
  );
}
