import { redirect } from "next/navigation";
import { ImageTrashPage } from "./ImageTrashPage";

export default async function Page({ searchParams }: { searchParams: { page?: string; limit?: string } }) {
  if (!(await searchParams).page || !(await searchParams).limit) {
    redirect("?page=1&limit=20");
  }

  return <ImageTrashPage />;
}
