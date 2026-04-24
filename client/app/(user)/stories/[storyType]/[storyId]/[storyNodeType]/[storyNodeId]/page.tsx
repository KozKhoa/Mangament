import { snakeCaseToCapitalizeWord } from "@/utils/string";
import storyService from "@/services/story";
import storyNodeService from "@/services/story-node";
import ReadingStoryPage from "./ReadingStoryPage";

export async function generateMetadata({ params }: { params: { storyType: string; storyId: string; storyNodeType: string; storyNodeId: string } }) {
  const storyId = (await params).storyId;
  const storyNodeId = (await params).storyNodeId;

  const storyRes = await storyService.getStoryById(storyId, { isGettingChildren: false, isGettingSummary: false });
  if (!storyRes.success || !storyRes.data) return;

  const story = storyRes.data;

  const storyNodeRes = await storyNodeService.getStoryNodeById(storyNodeId, { isGettingContent: false });
  if (!storyNodeRes.success || !storyNodeRes.data) return;

  const storyNode = storyNodeRes.data;

  return {
    title: `${snakeCaseToCapitalizeWord(storyNode.type)} ${storyNode?.order_index} - ${story?.title}`,
    description: story?.summary,
    openGraph: {
      title: `${snakeCaseToCapitalizeWord(storyNode.type)} ${storyNode?.order_index} - ${story?.title}`,
      description: story?.summary,
      images: story?.cover_art?.key ? [process.env.NEXT_PUBLIC_CDN_URL, story.cover_art.key].join("/") : "",
    },
  };
}

export default function Page() {
  return <ReadingStoryPage />;
}
