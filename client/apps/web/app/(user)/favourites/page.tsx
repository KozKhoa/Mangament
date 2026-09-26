import { redirect } from "next/navigation";
import FavouritePage from "./FavouritePage";

const LIMIT = 30;

export const metadata = {
  title: "Truyện yêu thích",
};

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string; limit?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort || !(await searchParams).limit) {
    redirect("?page=1&limit=30&sort=created_at:desc");
  }

  return <FavouritePage />;
}
