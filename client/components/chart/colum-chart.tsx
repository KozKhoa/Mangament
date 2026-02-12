import { group } from "console";
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

  height?: number;
}

export interface ColumnProps {
  className?: string;
  style?: HTMLAttributes<HTMLDivElement>["style"];

  unit?: string;
  groupName: string;
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

export function Column({ className, groupName, datas, labels, style, colors, unit = "", maxValue, maxHeight }: ColumnProps) {
  return (
    <div className={`flex flex-row gap-px lg:gap-0.5 rounded-t-md items-end relative w-full ${className}`}>
      {datas?.map((d, i) => (
        <div key={i} className="relative peer">
          {/* Column */}
          <div
            style={{ ...{ backgroundColor: colors?.[i], height: (d / maxValue) * maxHeight }, ...style }}
            className="w-3 sm:w-4 md:w-5 lg:w-10 xl:w-12 rounded-t-sm bottom-0 peer"
          >
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
              className="w-fit flex flex-col px-5 py-3 pb-5 min-w-52 max-w-96 bg-background gap-px
            [clip-path:polygon(0%_0%,100%_0%,100%_calc(100%-12px),calc(50%+12px)_calc(100%-12px),50%_100%,calc(50%-12px)_calc(100%-12px),0_calc(100%-12px))]"
            >
              {/* <div className="flex flex-row gap-2"></div> */}
              <p className="font-bold text-start text-foreground/70">{groupName}</p>
              <p className="text-foreground/60">{labels.at(i)}</p>
              <p className="font-semibold text-xl">{datas?.at(i)}</p>
              <p className="opacity-60">{unit}</p>
            </div>
          </div>
        </div>
      ))}

      {/* Note group name for col */}
      <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-full w-full
          text-foreground/80 peer-hover:text-foreground peer-hover:font-semibold"
      >
        <p className="w-full line-clamp-2 text-start">{groupName}</p>
      </div>
    </div>
  );
}

export default function ColumnChart({ className, data, height = 500 }: ColumnChartProps) {
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
      <div className="flex flex-row gap-7 pb-14">
        {/* Range value in left */}
        <div className="flex flex-col justify-between items-center">
          {arrRef.current.map((v, i) => (
            <div key={i} className="h-full flex items-end">
              <p className="text-foreground/60 peer cursor-default w-fit">{(maxValue / 10) * (11 - i - 1)}</p>
            </div>
          ))}
        </div>

        {/* Chart */}
        <div className="w-full flex flex-col gap-1 ">
          <div
            ref={chartRef}
            style={{ height: height }}
            className={`relative w-full transition-all duration-300
            flex flex-col justify-end  pr-1 md:pr-2 lg:pr-5
            ${className}`}
          >
            {/* Column */}
            <div className="flex flex-row gap-2 md:gap-3.5 lg:gap-5 w-full justify-between z-1">
              {datasets.current.map((data, i) => {
                return (
                  <Column
                    key={i}
                    groupName={data.key}
                    labels={data.labels}
                    datas={data.values}
                    colors={data.colors}
                    maxValue={maxValue + (maxValue - max.current)}
                    maxHeight={chartRef.current?.offsetHeight ?? height}
                  ></Column>
                );
              })}
            </div>

            {/* Background */}
            <div className="absolute top-0 -left-4 w-full h-full flex flex-col items-end">
              {arrRef.current.map((v, i) => (
                <div key={i} className="text-start w-full border-b border-foreground/10 h-full"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
