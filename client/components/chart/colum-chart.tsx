import { HTMLAttributes, useEffect, useRef } from "react";

export interface ColumnChartProps {
  className?: string;

  data?: {
    // 'labels' and 'datasets' must have the same length
    // 'keys' and 'datasets.data' must have the same length

    unit?: string;
    labels: string[]; // Label for each group in column. If this is the double column chart, labels length should be 2
    keys: string[]; // Label for each type of column. This is the note like years place below the chart and tell the role of each group of colsZ
    datasets: {
      data: number[]; // Value for each col
      color?: string; // Color for this kind of column
    }[];
  };
}

export interface ColumnProps {
  className?: string;
  style?: HTMLAttributes<HTMLDivElement>["style"];

  unit?: string;
  labels: string[]; // Name for this group of column
  datas: number[];
  colors?: string[];
  maxValue: number;
  maxHeight: number;
}

function findMax(datasets: { data: number[]; [key: string]: any }[]) {
  let max = -Infinity;
  for (const values of datasets) {
    if (values && values.data) {
      for (const value of values.data) {
        if (value > max) max = value;
      }
    }
  }
  return max;
}

export function Column({ className, datas, labels, style, colors, unit = "", maxValue, maxHeight }: ColumnProps) {
  return (
    <div className="flex flex-row gap-px w-full rounded-t-md items-end relative">
      {datas?.map((d, i) => (
        <div key={i} className="relative">
          {/* Column */}
          <div style={{ ...{ backgroundColor: colors?.[i], height: (d / maxValue) * maxHeight }, ...style }} className="w-12 rounded-t-sm bottom-0 peer">
            <p className="absolute top-0 left-1/2 -translate-y-full -translate-x-1/2 text-foreground/60">{d}</p>
          </div>

          {/* Tooltip */}
          <div
            style={style}
            className={`
              absolute -top-6 left-1/2 -translate-x-1/2 -translate-y-full hidden peer-hover:flex
              flex-col justify-center items-center z-50 w-fit 
              drop-shadow-[0_4px_4px_rgba(0,0,0,0.3)]`}
          >
            <div
              className="w-fit flex flex-col px-5 py-3 pb-5 min-w-52 max-w-96 bg-background gap-1
            [clip-path:polygon(0%_0%,100%_0%,100%_calc(100%-12px),calc(50%+12px)_calc(100%-12px),50%_100%,calc(50%-12px)_calc(100%-12px),0_calc(100%-12px))]"
            >
              <p className="opacity-60 w-fit">{labels.at(i)}</p>
              <div className="flex flex-row gap-1 items-end">
                <p className="font-semibold text-xl">{labels?.at(i)}</p>
                <p className="opacity-60">{unit}</p>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ColumnChart({ className, data }: ColumnChartProps) {
  const arrRef = useRef(Array.from({ length: 11 }));

  const max = useRef<number>(findMax(data?.datasets ?? []));
  const maxValue = max.current + 10 - (max.current % 10);

  const chartRef = useRef<HTMLDivElement>(null);

  const datasets = useRef<{ key: string; labels: string[]; values: number[]; colors: string[] }[]>(buildDatasets());
  function buildDatasets() {
    const datasets = [];
    for (let i = 0; i < (data?.datasets?.at(0)?.data.length ?? 0); i++) {
      const key = data?.keys[i] ?? "";
      const labels = data?.labels ?? [];
      const values = data?.datasets.map((d) => d.data[i]) ?? [];
      const colors = data?.datasets.map((d) => d.color ?? "") ?? [];

      datasets.push({ key, labels, values, colors });
    }
    return datasets;
  }

  useEffect(() => {
    max.current = findMax(data?.datasets ?? []);
    datasets.current = buildDatasets();
  }, [data]);

  return (
    <div className="bg-background-items px-1 md:px-2 lg:px-5 py-1">
      {/* Toàn bộ biểu đồ */}
      <div ref={chartRef} className="flex flex-row gap-8">
        {/* Range value in left */}
        <div className="flex flex-col justify-between items-center">
          {arrRef.current.map((v, i) => (
            <div key={i} className="h-full flex items-end">
              <p className="text-foreground/60 peer cursor-default w-fit">{(maxValue / 10) * (11 - i - 1)}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className={`relative w-full transition-all duration-300  ${className}`}>
          {/* Column */}
          <div
            className="flex flex-row gap-5 w-full justify-between z-20
              absolute bottom-0"
          >
            {datasets.current.map((data, i) => {
              return (
                <Column
                  key={i}
                  labels={data.labels}
                  datas={data.values}
                  colors={data.colors}
                  maxValue={maxValue + (maxValue - max.current)}
                  maxHeight={chartRef.current?.offsetHeight ?? 400}
                ></Column>
              );
            })}
          </div>

          {/* Background */}
          <div className="absolute top-0 -left-5 w-full h-full flex flex-col items-end z-10">
            {arrRef.current.map((v, i) => (
              <div key={i} className="text-start w-full border-b border-foreground/10 h-full hover:border-foreground/30"></div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
