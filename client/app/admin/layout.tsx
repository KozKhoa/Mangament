import NavBar from "@/components/layouts/navbar";
import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";
import { AdminProvider } from "@/contexts/AdminContext";

// app/(auth)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
      <div className="flex flex-row w-full h-full ">
        <NavBar className="fixed left-2.5 right-2.5" autoHide={false}></NavBar>

        <AdminSidebar></AdminSidebar>

        <div className="max-w-[2000px] m-auto mt-16 px-2 md:px-10 w-full bg-background ">
          {children}

          {/* Footer */}
          <div className="w-full h-96"></div>
        </div>
      </div>
    </AdminProvider>
  );
}
