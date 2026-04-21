import HeaderBar from "@/components/layouts/header";
import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";
import { AdminProvider } from "@/contexts/AdminContext";
import { Suspense } from "react";

// app/(admin)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense>
      <AdminProvider>
        <div className="flex flex-row w-full h-fit ">
          <HeaderBar className="fixed left-2.5 right-2.5 z-40" autoHide={false} />

          <AdminSidebar />

          <div className="max-w-[2000px] m-auto mt-16 px-2 md:px-10 w-full bg-background ">
            {children}

            {/* Footer */}
            <div className="w-full h-96"></div>
          </div>
        </div>
      </AdminProvider>
    </Suspense>
  );
}
