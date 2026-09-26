import { redirect } from "next/navigation";
import StoriesManagementPage from "./StoriesManagementPage";

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string; limit?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort || !(await searchParams).limit) {
    redirect("?page=1&limit=20&sort=updated_at:desc");
  } else {
    return <StoriesManagementPage />;
  }
}
