"use client";

import { useState } from "react";
import { toast } from "sonner";

import Input from "../inputs/input";
import Link from "@/components/link/Link";
import { useRouter } from "next/navigation";

import Checkbox from "../inputs/checkbox";
import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import useAuth from "@/contexts/AuthContext";
import * as token from "@/lib/token";
import Button from "../buttons/button";

interface LoginRegisterProps {
  type: "login" | "register";
  className?: string;
}

function LoginRegisterForm({ type, className }: LoginRegisterProps) {
  const auth = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(true);

  const [errorEmail, setErrorEmail] = useState<string | null>("");
  const [errorPassword, setErrorPassword] = useState<string | null>("");
  const [errorUsername, setErrorUsername] = useState<string | null>("");
  const [errorConfirmPassword, setErrorConfirmPassword] = useState<string | null>("");

  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent page from reload after press submit

    setIsProcessing(true);

    if (!validateEmailFormat(email)) {
      setErrorEmail("Invalid Email");
      setIsProcessing(false);
      return toast.error("Invalid Email");
    } else {
      setErrorEmail(null);
    }

    if (!validatePasswordFormat(password)) {
      setErrorPassword("Password must have at least six character");
      setIsProcessing(false);
      return toast.error("Password must have at least six character");
    } else {
      setErrorPassword(null);
    }

    switch (type) {
      case "login":
        auth?.login(email, password);

        break;

      case "register":
        if (password !== confirmPassword) {
          setErrorConfirmPassword("Confirm password must be the same with password");
          setIsProcessing(false);
          return toast.error("Confirm password must be the same with password");
        } else {
          setErrorConfirmPassword(null);
        }

        auth?.register(username, email, password);

        break;
    }

    if (remember) rememberMe.turnOn();
    else rememberMe.turnOff();

    setIsProcessing(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-background-items  text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border border-foreground/30 rounded-sm shadow-lg
        ${className}
        `}
    >
      {type === "login" ? <h2 className="text-[1.8em] text-center ">Đăng nhập</h2> : <h2 className="text-[1.8em] text-center ">Đăng ký</h2>}

      {type === "register" && (
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
      )}

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

      {type === "register" && (
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
      )}

      <Checkbox tabIndex={6} onChange={setRemember} value={remember}>
        Ghi nhớ tôi
      </Checkbox>

      {type === "register" ? (
        <div className="flex items-center gap-5">
          <p>Đã có tài khoản? </p>
          <Link href={"/login"} tabIndex={6}>
            <p className=" underline">Đăng nhập</p>
          </Link>
        </div>
      ) : (
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
      )}

      <Button
        buttonType="default"
        type="submit"
        tabIndex={5}
        isProcessing={isProcessing}
        disable={isProcessing}
        className="m-auto text-[1.2em] lg:text-[1.4em]"
      >
        {type === "login" ? <p>Đăng nhập</p> : <p>Đăng ký</p>}
      </Button>
    </form>
  );
}

export default LoginRegisterForm;
