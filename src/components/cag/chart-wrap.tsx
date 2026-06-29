import { ResponsiveContainer } from "recharts";
import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

export function ChartWrap({
  title,
  subtitle,
  height = 240,
  children,
  actions,
  className,
}: {
  title: string;
  subtitle?: string;
  height?: number;
  children: ReactElement;
  actions?: ReactElement;
  className?: string;
}) {
  return (
    <div className={cn("glass-card enterprise-chart-panel p-4", className)}>
      <div className="mb-3 flex items-start justify-between">
        <div>
          <h4 className="font-display text-sm font-semibold">{title}</h4>
          {subtitle && <p className="text-[11px] text-muted-foreground">{subtitle}</p>}
        </div>
        {actions}
      </div>
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer>{children}</ResponsiveContainer>
      </div>
    </div>
  );
}

export const chartColors = {
  blue: "var(--chiller-blue)",
  red: "var(--chiller-red)",
  white: "var(--chiller-white)",
  primary: "var(--primary)",
  ok: "var(--status-ok)",
  warn: "var(--status-warn)",
  alert: "var(--status-alert)",
  crit: "var(--status-crit)",
  ai: "var(--status-ai)",
  grid: "var(--grid-line)",
  muted: "var(--muted-foreground)",
};

export const tooltipStyle: any = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--glass-border)",
  borderRadius: 14,
  fontSize: 12,
  color: "var(--foreground)",
  boxShadow: "0 20px 70px oklch(0 0 0 / 0.48), 0 0 28px oklch(0.78 0.2 220 / 0.12)",
  backdropFilter: "blur(18px) saturate(150%)",
};