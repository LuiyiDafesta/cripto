import { cn } from "@/lib/utils";

interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  strokeWidth?: number;
  positive?: boolean;
  fill?: boolean;
}

export const Sparkline = ({
  values,
  width = 100,
  height = 28,
  strokeWidth = 1.5,
  positive,
  fill = true,
  className,
}: SparklineProps) => {
  if (!values || values.length < 2) {
    return <div className={cn("text-muted-foreground/30 text-xs", className)} style={{ width, height }} />;
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pts = values
    .map((v, i) => `${(i * stepX).toFixed(2)},${(height - ((v - min) / range) * height).toFixed(2)}`)
    .join(" ");
  const last = values[values.length - 1];
  const first = values[0];
  const up = positive ?? last >= first;
  const stroke = up ? "hsl(var(--bull))" : "hsl(var(--bear))";
  const fillStroke = up ? "hsl(var(--bull) / 0.18)" : "hsl(var(--bear) / 0.18)";
  const id = `sl-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <svg className={className} width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={id} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={fillStroke} />
          <stop offset="100%" stopColor="transparent" />
        </linearGradient>
      </defs>
      {fill && (
        <polygon points={`0,${height} ${pts} ${width},${height}`} fill={`url(#${id})`} />
      )}
      <polyline points={pts} fill="none" stroke={stroke} strokeWidth={strokeWidth} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
};
