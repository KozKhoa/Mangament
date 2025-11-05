import { useState } from "react";

import Input from "./input";
import Link from "next/link";
import Checkbox from "../inputs/checkbox";
import { FocusTrap } from "focus-trap-react";

interface LoginRegisterProps {
  type: "login" | "register";
}

function LoginRegister({ type }: LoginRegisterProps) {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [remember, setRemember] = useState<boolean>(false);

  const handleSubmit = () => {};
  return (
    <FocusTrap>
      <form
        onSubmit={handleSubmit}
        className="bg-background font-afacad text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl p-8 pt-5 border-2 rounded-[5] shadow-[11px_13px_5px_rgba(0,0,0,0.3)]
      "
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
          placeHolder="VD: nguyenvana@gmail.com"
          require={true}
          onChange={setEmail}
          tabIndex={2}
        ></Input>

        <Input
          label="Mật khẩu"
          type="password"
          name="password"
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
            placeHolder="Nhập lại mật khẩu"
            require={true}
            onChange={setConfirmPassword}
            tabIndex={4}
          ></Input>
        )}

        {type === "register" ? (
          <div className="flex items-center gap-5">
            <p>Đã có tài khoản? </p>
            <Link href={"/"} tabIndex={6}>
              <p className=" underline">Đăng nhập</p>
            </Link>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            <Checkbox tabIndex={6} onChange={setRemember}>
              Ghi nhớ tôi
            </Checkbox>
            <Link href={""} className="w-fit" tabIndex={7}>
              <p className="w-fit underline">Quên mât khẩu</p>
            </Link>
            <div className="flex items-center gap-5">
              <p>Chưa có tài khoản? </p>
              <Link href={""} tabIndex={8}>
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
    </FocusTrap>
  );
}

export default LoginRegister;
