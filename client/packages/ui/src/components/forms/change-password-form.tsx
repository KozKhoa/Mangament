"use client";

import { useState } from "react";
import Input from "../inputs/input";
import Button from "../buttons/button";

export default function ChangePasswordForm({
  className,
  onSubmit,
}: {
  className?: string;
  onSubmit?: (oldPassword: string, newPassword: string) => Promise<any>;
}) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setIsProcessing(true);

    await onSubmit?.(oldPassword, newPassword);

    setIsProcessing(false);
  }

  return (
    <form
      onSubmit={handleSubmit}
      className={`bg-background-items  text-foreground flex flex-col gap-5 justify-center 
        w-full min-w-[300px] max-w-6xl p-8 pt-10 border border-foreground/30 rounded-sm shadow-lg
        ${className}    
        `}
    >
      <Input
        label="Old Password"
        type="password"
        name="oldPassword"
        placeHolder="Enter your old password"
        require={true}
        onChange={setOldPassword}
        tabIndex={1}
      ></Input>

      <Input
        label="New Password"
        type="password"
        name="newPassword"
        placeHolder="Enter your new password"
        require={true}
        onChange={setNewPassword}
        tabIndex={2}
      ></Input>

      <Button buttonType="default" type="submit" tabIndex={5} isProcessing={isProcessing} disable={isProcessing} className="m-auto">
        Change Password
      </Button>
    </form>
  );
}
