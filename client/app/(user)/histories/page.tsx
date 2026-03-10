import { redirect } from "next/navigation";
import { HistoriesPage } from "./HistoryPage";

export const metadata = {
  title: "Lịch sử",
};

export default async function Page({ searchParams }: { searchParams: { page?: string } }) {
  if (!(await searchParams).page) {
    redirect("?page=1");
  } else {
    return <HistoriesPage />;
  }
}
