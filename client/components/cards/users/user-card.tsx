import User from "@/types/user";

import useAuth from "@/contexts/AuthContext";

import LabelInput from "@/components/inputs/label-input/label-input";
import LabelDropDownRadio from "@/components/inputs/label-input/label-dropdown-radio";

import { convertDateTo_yyyMMdd } from "@/utils/convert";

const GENDER = ["male", "female", "other"];

export default function UserCard({ className }: { className?: string }) {
  const auth = useAuth();
  const user = auth?.user;

  return (
    <div>
      {/* User card */}
      <div
        className={`flex flex-row flex-wrap justify-center items-center p-5 border-2 rounded-md 
        shadow-[11px_13px_4px_0px_rgba(0,0,0,0.3)] ${className}`}
      >
        <div className="flex flex-1 h-full min-w-xs aspect-square overflow-hidden p-3 border-2 rounded-full">
          <img className="object-s rounded-full" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + user?.avatar?.url} alt="Avatar"></img>
        </div>
        <div className="flex flex-5 flex-col items-start">
          {/* User name */}
          <LabelInput onChange={auth?.updateUsername} className="w-full" label="Tên tài khoản" value={user?.name} inputType="text"></LabelInput>

          {/* Email */}
          <LabelInput className="w-full" label="Email" value={user?.email} inputType="text" disable></LabelInput>

          {/* Gender */}
          <LabelDropDownRadio
            name="gender"
            label="Giới tính"
            options={GENDER}
            defaultSelection={GENDER.indexOf(user?.gender ?? "")}
            onChange={(selectIndex) => auth?.updateGender(GENDER.at(selectIndex) ?? "")}
          ></LabelDropDownRadio>

          {/* Birthday */}
          <LabelInput
            onChange={auth?.updateBirthday}
            className="w-full"
            label="Ngày sinh"
            value={convertDateTo_yyyMMdd(user?.birthday ? new Date(user.birthday) : null)}
            inputType="date"
          ></LabelInput>
        </div>
      </div>
    </div>
  );
}
