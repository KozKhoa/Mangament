import { snakeCaseToCapitalizeWord } from "@/utils/string";
import ReadingStoryPage from "./ReadingStoryPage";

export async function generateMetadata({ params }: { params: { title: string; storyType: string; storyNodes: string[] } }) {
  const { storyNodes, title } = await params;

  return {
    title: storyNodes.map((node) => snakeCaseToCapitalizeWord(decodeURIComponent(node))).join("/") + " - " + title,
  };
}

export default function Page() {
  return <ReadingStoryPage />;
}
