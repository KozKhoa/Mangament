import { redirect } from "next/navigation";
import SearchPage from "./SearchPage";

export async function generateMetadata({ searchParams }: { searchParams: { keyword: string } }) {
  return {
    title: `Tìm kiếm - ${(await searchParams).keyword}`,
  };
}

export default async function Page({ searchParams }: { searchParams: { page: string; sort: string; limit: string; keyword: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort || !(await searchParams).limit) {
    redirect("?keyword=" + (await searchParams).keyword + "&page=1&limit=30&sort=updated_at:desc");
  } else {
    return <SearchPage />;
  }
}
