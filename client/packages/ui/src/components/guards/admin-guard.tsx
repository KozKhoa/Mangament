"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import useAuth from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const auth = useAuth();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003";

  // Skip auth check for auth callback route
  const isAuthCallback = pathname?.startsWith("/auth");

  const isLoading = auth?.loading;
  const user = auth?.user;

  useEffect(() => {
    if (isAuthCallback || redirecting) return;

    if (!isLoading) {
      const currentUrl = typeof window !== "undefined" ? window.location.href : "";
      const loginUrl = `${authUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;

      if (!user) {
        setRedirecting(true);
        toast.warning("Yêu cầu đăng nhập tài khoản quản trị viên để tiếp tục");
        window.location.href = loginUrl;
        return;
      }

      if (user.role !== "admin") {
        setRedirecting(true);
        toast.warning("Tài khoản của bạn không có quyền truy cập trang quản trị");
        window.location.href = loginUrl;
        return;
      }
    }
  }, [user, isLoading, isAuthCallback, redirecting, authUrl]);

  if (isAuthCallback) {
    return <>{children}</>;
  }

  if (isLoading || redirecting || !user || user.role !== "admin") {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-4 border-foreground/20 border-t-foreground rounded-full animate-spin"></div>
          <p className="text-foreground/70 font-medium text-base">Đang xác thực quyền quản trị...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
