"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/contexts/AuthContext";
import { toast } from "sonner";

export default function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuard(props: T) {
    const router = useRouter();
    const auth = useAuth();

    const isLoading = auth?.loading;
    const user = auth?.user;

    console.log(user, isLoading);

    useEffect(() => {
      if (!isLoading && !user) {
        toast.warning("Yêu cầu đăng nhập để tiếp tục");
        router.replace("/login");
      }
    }, [user, isLoading]);

    if (isLoading) return null;
    if (!user) return null;

    return <WrappedComponent {...props} />;
  };
}
