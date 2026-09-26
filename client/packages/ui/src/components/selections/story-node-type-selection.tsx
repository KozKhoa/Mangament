import Selection from "./selection";

export type TargetStoryNodeType = "chapter" | "volume" | "arc" | null;

interface StoryNodeTypeSelectionProps {
  className?: string;

  defaultValue?: TargetStoryNodeType | null;

  onChange?: (type: TargetStoryNodeType) => void;

  onReset?: (type: TargetStoryNodeType) => void;
}

const TYPE = [
  {
    label: (
      <div className="flex flex-row gap-3.5 items-center justify-center w-fit">
        <p>Chapter</p>
      </div>
    ),
    code: "chapter",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-3.5 items-center justify-center w-fit">
        <p>Volume</p>
      </div>
    ),
    code: "volume",
    isChecked: false,
  },
  {
    label: (
      <div className="flex flex-row gap-3.5 items-center justify-center w-fit">
        <p>Arc</p>
      </div>
    ),
    code: "arc",
    isChecked: false,
  },
];

export default function StoryNodeTypeSelection({ className, defaultValue = null, onChange, onReset }: StoryNodeTypeSelectionProps) {
  function handleChange(index: number | null) {
    if (index !== null) {
      onChange?.(TYPE[index].code as TargetStoryNodeType);
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
