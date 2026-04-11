import { validateEmailFormat } from "@/lib/validation";

import { useState } from "react";
import { toast } from "sonner";
import Input from "../inputs/input";
import Button from "../buttons/button";

export default function ForgotPasswordForm({ onSubmit }: { onSubmit?: (email: string, event?: React.FormEvent<HTMLFormElement>) => void }) {
  const [email, setEmail] = useState<string>("");

  const [errorEmail, setErrorEmail] = useState<string | null>("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault(); // Prevent page from reload after press submit

    if (!validateEmailFormat(email)) {
      setErrorEmail("Invalid Email");
      return toast.error("Invalid Email");
    } else {
      setErrorEmail(null);
    }

    onSubmit?.(email, e);
  }
  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-background text-foreground flex flex-col gap-5 justify-center 
        w-full max-w-3xl py-8 px-4 lg:p-8 pt-5 border border-foreground/30 rounded-sm shadow-lg
        
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

      <Button buttonType="default" className="text-[1.3em] m-auto" type="submit" tabIndex={3}>
        Gửi mã
      </Button>
    </form>
  );
}
