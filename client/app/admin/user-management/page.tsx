import { redirect } from "next/navigation";
import UserManagement from "./UserManagementPage";

export default async function Page({ searchParams }: { searchParams: { page?: string; sort?: string } }) {
  if (!(await searchParams).page || !(await searchParams).sort) {
    redirect("?page=1&sort=join_date:desc");
  } else {
    return <UserManagement />;
  }
}
