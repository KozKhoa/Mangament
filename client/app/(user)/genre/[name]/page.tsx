import { snakeCaseToCapitalizeWord } from "@/utils/string";
import StoryGenreListPage from "./StoryGenreListPage";

export async function generateMetadata({ params }: { params: { name: string } }) {
  return {
    title: snakeCaseToCapitalizeWord((await params).name),
  };
}

export default function Page() {
  return <StoryGenreListPage />;
}
