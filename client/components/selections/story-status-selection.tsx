import Selection from "./selection";

import OngoingIcon from "@/public/story-status/ongoing.svg";
import PostponeIcon from "@/public/story-status/postpone.svg";
import FinishIcon from "@/public/story-status/finished.svg";
import UpcomingIcon from "@/public/story-status/upcoming.svg";

export type TargetStoryStatus = "ongoing" | "finished" | "postpone" | "upcoming" | null;

interface StoryStatusSelectionProps {
  className?: string;

  defaultValue?: TargetStoryStatus;

  onChange?: (status: TargetStoryStatus) => void;
}

const STATUS = [
  {
    label: (
      <div className="flex flex-row gap-2 items-center justify-center w-fit">
        <OngoingIcon className="w-5 h-5 stroke-foreground"></OngoingIcon>
        <p>Đang tiếp tục</p>
      </div>
    ),
    code: "ongoing",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-2 items-center justify-center w-fit">
        <FinishIcon className="w-5 h-5 stroke-foreground"></FinishIcon>
        <p>Hoàn thành</p>
      </div>
    ),
    code: "finished",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-2 items-center justify-center w-fit">
        <PostponeIcon className="w-5 h-5 stroke-foreground"></PostponeIcon>
        <p>Trì hoãn</p>
      </div>
    ),
    code: "postpone",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-2 items-center justify-center w-fit">
        <UpcomingIcon className="w-5 h-5 fill-foreground"></UpcomingIcon>
        <p>Sắp ra mắt</p>
      </div>
    ),
    code: "upcoming",
    isChecked: false,
  },
];

export default function StoryStatusSelection({ className, defaultValue, onChange }: StoryStatusSelectionProps) {
  function handleChange(index: number | null) {
    if (index !== null) {
      onChange?.(STATUS[index].code as TargetStoryStatus);
    }
  }

  return (
    <Selection
      className={className}
      label="Tiến độ"
      options={STATUS.map((status) => status.label)}
      defaultIndex={STATUS.findIndex((status) => status.code === defaultValue)}
      onChange={handleChange}
      onReset={handleChange}
    ></Selection>
  );
}
