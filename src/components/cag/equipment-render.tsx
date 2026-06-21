import { cn } from "@/lib/utils";
import type { ChillerId } from "@/data/mockCagData";

const palette: Record<ChillerId, { main: string; glow: string; accent: string; filter: string; label: string }> = {
  blue: {
    main: "var(--chiller-blue)",
    glow: "var(--chiller-blue-glow)",
    accent: "rgba(0, 218, 255, 0.42)",
    filter: "saturate(1.08) hue-rotate(0deg) contrast(1.06) brightness(.98)",
    label: "CHILLER AZUL",
  },
  red: {
    main: "var(--chiller-red)",
    glow: "var(--chiller-red-glow)",
    accent: "rgba(255, 45, 85, 0.42)",
    filter: "saturate(1.16) hue-rotate(140deg) contrast(1.08) brightness(.94)",
    label: "CHILLER VERMELHO",
  },
  white: {
    main: "var(--chiller-white)",
    glow: "var(--chiller-white-glow)",
    accent: "rgba(230, 242, 255, 0.38)",
    filter: "grayscale(.45) saturate(.68) brightness(1.08) contrast(1.07)",
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
  const height = size === "lg" ? "h-[330px]" : size === "sm" ? "h-[130px]" : "h-[185px]";

  return (
    <div
      className={cn("equipment-stage group relative w-full overflow-hidden rounded-2xl", height, className)}
      style={{
        borderColor: `color-mix(in oklch, ${p.main} 68%, transparent)`,
        boxShadow: `inset 0 1px 0 rgba(255,255,255,.09), 0 0 42px color-mix(in oklch, ${p.glow} 36%, transparent)`,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-95"
        style={{
          background: `radial-gradient(ellipse 70% 38% at 50% 82%, ${p.accent}, transparent 58%), radial-gradient(circle at 50% 18%, ${p.accent}, transparent 34%), linear-gradient(90deg, ${p.accent}, transparent 18%, transparent 82%, ${p.accent})`,
        }}
      />

      <div className="pointer-events-none absolute inset-0 opacity-30" style={{ backgroundImage: `repeating-linear-gradient(90deg, transparent 0 44px, ${p.accent} 45px 46px)` }} />

      <img
        src="/assets/chiller-render-base.png"
        alt={p.label}
        className="absolute inset-x-0 bottom-4 mx-auto h-[94%] w-[96%] object-contain object-center opacity-100 transition-transform duration-500 group-hover:scale-[1.035]"
        style={{ filter: p.filter }}
      />

      <div className="pointer-events-none absolute left-[8%] right-[8%] bottom-7 h-[18px] rounded-[50%] border opacity-95" style={{ borderColor: p.main, boxShadow: `0 0 22px ${p.main}, inset 0 0 18px ${p.main}` }} />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background/95 via-background/35 to-transparent" />
      <div className="pointer-events-none absolute inset-x-10 bottom-5 h-px" style={{ background: p.main, boxShadow: `0 0 18px ${p.main}` }} />

      {highlight !== "none" && (
        <div className="absolute right-3 top-3 rounded-full border border-status-alert/60 bg-status-alert/15 px-3 py-1 text-[9px] font-bold uppercase tracking-wider text-status-alert shadow-[0_0_22px_rgba(255,166,0,.24)]">
          {highlight === "compressor" ? "Compressor" : highlight === "pump" ? "Bomba" : "Circuito"} em atenção
        </div>
      )}
    </div>
  );
}
