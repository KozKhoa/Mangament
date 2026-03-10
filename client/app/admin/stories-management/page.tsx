import { redirect } from "next/navigation";
import StoriesManagementPage from "./StoriesManagementPage";

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort) {
    redirect("?page=1&sort=updated_at:desc");
  } else {
    return <StoriesManagementPage />;
  }
}
