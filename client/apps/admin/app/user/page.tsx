import { redirect } from "next/navigation";
import UserManagement from "./UserManagementPage";

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string; limit?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort || !(await searchParams).limit) {
    redirect("?page=1&limit=20&sort=join_date:desc");
  } else {
    return <UserManagement />;
  }
}
