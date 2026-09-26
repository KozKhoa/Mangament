// This context use to store information
"use client";

import { createContext, useContext, useEffect, useState } from "react";

import { DashboardOverview } from "@/types/dashboard";
import adminService from "@/services/admin";
import { toast } from "sonner";

interface AdminContextProps {
  overview?: DashboardOverview;
  loading?: boolean;
}

const AdminContext = createContext<AdminContextProps>({});

export const AdminProvider = ({ children }: { children: React.ReactNode }) => {
  const [loading, setLoading] = useState(true);

  const [overview, setOverview] = useState<DashboardOverview>();

  useEffect(() => {
    async function fetchOveriew() {
      setLoading(true);
      const res = await adminService.getOverview();
      setLoading(false);

      if (!res.success) return toast.warning(res.message);

      setOverview(res.data);
    }

    fetchOveriew();
  }, []);

  return <AdminContext.Provider value={{ overview, loading }}>{children}</AdminContext.Provider>;
};

export default function useAdmin() {
  const context = useContext(AdminContext);
  return context;
}
