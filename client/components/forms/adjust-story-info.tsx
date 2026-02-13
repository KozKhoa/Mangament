import Story from "@/types/story";
import { useEffect, useState } from "react";
import Input from "./input";

export interface AdjustStoryInfoProp {
  className?: string;

  story: Story;
  onConfirm?: (newStory: Story) => void;
  onCancle?: () => void;
}

export default function AdjustStoryInfo({ className, story, onCancle, onConfirm }: AdjustStoryInfoProp) {
  const [editedStory, setEditedStory] = useState(story);

  //   const [title, setTitle] = useState<string>(story.title)
  //   const [nation, setNation] = useState<string>(story?.nation ?? '')
  //   const [storyType, setStoryType] = useState<string>(story.type)
  //   const [storyStatus, setStoryStatus] = useState<string>(story.status)
  //   const [genres, setGenres] = useState<string[]>([]);

  function setTitle(title: string) {
    setEditedStory((prev) => {
      const next = { ...prev };
      next.title = title;
      return next;
    });
  }

  useEffect(() => {
    setEditedStory(story);
  }, [story]);

  return (
    <div className="flex flex-col gap-2 min-w-[350px]">
      <p className="text-xl font-semibold m-auto">{story.title}</p>

      <Input label="Title" placeHolder={story.title} defaultValue={story.title} onChange={setTitle}></Input>
      <Input label="Title" placeHolder={story.title} defaultValue={story.title} onChange={setTitle}></Input>
    </div>
  );
}
