"use client";

import { useState } from "react";
import { toast } from "sonner";

import Input from "./input";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Checkbox from "../inputs/checkbox";
import { validateEmailFormat, validatePasswordFormat } from "@/lib/validation";
import * as rememberMe from "@/lib/remember-me";
import authService from "@/services/auth";
import useAuth, { User } from "@/contexts/AuthContext";
import * as token from "@/lib/token";

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
  const [errorConfirmPassword, setErrorConfirmPassword] = useState<
    string | null
  >("");

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

    switch (type) {
      case "login":
        const login = await authService.login(email, password);
        console.log(login);

        if (login && login.success) {
          // save user info to auth context
          auth?.setUser(login?.data?.user);

          // save access token
          token.setAccessToken(login?.data?.token);

          toast.message(login?.message);
        } else {
          return toast.error(login?.message || "Error");
        }
        break;

      case "register":
        if (password !== confirmPassword) {
          setErrorConfirmPassword(
            "Confirm password must be the same with password"
          );
          return toast.error("Confirm password must be the same with password");
        } else {
          setErrorConfirmPassword(null);
        }

        const register = await authService.register(username, email, password);

        if (register && register.success) {
          // save user info to auth context
          auth?.setUser(register.data.user);

          // save access token
          token.setAccessToken(register.data.token);

          toast.message(register.message);
        } else {
          return toast.error(register.message);
        }
        break;
    }

    if (remember) rememberMe.turnOn();
    else rememberMe.turnOff();

    // navigate to home page
    router.replace("/");
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-background font-afacad text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border-2 rounded-[5] shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
        ${className}
        `}
    >
      {type === "login" ? (
        <h2 className="text-[1.8em] text-center ">Đăng nhập</h2>
      ) : (
        <h2 className="text-[1.8em] text-center ">Đăng ký</h2>
      )}

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

      <Checkbox tabIndex={6} onChange={setRemember} defaultChecked={true}>
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
          <Link href={""} className="w-fit" tabIndex={7}>
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

      <button
        type="submit"
        className="text-[1.8em] shadow-[5px_6px_4px_rgba(0,0,0,0.3)]
          border border-foreground rounded-[5]
        "
        tabIndex={5}
      >
        {type === "login" ? <p>Đăng nhập</p> : <p>Đăng ký</p>}
      </button>
    </form>
  );
}

export default LoginRegisterForm;
