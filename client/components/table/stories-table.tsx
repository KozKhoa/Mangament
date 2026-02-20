import Story from "@/types/story";
import { CSSProperties, useEffect, useState } from "react";
import Switch from "../switchs/switch";

import DeleteIcon from "@/public/delete.svg";
import EditIcon from "@/public/edit/edit.svg";
import EyeIcon from "@/public/eye/open.svg";
import StarIcon from "@/public/star.svg";

import Loading from "../loadings/loading";
import NoContent from "../cards/no-content";
import { Pagination } from "@/types/pagination";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import adminService from "@/services/admin";
import { toast } from "sonner";
import { modal } from "../modal/modal.store";
import StoryStatusTag from "../tags/story-status-tag";
import StoryTypeTag from "../tags/story-type-tag";
import { roundTo } from "@/utils/math";
import Link from "next/link";
import Image from "next/image";

export interface StoriesTableProps {
  className?: string;

  data: Story[];
  pagination?: Pagination;
}

function TD({ className, children, style }: { className?: string; children?: React.ReactNode | React.ReactNode[]; style?: CSSProperties }) {
  return (
    <td style={style} className={`text-start px-5 py-1 ${className}`}>
      {children}
    </td>
  );
}

export default function StoriesTable({ className, data, pagination }: StoriesTableProps) {
  const [stories, setStories] = useState<Story[]>([]);

  const [processDeleteStory, setProcessingDeleteStory] = useState<Set<Story>>(new Set<Story>());
  const [processActiveStory, setProcessingActiveStory] = useState<Set<Story>>(new Set<Story>());

  // call api for delete story, a modal will appear to reconfirm your decision
  async function deleteStory(story: Story) {
    modal.open("confirm", {
      title: `Xác nhận xóa ?`,
      content: (
        <div>
          <p>
            <span className="font-semibold">Title:</span> {story.title}
          </p>
          <Image
            className="w-64 m-auto my-1 rounded-sm"
            src={story?.cover_art?.url.includes("https") ? story?.cover_art?.url : process.env.NEXT_PUBLIC_API_URL + "uploads/story/" + story?.cover_art?.url}
            alt="Cover art"
            width={300}
            height={300}
          ></Image>
        </div>
      ),

      onConfirm: async () => {
        setProcessingDeleteStory((prev) => {
          const next = new Set(prev);
          next.add(story);
          return next;
        });

        const res = await adminService.deleteStory(story.id);

        setProcessingDeleteStory((prev) => {
          const next = new Set(prev);
          next.delete(story);
          return next;
        });

        if (!res.success) return toast.warning(res.message);

        toast.message(`Xóa "${story.title}" thành công`);
        setStories((prevStories) => prevStories.filter((prevStory) => prevStory !== story));
      },
    });
  }

  async function toggleActiveStory(story: Story, isActived: boolean) {
    setProcessingActiveStory((prev) => {
      const next = new Set(prev);
      next.add(story);
      return next;
    });

    const res = await adminService.activeStory({ storyId: story.id, isActived: isActived });

    setProcessingActiveStory((prev) => {
      const next = new Set(prev);
      next.delete(story);
      return next;
    });

    if (!res.success) return toast.warning(res.message);

    setStories((prev) => {
      const next = [...prev];
      const index = next.indexOf(story);
      next[index].is_actived = isActived;
      return next;
    });

    return toast.message(`${isActived ? "Active" : "Deactive"} ${story.title} thành công`);
  }

  useEffect(() => {
    setStories(data);
  }, [data]);

  return (
    <div className={` rounded-lg  overflow-hidden bg-background-items ${className}`}>
      {stories.length > 0 ? (
        <table className="w-full rounded-lg ">
          <colgroup>
            <col className="border-r border-foreground/10 " />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-r border-l border-foreground/10" />
            <col className="border-l border-foreground/10" />
          </colgroup>
          <thead className="bg-black/10 text-[1.2em] text-foreground/80 rounded-lg overflow-hidden">
            <tr>
              <th>Cover art</th>
              <th>Title</th>
              <th>View</th>
              <th>Star</th>
              <th>Status</th>
              <th>No. Children</th>
              <th>Type</th>
              <th>Nation</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {stories.map((story, i) => (
              <tr key={story.id} className={`hover:bg-foreground/5 ${i % 2 === 0 ? "" : "bg-foreground/2"}`}>
                <TD>
                  <Link href={`/stories/${story.type}/${story.title}`}>
                    <Image
                      className="w-24 m-auto my-1 hover:w-48 duration-200 rounded-sm"
                      src={story.cover_art?.url}
                      alt={story.title}
                      width={500}
                      height={500}
                    ></Image>
                  </Link>
                </TD>
                <TD>{story.title}</TD>
                <TD>
                  <div className="flex flex-row gap-1.5 justify-start items-center w-fit">
                    <EyeIcon className="w-4.5 h-4.5 text-foreground"></EyeIcon>
                    <p>{story.view}</p>
                  </div>
                </TD>
                <TD>
                  <div className="flex flex-row gap-1.5 justify-start items-center w-fit">
                    <StarIcon className="w-4.5 h-4.5 text-yellow-500"></StarIcon>
                    <p>{roundTo(story.star ?? 0, 1)}</p>
                  </div>
                </TD>
                <TD>
                  <StoryStatusTag status={story.status} className="text-center">
                    {snakeCaseToCapitalizeWord(story.status)}
                  </StoryStatusTag>
                </TD>
                <TD>{story.number_of_children}</TD>
                <TD>
                  <StoryTypeTag storyType={story.type}></StoryTypeTag>
                </TD>

                <TD>{[story.nation?.flag_icon, story.nation?.name].join(" ")}</TD>
                <TD>
                  <Switch
                    defaultValue={story.is_actived}
                    borderWeight={0}
                    roundHeight={22}
                    width={40}
                    height={18}
                    duration={200}
                    loading={processActiveStory.has(story)}
                    onToggle={(isOn) => toggleActiveStory(story, isOn)}
                    className="m-auto"
                  ></Switch>
                </TD>
                <TD>
                  <div className="flex flex-row w-full justify-around items-center">
                    {/* Adjust user info */}
                    <Link href={`/admin/stories-management/edit/${story.id}`} className={`w-5.5 h-5.5 cursor-pointer`}>
                      <EditIcon className="w-full h-full text-foreground/90"></EditIcon>
                    </Link>
                    {/* Delete user */}
                    <div className={`w-6 h-6`}>
                      {processDeleteStory.has(story) ? (
                        <Loading className="w-full h-full"></Loading>
                      ) : (
                        <button onClick={() => deleteStory(story)} className="cursor-pointer">
                          <DeleteIcon className="w-full h-full text-red-600 "></DeleteIcon>
                        </button>
                      )}
                    </div>
                  </div>
                </TD>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <NoContent></NoContent>
      )}
    </div>
  );
}
