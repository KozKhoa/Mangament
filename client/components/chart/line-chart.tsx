import { HTMLAttributes, useEffect, useRef, useState } from "react";

export interface LineChartProps {
  className?: string;

  lineColor?: string;
  value?: { key: string; value: number }[];
  unit?: string;
}

export function Point({
  style,
  className,
  value,
  unit = "",
}: {
  unit?: string;
  className?: string;
  style?: HTMLAttributes<HTMLDivElement>["style"];
  value?: { key: string; value: number };
}) {
  return (
    <div>
      {/* Point */}
      <div
        style={style}
        className={`z-10 w-3 h-3 rounded-full -translate-x-1/2 translate-y-1/2 transition-transform duration-1000 cursor-pointer peer ${className}`}
      >
        {/* Value of at this point */}
        <div className="absolute bottom-2 w-full left-1/2 -translate-x-1/2 text-foreground/40">{value?.value}</div>
      </div>

      {/* Tooltip */}
      <div
        style={style}
        className={`
          absolute -translate-x-1/2 -translate-y-8 hidden peer-hover:flex
          flex-col justify-center items-center z-50 w-fit 
          drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]`}
      >
        <div
          className="w-fit flex flex-col px-5 py-3 pb-5 min-w-52 max-w-96 bg-background gap-1
            [clip-path:polygon(0%_0%,100%_0%,100%_calc(100%-12px),calc(50%+12px)_calc(100%-12px),50%_100%,calc(50%-12px)_calc(100%-12px),0_calc(100%-12px))]"
        >
          <p className="opacity-60 w-fit">{value?.key}</p>
          <div className="flex flex-row gap-1 items-end">
            <p className="font-semibold text-xl">{value?.value}</p>
            <p className="opacity-60">{unit}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LineChart({ className, value, lineColor = "#1f3eb6", unit = "" }: LineChartProps) {
  const arrRef = useRef(Array.from({ length: 11 }));
  let max = 0;

  if (value && value.length > 0) {
    const maxValue = Math.max(...(value?.map((v) => v.value ?? 0) ?? [])) ?? 0;
    max = maxValue + 10 - (maxValue % 10);
  }

  const [path, setPath] = useState<string>("");

  function buildPoints(values: { key: string; value: number }[]) {
    const points: { x: number; y: number }[] = [];

    const size = values.length;

    let i = 0;
    for (const v of values) {
      const x = (i * 1100) / size;
      const y = 1100 - (v.value * 1000) / max;

      points.push({ x: x, y: y });

      i++;
    }

    return points;
  }

  function buildPath(points: { x: number; y: number }[]) {
    if (!points || points.length <= 0) return "";

    let d = `M ${points[0].x} ${points[0].y}`;
    const t = 0.25; // tension

    for (let i = 1; i < points.length; i++) {
      const p0 = points[i - 1];
      const p1 = points[i];

      const dx = p1.x - p0.x;

      const cx1 = p0.x + dx * t;
      const cx2 = p1.x - dx * t;

      d += ` C ${cx1} ${p0.y}, ${cx2} ${p1.y}, ${p1.x} ${p1.y}`;
      // d += ` L ${p1.x} ${p1.y}`;
    }

    return d;
  }

  useEffect(() => {
    const points = buildPoints(value ?? []) ?? [];
    const path = buildPath(points ?? []);

    setPath(path);
  }, [value]);

  return (
    <div className="bg-background-items px-1 md:px-2 lg:px-5 py-1">
      {/* Toàn bộ biểu đồ */}
      <div className="flex flex-row gap-8">
        {/* Range value in left */}
        <div className="flex flex-col justify-between items-center">
          {arrRef.current.map((v, i) => (
            <div key={i} className="h-full flex items-end">
              <p className="text-foreground/60 peer cursor-default w-fit">{((max / 10) * (11 - i - 1)).toString()}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className={`relative w-full transition-all duration-300 ${className}`}>
          {/* Points */}
          <div className="absolute bottom-0 left-0 w-full h-full flex flex-row justify-between items-end transition-all duration-300">
            {value?.map((v, i) => (
              <div key={i} className="h-full w-full transition-all duration-300">
                <Point
                  style={{
                    position: "absolute",
                    bottom: `${((v.value ?? 0) / max) * 90}%`,
                  }}
                  className={`${value.length <= 1 ? "bg-blue-800" : ""} `}
                  unit={unit}
                  value={value?.at(i)}
                ></Point>
              </div>
            ))}
          </div>

          {/* Line */}
          <div className="absolute bottom-0 left-0 w-full h-full flex">
            <svg viewBox="0 0 1100 1100" preserveAspectRatio="none" className="w-full h-full">
              <path
                // vectorEffect="non-scaling-stroke"
                key={path}
                d={path}
                fill="none"
                strokeWidth={4}
                stroke={lineColor}
                pathLength={1}
                className="line-animate"
              />
            </svg>
          </div>

          {/* Background */}
          <div className="absolute top-0 -left-5 w-full h-full flex flex-col items-end">
            {arrRef.current.map((v, i) => (
              <div key={i} className="text-start w-full border-b border-foreground/10 h-full hover:border-foreground/30"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
