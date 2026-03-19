import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import GenderIcon from "@/public/gender.svg";
import BanIcon from "@/public/ban.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import { useEffect, useState } from "react";
import Radio from "../inputs/radio";

const BANNED = [
  {
    label: "Hoạt động",
    code: false,
  },
  {
    label: "Bị cấm",
    code: true,
  },
];

interface FilterGendersProps {
  value: null | boolean;
  onChange?: (value: null | boolean) => void;
}

export default function FilterBanned({ value, onChange }: FilterGendersProps) {
  const [bannedOptions, setBannedOptions] = useState(BANNED.map((banned) => banned.label));

  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  function onSelect(index: number) {
    setSelectedIndex(index);

    onChange?.(BANNED[index].code);
  }

  function resetAllField() {
    setSelectedIndex(null);
    onChange?.(null);
  }

  useEffect(() => {
    if (value === null || value === undefined) {
      setSelectedIndex(null);
    } else {
      const idx = BANNED.findIndex((b) => b.code === value);
      if (idx === -1) {
        setSelectedIndex(null);
      } else {
        setSelectedIndex(idx);
      }
    }
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/30 border rounded-sm relative text-foreground`}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <BanIcon className="w-5 h-5 fill-foreground"></BanIcon>
              <p className="font-bold">Trạng thái</p>
              <div className="flex flex-row flex-wrap gap-0.5">{bannedOptions.map((ban, i) => selectedIndex === i && <Tag key={i}>{ban}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {bannedOptions.map((ban, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Radio name="banned" value={i === selectedIndex} onChange={() => onSelect(i)}>
              {ban}
            </Radio>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
