"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import Link from "@/components/link/Link";

import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";

import useAuth from "@/contexts/AuthContext";

import Input from "@/components/inputs/input";

import Button from "@/components/buttons/button";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

function RegisterPage() {
  const auth = useAuth();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");

  const [errorEmail, setErrorEmail] = useState<string | null>("");
  const [errorPassword, setErrorPassword] = useState<string | null>("");
  const [errorUsername, setErrorUsername] = useState<string | null>("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState<string | null>("");

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page from reload after press submit

    if (!validateEmailFormat(email)) {
      setErrorEmail("Invalid Email");
      return toast.error("Invalid Email");
    } else {
      setErrorEmail(null);
    }

    if (!validatePasswordFormat(password)) {
      setErrorPassword("Password must have at least six character");
      return toast.error("Password must have at least six character");
    } else {
      setErrorPassword(null);
    }

    if (password !== confirmPassword) {
      setErrorConfirmPassword("Confirm password must be the same with password");
      return toast.error("Confirm password must be the same with password");
    } else {
      setErrorConfirmPassword(null);
    }

    setIsProcessing(true);

    await auth?.register(username, email, password);

    setIsProcessing(false);
  };

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="flex w-full min-h-[80vh] justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className={`bg-background-items  text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border-2 rounded-[5] shadow-[11px_13px_5px_rgba(0,0,0,0.3)]`}
      >
        <h2 className="text-[1.8em] text-center ">Đăng ký</h2>
        <Input
          label="Tên tài khoản"
          type="text"
          name="username"
          error={errorUsername}
          placeHolder="VD: Nguyễn Văn A"
          require={true}
          onChange={setUsername}
          tabIndex={1}
        ></Input>
        <Input
          label="Email"
          type="email"
          name="email"
          error={errorEmail}
          placeHolder="VD: nguyenvana@gmail.com"
          require={true}
          onChange={setEmail}
          tabIndex={2}
        ></Input>
        <Input
          label="Mật khẩu"
          type="password"
          name="password"
          error={errorPassword}
          placeHolder="Nhập mật khẩu"
          require={true}
          onChange={setPassword}
          tabIndex={3}
        ></Input>

        <Input
          label="Xác nhân mật khẩu"
          type="password"
          name="confirm_password"
          error={errorConfirmPassword}
          placeHolder="Nhập lại mật khẩu"
          require={true}
          onChange={setConfirmPassword}
          tabIndex={4}
        ></Input>

        <div className="flex items-center gap-5">
          <p>Đã có tài khoản? </p>
          <Link href={"/login"} tabIndex={6}>
            <p className=" underline">Đăng nhập</p>
          </Link>
        </div>

        <Button type="submit" tabIndex={5} isProcessing={isProcessing} disable={isProcessing} className="m-auto lg:text-xl">
          <p>Đăng ký</p>
        </Button>
      </form>
    </div>
  );
}

export default RegisterPage;
