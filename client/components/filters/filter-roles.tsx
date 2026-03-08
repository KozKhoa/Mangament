import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import GenderIcon from "@/public/gender.svg";
import RoleIcon from "@/public/role.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetRole = "admin" | "user" | null;

const ROLES = [
  {
    label: "Admin",
    code: "admin",
    isChecked: false,
  },
  {
    label: "User",
    code: "user",
    isChecked: false,
  },
];

interface FilterRolesProps {
  value: TargetRole[];
  onChange?: (value: TargetRole[]) => void;
}

export default function FilterRoles({ value, onChange }: FilterRolesProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(ROLES.filter((role) => role.isChecked).map((role) => role.code as TargetRole));
  }

  function resetAllField() {
    ROLES.forEach((role) => {
      role.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    ROLES.forEach((role) => {
      if (value.includes(role.code as TargetRole)) {
        role.isChecked = true;
      } else {
        role.isChecked = false;
      }
    });
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/50 border rounded-[5] relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <RoleIcon className="w-5 h-5 fill-foreground"></RoleIcon>
              <p className="font-bold">Vai trò</p>
              <div className="flex flex-row flex-wrap gap-0.5">{ROLES?.map((role, i) => role.isChecked && <Tag key={role.code}>{role.label}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {ROLES?.map((role, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={role.isChecked} onChange={(isChecked) => (role.isChecked = isChecked)}>
              {role.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
