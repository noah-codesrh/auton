import type { TreasuryTimePoint } from "../lib/treasury/types";

type TreasuryAreaChartProps = {
  data: TreasuryTimePoint[];
  color: string;
  gradientId: string;
  stepped?: boolean;
  theme?: "light" | "dark";
};

function buildLinePath(
  points: { x: number; y: number }[],
  stepped: boolean,
): string {
  if (points.length === 0) return "";

  if (!stepped) {
    return points
      .map((point, index) =>
        `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`,
      )
      .join(" ");
  }

  let path = `M ${points[0].x} ${points[0].y}`;
  for (let index = 1; index < points.length; index += 1) {
    const prev = points[index - 1];
    const current = points[index];
    path += ` L ${current.x} ${prev.y} L ${current.x} ${current.y}`;
  }
  return path;
}

export function TreasuryAreaChart({
  data,
  color,
  gradientId,
  stepped = false,
  theme = "light",
}: TreasuryAreaChartProps) {
  const width = 320;
  const height = 140;
  const paddingX = 8;
  const paddingY = 12;
  const innerWidth = width - paddingX * 2;
  const innerHeight = height - paddingY * 2;
  const maxValue = Math.max(...data.map((point) => point.value), 1);
  const gridStroke = theme === "light" ? "black" : "white";
  const labelClass =
    theme === "light" ? "text-black/35" : "text-white/30";

  const points = data.map((point, index) => {
    const x =
      paddingX +
      (index / Math.max(data.length - 1, 1)) * innerWidth;
    const y =
      paddingY +
      innerHeight -
      (point.value / maxValue) * innerHeight;
    return { x, y };
  });

  const linePath = buildLinePath(points, stepped);
  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
      : "";

  const xLabels = data.length
    ? [data[0], data[Math.floor(data.length / 2)], data[data.length - 1]]
    : [];

  return (
    <div className="relative h-44 w-full">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-full w-full"
        preserveAspectRatio="none"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.35" />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </linearGradient>
        </defs>

        {[0.25, 0.5, 0.75].map((ratio) => {
          const y = paddingY + innerHeight * ratio;
          return (
            <line
              key={ratio}
              x1={paddingX}
              y1={y}
              x2={width - paddingX}
              y2={y}
              stroke={gridStroke}
              strokeOpacity={0.06}
            />
          );
        })}

        {areaPath ? (
          <>
            <path d={areaPath} fill={`url(#${gradientId})`} />
            <path
              d={linePath}
              fill="none"
              stroke={color}
              strokeWidth="1.5"
              vectorEffect="non-scaling-stroke"
            />
          </>
        ) : (
          <line
            x1={paddingX}
            y1={height - paddingY}
            x2={width - paddingX}
            y2={height - paddingY}
            stroke={gridStroke}
            strokeOpacity={0.12}
          />
        )}
      </svg>

      {xLabels.length > 0 && (
        <div
          className={`pixel-sans mt-2 flex justify-between text-[10px] ${labelClass}`}
        >
          {xLabels.map((point) => (
            <span key={point.date}>{point.label}</span>
          ))}
        </div>
      )}
    </div>
  );
}
