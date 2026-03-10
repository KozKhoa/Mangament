import StoryDetailPage from "./StoryDetailPage";

export async function generateMetadata({ params }: { params: { title: string; storyType: string; storyNodes: string[] } }) {
  return {
    title: decodeURIComponent((await params).title),
  };
}

export default function Page() {
  return <StoryDetailPage />;
}
