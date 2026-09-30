"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "../AuthContext";
import { toast } from "sonner";

export default function withAdmin<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuard(props: T) {
    const auth = useAuth();

    const authUrl = process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3003";

    const isLoading = auth?.loading;
    const user = auth?.user;

    useEffect(() => {
      if (!isLoading) {
        const currentUrl = typeof window !== "undefined" ? window.location.href : "";
        const loginUrl = `${authUrl}/login?redirect=${encodeURIComponent(currentUrl)}`;

        if (!user) {
          toast.warning("Yêu cầu đăng nhập tài khoản quản trị viên để tiếp tục");
          window.location.href = loginUrl;
          return;
        }

        if (user.role !== "admin") {
          toast.warning("Tài khoản của bạn không có quyền truy cập trang quản trị");
          window.location.href = loginUrl;
          return;
        }
      }
    }, [user, isLoading, authUrl]);

    if (isLoading || !user || user.role !== "admin") return null;

    return <WrappedComponent {...props} />;
  };
}
