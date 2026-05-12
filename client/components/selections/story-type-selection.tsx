import Image from "next/image";
import Selection from "./selection";

export type TargetStoryType = "manga" | "light_novel" | null;

interface StoryStatusSelectionProps {
  className?: string;

  require?: boolean;

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
        <Image src={"/story-type/light_novel.png"} className="w-8 aspect-square" alt="Light Novel" fill></Image>
        <p>Light Novel</p>
      </div>
    ),
    code: "light_novel",
    isChecked: false,
  },
];

export default function StoryTypeSelection({ className, require, defaultValue, onChange, onReset }: StoryStatusSelectionProps) {
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
      label={
        <div className="flex flex-row gap-1">
          <p>Loại truyện</p>
          {require && <span className="text-red-500">*</span>}
        </div>
      }
      options={TYPE.map((type) => type.label)}
      defaultIndex={defaultIndex === -1 ? null : defaultIndex}
      onChange={handleChange}
      onReset={onReset ? handleReset : undefined}
    ></Selection>
  );
}
