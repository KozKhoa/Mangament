import AdminSidebar from "@/components/layouts/sidebar/sidebar-admin";

// app/(auth)/layout.tsx
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-row w-full h-full">
      <AdminSidebar></AdminSidebar>

      <div className="h-[6000px] bg-blue-300 w-full">{children}</div>
    </div>
  );
}
