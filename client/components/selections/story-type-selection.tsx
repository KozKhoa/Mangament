import Selection from "./selection";

import OngoingIcon from "@/public/story-status/ongoing.svg";
import PostponeIcon from "@/public/story-status/postpone.svg";
import FinishIcon from "@/public/story-status/finished.svg";
import UpcomingIcon from "@/public/story-status/upcoming.svg";

export type TargetStoryType = "manga" | "light_novel" | null;

interface StoryStatusSelectionProps {
  className?: string;

  defaultValue?: TargetStoryType;

  onChange?: (status: TargetStoryType) => void;

  onReset?: (status: TargetStoryType) => void;
}

const TYPE = [
  {
    label: (
      <div className="flex flex-row gap-3.5 items-center justify-center w-fit">
        {/* <OngoingIcon className="w-5 h-5 stroke-foreground"></OngoingIcon> */}
        <img src={"/story-type/manga.png"} className="w-8 aspect-square"></img>
        <p>Manga</p>
      </div>
    ),
    code: "manga",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-3.5 items-center justify-center w-fit">
        <img src={"/story-type/light_novel.png"} className="w-8 aspect-square"></img>
        <p>Light Novel</p>
      </div>
    ),
    code: "light_novel",
    isChecked: false,
  },
];

export default function StoryTypeSelection({ className, defaultValue, onChange, onReset }: StoryStatusSelectionProps) {
  function handleChange(index: number | null) {
    if (index !== null) {
      onChange?.(TYPE[index].code as TargetStoryType);
    }
  }

  function handleReset(index: number | null) {
    handleChange(index);
  }

  const defaultIndex = TYPE.findIndex((type) => type.code === defaultValue);

  return (
    <Selection
      className={className}
      label="Loại truyện"
      options={TYPE.map((type) => type.label)}
      defaultIndex={defaultIndex === -1 ? null : defaultIndex}
      onChange={handleChange}
      onReset={onReset ? handleReset : undefined}
    ></Selection>
  );
}
