import Button from "@/components/buttons/button";
import Story from "@/types/story";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Image from "next/image";
import { MouseEvent, MouseEventHandler } from "react";

export default function TrashStoryCard({
  story,
  onRestore,
  onDelete,
  onClick,

  disable = false,

  className,
}: {
  story: Story;
  onRestore?: (story: Story) => void;
  onDelete?: (story: Story) => void;
  onClick?: MouseEventHandler<HTMLDivElement>;

  disable?: boolean;

  className?: string;
}) {
  return (
    <div className={`flex flex-col justify-between gap-3 p-2 bg-background-items rounded-lg ${className}`}>
      <div
        className="flex flex-col gap-2"
        onClick={(e) => {
          !disable && onClick?.(e);
        }}
      >
        <Image
          className="aspect-7/10 object-contain"
          src={story.cover_art.key ? [process.env.NEXT_PUBLIC_CDN_URL, story.cover_art.key].join("/") : (story.cover_art.url ?? "")}
          alt="Cover Art"
          width={250}
          height={300}
        />
        <p className="text-[1.2em] text-start leading-tight font-semibold line-clamp-2">
          {story.nation && (
            <span className="inline-block mr-1.5 align-middle">
              {story.nation.flag_image?.url ? (
                <Image
                  src={story.nation.flag_image.url}
                  alt={story.nation.name}
                  width={20}
                  height={14}
                  className="object-contain inline-block"
                ></Image>
              ) : (
                <span className="text-[1.2rem]">{story.nation.flag_icon}</span>
              )}
            </span>
          )}
          <span className="text-foreground/60">{"[" + snakeCaseToCapitalizeWord(story?.type ?? "") + "] "}</span>
          {story?.title}
        </p>
      </div>

      <div className="flex flex-col justify-between gap-1 font-semibold">
        <Button disable={disable} className="w-full" onClick={() => onRestore?.(story)}>
          Khôi phục
        </Button>
        <Button disable={disable} className="w-full" buttonType="delete" onClick={() => onDelete?.(story)}>
          Xóa
        </Button>
      </div>
    </div>
  );
}
