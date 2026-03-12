"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function withAdmin<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuard(props: T) {
    const router = useRouter();
    const auth = useAuth();

    const isLoading = auth?.loading;
    const user = auth?.user;

    useEffect(() => {
      if (!user && !isLoading) {
        toast.warning("Yêu cầu đăng nhập để tiếp tục");
        router.replace("/login");
        return;
      }

      if (user && !isLoading) {
        if (user.role !== "admin") {
          toast.warning("Bạn không có quyền truy cập vào trang này");
          router.replace("/");
        }
      }
    }, [user, isLoading]);

    if (isLoading) return null;
    if (!user) return null;
    if (user.role !== "admin") return null;

    return <WrappedComponent {...props} />;
  };
}
