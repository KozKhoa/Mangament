import NavBar from "@/components/layouts/navbar";
import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";

// app/(auth)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row w-full h-full">
      <NavBar className="fixed left-2.5 right-2.5" autoHide={false}></NavBar>

      <AdminSidebar className=""></AdminSidebar>

      <div className="h-[6000px] bg-blue-300 w-full mt-16 px-10">{children}</div>
    </div>
  );
}
