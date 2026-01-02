"use client";

import Button from "@/components/buttons/button";
import Input from "@/components/forms/input";
import LoginRegisterForm from "@/components/forms/login-register";
import useAuth from "@/contexts/AuthContext";
import { validateEmailFormat } from "@/lib/validation";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

export default function ForgotPasswordPage() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");

  const [errorEmail, setErrorEmail] = useState<string | null>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page from reload after press submit

    if (!validateEmailFormat(email)) {
      setErrorEmail("Invalid Email");
      return toast.error("Invalid Email");
    } else {
      setErrorEmail(null);
    }

    router.replace("/");
  };

  return (
    <div className="flex justify-center items-center w-full h-[80vh] mb-20">
      <form
        onSubmit={handleSubmit}
        className={`bg-background text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border-2 rounded-[5] shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
        
        `}
      >
        <h2 className="text-[1.8em] text-center ">Quên mật khẩu</h2>

        <Input
          label="Nhập email xác nhận"
          type="email"
          name="email"
          error={errorEmail}
          placeHolder="VD: nguyenvana@gmail.com"
          require={true}
          onChange={setEmail}
          tabIndex={2}
        ></Input>

        <button
          type="submit"
          className="text-[1.8em] w-fit m-auto shadow-[5px_6px_4px_rgba(0,0,0,0.3)]
           rounded-[5] px-10 py-0.5 bg-foreground text-background mt-3
        "
          tabIndex={3}
        >
          <p>Gửi mã</p>
        </button>
      </form>
    </div>
  );
}
