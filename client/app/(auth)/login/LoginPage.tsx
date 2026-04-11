"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import Link from "@/components/link/Link";
import { useRouter } from "next/navigation";

import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";
import * as rememberMe from "@/lib/remember-me";

import useAuth from "@/contexts/AuthContext";

import Input from "@/components/inputs/input";
import Checkbox from "@/components/inputs/checkbox";
import Button from "@/components/buttons/button";
import { loadingBar } from "@/components/loadings/loading-bar/top-loading-bar.store";

export default function LoginPage() {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(true);

  const [errorEmail, setErrorEmail] = useState<string | null>("");
  const [errorPassword, setErrorPassword] = useState<string | null>("");

  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
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

    setIsProcessing(true);

    await auth?.login(email, password);

    if (remember) rememberMe.turnOn();
    else rememberMe.turnOff();

    setIsProcessing(false);
  }

  useEffect(() => {
    loadingBar.close();
  }, []);

  return (
    <div className="w-full min-h-[80vh] flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className={`bg-background-items  text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border border-foreground/30 rounded-sm shadow-lg     `}
      >
        <h2 className="text-[1.8em] text-center ">Đăng nhập</h2>

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

        <Checkbox tabIndex={6} onChange={setRemember} value={remember}>
          Ghi nhớ tôi
        </Checkbox>

        <div className="flex flex-col gap-5">
          <Link href={"/forgot-password"} className="w-fit" tabIndex={7}>
            <p className="w-fit underline">Quên mât khẩu</p>
          </Link>
          <div className="flex items-center gap-5">
            <p>Chưa có tài khoản? </p>
            <Link href={"/register"} tabIndex={8}>
              <p className=" underline">Đăng ký</p>
            </Link>
          </div>
        </div>

        <Button buttonType="default" type="submit" tabIndex={5} isProcessing={isProcessing} disable={isProcessing} className="m-auto lg:text-xl">
          <p>Đăng nhập</p>
        </Button>
      </form>
    </div>
  );
}
