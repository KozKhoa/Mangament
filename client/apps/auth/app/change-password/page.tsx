"use client";

import ChangePasswordForm from "@/components/forms/change-password-form";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";
import useAuth from "@/contexts/AuthContext";
import withAuth from "@/hoc/withAuth";
import authService from "@/services/auth";
import { useRouter } from "next/navigation";
import { on } from "process";
import { useEffect } from "react";
import { toast } from "sonner";

function ChangePasswordPage() {
  const router = useRouter();
  const auth = useAuth();

  async function handleSubmit(oldPassword: string, newPassword: string) {
    // call api change password
    await auth?.changePassword(oldPassword, newPassword);
  }

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center">
      <ChangePasswordForm className="max-w-md mx-auto " onSubmit={handleSubmit} />;
    </div>
  );
}

export default withAuth(ChangePasswordPage);
