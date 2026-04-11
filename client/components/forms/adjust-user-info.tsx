import User from "@/types/user";
import LabelDropDownRadio from "../inputs/label-input/label-dropdown-radio";
import Input from "../inputs/input";
import Button from "../buttons/button";
import { useState } from "react";
import adminService from "@/services/admin";
import { toast } from "sonner";

export interface AdjustUserInfoProps {
  className?: string;
  user: User;

  onConfirm?: (newUser: User) => void;
  onCancel?: () => void;
}

const ROLES = ["admin", "user"];

export default function AdjustUserInfoForm({ className, user, onCancel, onConfirm }: AdjustUserInfoProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  const [name, setName] = useState(user.name);
  const [role, setRole] = useState(user.role);

  async function updateUserInfo() {
    setIsUpdating(true);

    console.log(user);

    const res = await adminService.updateUser({
      userId: user.id,
      ...(name && name !== user.name && { name: name }),
      ...(role && role !== user.role && { role: role }),
    });

    setIsUpdating(false);

    if (!res.success) return toast.warning(res.message);

    res.data && onConfirm?.(res.data);
  }

  return (
    <div>
      <div className={`flex flex-col gap-2 ${className}`}>
        <LabelDropDownRadio
          name="role"
          label="Vai trò"
          options={ROLES}
          defaultSelection={ROLES.indexOf(user?.role ?? "")}
          onChange={(index) => setRole(ROLES[index] as any)}
        ></LabelDropDownRadio>
        <Input label="Name" placeHolder={user.name} className="px-2.5" onChange={setName}></Input>
      </div>

      <div className="w-full flex flex-row justify-end gap-2 mt-5">
        <Button buttonType="default" isProcessing={isUpdating} disable={isUpdating} onClick={updateUserInfo} className="w-[100px] font-semibold">
          Xác nhận
        </Button>
        <Button buttonType="delete" isProcessing={isUpdating} disable={isUpdating} onClick={onCancel} className="w-[100px] font-semibold">
          Hủy bỏ
        </Button>
      </div>
    </div>
  );
}
