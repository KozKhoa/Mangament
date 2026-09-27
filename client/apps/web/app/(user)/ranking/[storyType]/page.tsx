import { snakeCaseToCapitalizeWord } from "@/utils/string";
import RankingStoryPage from "./RankingStoryPage";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { storyType: string } }) {
  return {
    title: `Xếp hạng - ${snakeCaseToCapitalizeWord((await params).storyType)}`,
  };
}

export default async function Page({ searchParams }: { searchParams: { page?: string; rankBy?: string } }) {
  if (!(await searchParams).page || !(await searchParams).rankBy) {
    redirect("?page=1&rankBy=hottest");
  } else {
    return <RankingStoryPage />;
  }
}
