import { useId } from "react";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const palette: Record<string, string> = {
  ok: "var(--status-ok)",
  info: "var(--status-info)",
  warn: "var(--status-warn)",
  alert: "var(--status-alert)",
  crit: "var(--status-crit)",
  ai: "var(--status-ai)",
  default: "var(--primary)",
  blue: "var(--chiller-blue)",
  red: "var(--chiller-red)",
  white: "var(--chiller-white)",
};

export function Sparkline({
  data,
  tone = "default",
  height = 36,
}: {
  data: { i: number; v: number }[];
  tone?: keyof typeof palette;
  height?: number;
}) {
  const color = palette[tone] ?? palette.default;
  const id = useId().replace(/:/g, "-");
  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <AreaChart data={data} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.35} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.75} fill={`url(#${id})`} dot={false} isAnimationActive={false} style={{ filter: `drop-shadow(0 0 6px ${color}) drop-shadow(0 0 12px ${color})` }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}