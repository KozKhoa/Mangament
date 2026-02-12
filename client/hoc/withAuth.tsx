"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import useAuth from "@/contexts/AuthContext";
import { toast } from "sonner";
import RequireLogin from "@/components/cards/require-login";
import Loading from "@/components/loadings/loading";

export default function withAuth<T extends object>(WrappedComponent: React.ComponentType<T>) {
  return function AuthGuard(props: T) {
    const router = useRouter();
    const auth = useAuth();

    const loading = auth?.loading;
    const user = auth?.user;

    useEffect(() => {
      if (!loading && !user) {
        toast.warning("Yêu cầu đăng nhập để tiếp tục");
        router.replace("/login");
      }
    }, [user, loading]);

    if (loading) return <Loading className="h-screen"></Loading>;
    if (!user) return <RequireLogin></RequireLogin>;

    return <WrappedComponent {...props} />;
  };
}
