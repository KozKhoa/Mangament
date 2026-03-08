import { sum } from "@/utils/math";
import { useRef, useState } from "react";

export interface PieChartProps {
  className?: string;
  strokeWidth?: number;
  values?: { key: string; value: number }[];
  colorsSet?: string[];
}

const COLORS = [
  "#405D5D",
  "#657979",
  "#7A8787",
  "#19394B",
  "#31576D",
  "#50758B",
  "#618499",
  "#7593A6",
  "#A0B1BC",
  "#2A4631",
  "#4D7657",
  "#5A8664",
  "#77A682",
  "#9BC6A4",
  "#C7E3CC",
  "#505441",
  "#5F6351",
  "#7E8075",
  "#8E8F89",
  "#A3A3A3",
  "#C4C4C4",
  "#CCD0D2",
];

function genColor(length: number) {
  const colors: string[] = [];
  for (let i = 0; i < length; i++) {
    colors.push(
      `#${Math.floor(Math.random() * 0xffffff)
        .toString(16)
        .padStart(6, "0")}`,
    );
  }

  return colors;
}

export default function PieChart({ className, values, strokeWidth = 12, colorsSet = [] }: PieChartProps) {
  // Tổng giá trị của biểu đồ tròn
  const total = sum(values?.map((value) => value.value) ?? []);

  // Màu sẽ dùng cho biểu đồ, nếu không có thì dùng mặc định
  const colors = useRef([...colorsSet, ...COLORS, ...genColor(values?.length ?? 0)]);

  const noteRef = useRef<HTMLDivElement[]>([]);
  const pieRef = useRef<SVGCircleElement[]>([]);

  // Dùng để lưu khi có ai đó hover vào trong chú thích hay là hover lên trên phần của biểu đồ tròn thì tô sáng nó lên
  const [hoverPieIndex, setHoverPieIndex] = useState<number | null>(null);

  // mapping dùng để tạo ra mỗt mảng với {mapping[0] = values[0].value; mapping[i] = mapping[i - 1] + values[i].value}
  // vì mỗi key của biểu đồ tròn không phải chỉ chiếm đùng phần của nó mà chiếm toàn bộ phần của key đứng trước cộng với của nó. Chỉ vì key đứng trước nằm trên nên thành ra trông như là chỉ chiếm một phần
  // Cần phải map để biểu đồ hiển thị đúng
  const mapping: number[] = [];
  if (values) {
    mapping.push(values.at(0)?.value ?? 0);
    for (let i = 1; i < values.length; i++) {
      const prev = mapping.at(i - 1) ?? 0;
      mapping.push(prev + (values.at(i)?.value ?? 0));
    }
  }

  // Khi hover lên một phần của biểu đồ thì tô trắng phần đó và làm cho phần chú thích to lên
  function onHoverPieChart(index: number) {
    const note = noteRef?.current?.at(index);
    const pie = pieRef.current.at(index);

    if (note && pie) {
      setHoverPieIndex(index);
      note.style.zIndex = "10";
      note.style.transition = "transform 0.2s ease-in-out";
      note.style.transform = "translateY(-10px)";
      note.style.transform = "scale(1.3) translateX(20px)";

      pie.style.transition = "stroke 0.1s ease-in-out";
      pie.style.stroke = "#ffffff";
    }
  }

  // Không còn hover nữa thì trả về nguyên trạng
  function onUnHoverPieChart(index: number) {
    const note = noteRef?.current?.at(index);
    const pie = pieRef.current.at(index);

    if (note && pie) {
      setHoverPieIndex(null);
      note.style.zIndex = "";
      note.style.transform = "translateY(0px)";

      pie.style.stroke = "";
    }
  }

  // Khi hover lên phần chú thích thì tô trắng phần tương ứng trên biểu đồ tròn
  function onHoverNote(index: number) {
    const note = noteRef?.current?.at(index);
    const pie = pieRef.current.at(index);

    if (note && pie) {
      setHoverPieIndex(index);

      pie.style.transition = "stroke 0.2s ease-in-out";
      pie.style.stroke = "#ffffff";
    }
  }

  // Không còn hover nữa thì trả về nguyên trạng
  function onUnHoverNote(index: number) {
    const note = noteRef?.current?.at(index);
    const pie = pieRef.current.at(index);

    if (note && pie) {
      setHoverPieIndex(null);

      pie.style.stroke = "";
    }
  }

  return (
    <div
      className={`w-full flex flex-row justify-center items-center gap-5
        ${className}`}
    >
      {/* Pie chart */}
      <div className="max-w-[400px] relative">
        <svg viewBox="0 0 100 100" className="-rotate-90 w-full transform scale-y-[-1]" shapeRendering="geometricPrecision">
          {/* Đây là màu nền của biều đồ colors[0] */}
          <circle
            ref={(ref) => {
              if (ref) pieRef.current[0] = ref;
            }}
            cx="50"
            cy="50"
            r={50 - strokeWidth - 0.5} // Bán kính của vòng tròn
            fill="none"
            stroke={colors.current[0]} // Màu của vòng tròn
            strokeWidth={strokeWidth} //  Độ dày của vòng tròn
            onPointerOver={() => onHoverPieChart(0)}
            onPointerOut={() => onUnHoverPieChart(0)}
          />
          {mapping?.map((value, i) => {
            const c = 2 * Math.PI * (50 - strokeWidth);

            return (
              <circle
                ref={(ref) => {
                  if (ref) pieRef.current[i + 1] = ref;
                }}
                key={i}
                cx="50"
                cy="50"
                r={50 - strokeWidth - 0.5} // Bán kính của vòng tròn
                fill="none"
                stroke={colors.current[i + 1]}
                strokeWidth={strokeWidth}
                strokeDasharray={c}
                strokeDashoffset={total === 0 ? 0 : c * (value / total)}
                onPointerOver={() => onHoverPieChart(i + 1)}
                onPointerOut={() => onUnHoverPieChart(i + 1)}
              />
            );
          })}
        </svg>

        {/* Value note at the center of the pie chart */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="flex flex-col">
            <p className="text-foreground/60">{hoverPieIndex !== null ? values?.at(hoverPieIndex)?.key : "Total"}</p>

            {hoverPieIndex !== null ? (
              <>
                <p className="font-semibold text-xl">{values?.at(hoverPieIndex)?.value}</p>
                <p className="text-foreground/70">({(((values?.at(hoverPieIndex)?.value ?? 0) / total) * 100).toFixed(1) + "%"})</p>
              </>
            ) : (
              <p className="font-semibold text-xl">{total}</p>
            )}
          </div>
        </div>
      </div>

      {/* Note */}
      <div className="flex flex-row flex-wrap gap-2 h-full max-w-[400px]">
        {values?.map((value, i) => (
          <div
            key={i}
            ref={(ref) => {
              if (ref) noteRef.current[i] = ref;
            }}
            onPointerOver={() => onHoverNote(i)}
            onPointerOut={() => onUnHoverNote(i)}
            className="flex flex-row gap-2 justify-start items-center min-w-48 cursor-default"
          >
            <div style={{ backgroundColor: colors.current[i] }} className="w-fit h-10 min-w-10 flex justify-center items-center bg-background">
              <p className="font-semibold text-white drop-shadow-lg">{value.value}</p>
            </div>
            <p>{value.key}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
