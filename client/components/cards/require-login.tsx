"use client";

import { useRouter } from "next/navigation";
import Button from "@/components/buttons/button";

export default function RequireLogin({ className }: { className?: string }) {
  const router = useRouter();

  function gotoLogin() {
    router.replace("/login");
  }

  function gotoRegister() {
    router.replace("/register");
  }

  return (
    <div className={`flex flex-col justify-center items-center gap-5 p-5 border border-foreground/30 rounded-sm ${className}`}>
      <h1 className="w-full text-center font-bold">Vui lòng đăng nhập trước</h1>
      <h4 className="text-center w-full text-foreground/60">Bạn phải đăng nhập để xem nội dung này</h4>

      <div className="flex flex-row justify-around w-full">
        <div onClick={() => gotoLogin()}>
          <Button>Đăng nhập</Button>
        </div>
        <div onClick={() => gotoRegister()}>
          <Button>Đăng ký</Button>
        </div>
      </div>
    </div>
  );
}
