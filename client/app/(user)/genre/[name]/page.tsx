import { snakeCaseToCapitalizeWord } from "@/utils/string";
import StoryGenreListPage from "./StoryGenreListPage";
import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { name: string } }) {
  return {
    title: snakeCaseToCapitalizeWord((await params).name),
  };
}

export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
  if (!(await searchParams).page) {
    redirect("?page=1");
  } else {
    return <StoryGenreListPage />;
  }
}
