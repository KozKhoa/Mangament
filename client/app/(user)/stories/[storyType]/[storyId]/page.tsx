import storyService from "@/services/story";
import StoryDetailPage from "./StoryDetailPage";

export async function generateMetadata({ params }: { params: { storyType: string; storyId: string } }) {
  const storyId = (await params).storyId;

  const res = await storyService.getStoryById(storyId, { isGettingChildren: false, isGettingSummary: false });
  if (!res.success || !res.data) return;

  const story = res.data;

  return {
    title: story?.title,
    description: story?.summary,
    openGraph: {
      title: story?.title,
      description: story?.summary,
      images: story?.cover_art?.key ? [process.env.NEXT_PUBLIC_CDN_URL, story.cover_art.key].join("/") : "",
    },
  };
}

export default async function Page() {
  return <StoryDetailPage />;
}
