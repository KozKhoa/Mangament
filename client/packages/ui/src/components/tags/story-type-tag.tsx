import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Tag from "./tag";

function mapping(storyType: string) {
  if (storyType === "manga") return "bg-[#32533d]! text-white!";
  if (storyType === "light_novel") return "bg-[#DBBBF5]! text-black!";
  return "red";
}

export default function StoryTypeTag({ className, storyType }: { className?: string; storyType: string }) {
  return (
    <Tag
      className={`text-center
        ${mapping(storyType)} 
        ${className}`}
    >
      {snakeCaseToCapitalizeWord(storyType ?? "")}
    </Tag>
  );
}
