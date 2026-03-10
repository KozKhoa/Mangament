import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import GenderIcon from "@/public/gender.svg";
import RoleIcon from "@/public/role.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

const ROLES = [
  {
    label: "Admin",
    code: "admin",
  },
  {
    label: "User",
    code: "user",
  },
];

interface FilterRolesProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterRoles({ value, onChange }: FilterRolesProps) {
  const [roles, setRoles] = useState(ROLES.map((role) => role.label));
  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  function toggleCheckbox(index: number, checked: boolean) {
    const newSet = new Set(selectedIndexs);
    if (checked) newSet.add(index);
    else newSet.delete(index);
    setSelectedIndexs(newSet);
  }

  function handleFinish() {
    const result: string[] = [];
    ROLES.forEach((r, idx) => {
      if (selectedIndexs.has(idx)) result.push(r.code);
    });
    setFinalSelectedIndex(new Set(selectedIndexs));
    onChange?.(result);
  }

  function resetAllField() {
    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());

    onChange?.([]);
  }

  useEffect(() => {
    const valueSet = new Set(value);

    const selected: number[] = [];
    ROLES.forEach((r, idx) => {
      if (valueSet.has(r.code as string)) selected.push(idx);
    });
    setSelectedIndexs(new Set(selected));
    setFinalSelectedIndex(new Set(selected));
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
              <div className="flex flex-row flex-wrap gap-0.5">{roles.map((role, i) => finalSelectedIndex.has(i) && <Tag key={role}>{role}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {roles.map((role, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(index)} onChange={(isChecked) => toggleCheckbox(index, isChecked)}>
              {role}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
