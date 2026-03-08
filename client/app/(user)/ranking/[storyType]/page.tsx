import { snakeCaseToCapitalizeWord } from "@/utils/string";
import RankingStoryPage from "./RankingStoryPage";

export async function generateMetadata({ params }: { params: { storyType: string } }) {
  return {
    title: `Xếp hạng - ${snakeCaseToCapitalizeWord((await params).storyType)}`,
  };
}

export default function Page() {
  return <RankingStoryPage />;
}
