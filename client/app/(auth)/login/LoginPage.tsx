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

import { signIn, useSession } from "next-auth/react";

function GoogleSvg() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48">
      <path
        fill="#FFC107"
        d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
      />
      <path
        fill="#FF3D00"
        d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
      />
      <path
        fill="#4CAF50"
        d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"
      />
      <path
        fill="#1976D2"
        d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"
      />
    </svg>
  );
}

export default function LoginPage() {
  const auth = useAuth();
  const { data: session } = useSession();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");

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

  useEffect(() => {
    if (session && (session as any).idToken) {
      auth?.loginWithGoogle((session as any).idToken);
    }
  }, [session, auth]);

  return (
    <div className="w-full min-h-[80vh] flex justify-center items-center">
      <form
        onSubmit={handleSubmit}
        className={`bg-background-items  text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border border-foreground/30 rounded-sm shadow-lg     `}
      >
        <h2 className="text-[1.8em] text-center ">Đăng nhập</h2>

        {/* Google login */}
        <div className="flex flex-col gap-3">
          <button
            onClick={() => signIn("google")}
            className="w-full flex items-center justify-center gap-2 py-1.5 bg-white text-black hover:bg-gray-100 
              border border-gray-300 hover:cursor-pointer rounded-sm"
          >
            <GoogleSvg />
            <p>Đăng nhập với Google</p>
          </button>

          <div className="flex items-center gap-2 my-2">
            <div className="flex-1 h-px bg-foreground/20"></div>
            <p className="text-sm text-foreground/50">HOẶC</p>
            <div className="flex-1 h-px bg-foreground/20"></div>
          </div>
        </div>

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
