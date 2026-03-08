import { snakeCaseToCapitalizeWord } from "@/utils/string";
import StoriesPage from "./StoriesPage";

export async function generateMetadata({ params }: { params: { storyType: string } }) {
  return {
    title: snakeCaseToCapitalizeWord((await params).storyType),
  };
}

export default function Page() {
  return <StoriesPage />;
}
