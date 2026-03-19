import User from "@/types/user";

import useAuth from "@/contexts/AuthContext";

import EditIcon from "@/public/edit/edit.svg";

import LabelInput from "@/components/inputs/label-input/label-input";
import LabelDropDownRadio from "@/components/inputs/label-input/label-dropdown-radio";

import { convertDateTo_yyyMMdd } from "@/utils/convert";
import ImagePicker from "@/components/inputs/image-picker";
import AvatarPicker from "@/components/inputs/avatar-cropper";
import Image from "next/image";
import { useEffect, useState } from "react";
import { modal } from "@/components/modal/modal.store";
import Cropper, { Area } from "react-easy-crop";
import AvatarCropper from "@/components/inputs/avatar-cropper";

const GENDER = ["male", "female", "other"];

export default function UserCard({ className }: { className?: string }) {
  const auth = useAuth();
  const user = auth?.user;

  const [image, setImage] = useState([process.env.NEXT_PUBLIC_CDN_URL, user?.avatar?.key].join("/"));

  function handleEditAvatar(imageFile: File) {
    const url = URL.createObjectURL(imageFile);

    let newEditedImage: string = image;

    modal.open("confirm", {
      title: "Thay đổi avatar",
      content: (
        <div className="w-[80vw] h-[80vh] relative">
          <AvatarCropper url={url} cropShape="round" onChange={(image) => (newEditedImage = URL.createObjectURL(image))} />
        </div>
      ),
      onCancel: () => {
        modal.close();
      },
      onConfirm: async () => {
        const res = await fetch(newEditedImage);
        const blob = await res.blob();

        await auth?.updateAvatar(blob as File);

        setImage(newEditedImage);

        modal.close();
      },
    });
  }

  useEffect(() => {
    setImage([process.env.NEXT_PUBLIC_CDN_URL, user?.avatar?.key].join("/"));
  }, [user?.avatar]);

  useEffect(() => {
    return () => {
      if (image && image.startsWith("blob:")) {
        URL.revokeObjectURL(image);
      }
    };
  }, [image]);

  return (
    <div>
      {/* User card */}
      <div
        className={`flex flex-row flex-wrap justify-center items-center p-5 border border-foreground/20 rounded-sm gap-2
        shadow-lg ${className}`}
      >
        <div className="flex flex-1 h-full min-w-xs aspect-square p-3 border border-foreground/20 rounded-full relative">
          {/* <ImagePicker
            className="flex justify-center items-center w-full"
            defaultValue={user?.avatar?.url ?? ""}
            value={user?.avatar?.url}
            onChange={(file) => {
              if (typeof file !== "string") auth?.updateAvatar(file);
            }}
          /> */}

          <Image className="rounded-full overflow-hidden" src={image} alt="Avatar" fill />

          <label className="absolute bottom-1 right-1 cursor-pointer z-10">
            <input className="hidden" type="file" accept="image/*" onChange={(e) => handleEditAvatar([...(e.target?.files ?? [])][0])} />
            <EditIcon className="w-10 h-10 shrink-0 text-foreground/60" />
          </label>
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
