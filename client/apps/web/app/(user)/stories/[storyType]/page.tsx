import { snakeCaseToCapitalizeWord } from "@/utils/string";
import StoriesPage from "./StoriesPage";

import { redirect } from "next/navigation";

export async function generateMetadata({ params }: { params: { storyType: string } }) {
  return {
    title: snakeCaseToCapitalizeWord((await params).storyType),
  };
}

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort) {
    redirect("?page=1&sort=updated_at:desc");
  } else {
    return <StoriesPage />;
  }
}
