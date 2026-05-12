import History from "@/types/history";
import HistoryCard from "../cards/history-card";

import InfinityScrollHorizontalList from "./infinity-scroll-horizontal-list";

interface StoryListProps {
  histories?: History[];

  label?: string;
  onClickLabel?: () => void;
  onScrollToEnd?: () => void;
  onRemoveElement?: (history: History) => void;

  className?: string;
}

export default function HistoryList({ label = "Lịch sử đọc", onClickLabel, onScrollToEnd, onRemoveElement, histories, className }: StoryListProps) {
  return (
    <div className={` flex flex-col justify-center items-center w-full ${className}`}>
      <h2 onClick={() => onClickLabel?.()} className="text-[2em] font-bold cursor-pointer border-b-2">
        {label}
      </h2>

      <InfinityScrollHorizontalList onScrollToEnd={onScrollToEnd} isLoading={histories === null} isNoContent={histories ? histories.length <= 0 : true}>
        {histories?.map((history, i) => (
          <div key={i} className="px-1 h-full">
            <HistoryCard history={history} onClickRemove={() => onRemoveElement?.(history)}></HistoryCard>
          </div>
        ))}
      </InfinityScrollHorizontalList>
    </div>
  );
}
