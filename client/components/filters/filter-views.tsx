import EyeIcon from "@/public/eye/open.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

export type TargetView = "0-1000" | "1000-10000" | "10000-50000" | "50000-100000" | "100000-500000" | "500000-1000000" | "1000000-2147483647" | null;

const VIEWS = [
  {
    label: "Trên 1 triệu view",
    code: "1000000-2147483647",
    isChecked: false,
  },
  {
    label: "Từ 500.000 đến 1 triệu view",
    code: "500000-1000000",
    isChecked: false,
  },

  {
    label: "Từ 100.000 đến 500.000 view",
    code: "100000-500000",
    isChecked: false,
  },
  {
    label: "Từ 50.000 đến 100.000 view",
    code: "50000-100000",
    isChecked: false,
  },
  {
    label: "Từ 10.000 đến 50.000 view",
    code: "10000-50000",
    isChecked: false,
  },
  {
    label: "Từ 1.000 đến 10.000 view",
    code: "1000-10000",
    isChecked: false,
  },
  {
    label: "Dưới 1.000 view",
    code: "0-1000",
    isChecked: false,
  },
];
interface FilterViewProps {
  value: TargetView[];
  onChange?: (value: TargetView[]) => void;
}

export default function FilterViews({ value, onChange }: FilterViewProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(VIEWS.filter((view) => view.isChecked).map((view) => view.code as TargetView));
  }

  function resetAllField() {
    VIEWS.forEach((view) => {
      view.isChecked = false;
    });
    handleFinish();
  }

  useEffect(() => {
    VIEWS.forEach((ratings) => {
      if (value.includes(ratings.code as TargetView)) {
        ratings.isChecked = true;
      } else {
        ratings.isChecked = false;
      }
    });
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground border rounded-[5] relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <EyeIcon className="w-5 h-5 text-foreground stroke-0"></EyeIcon>
              <p className="font-bold">Lượt xem</p>
              <div className="flex flex-row flex-wrap gap-0.5">{VIEWS?.map((view, i) => view.isChecked && <Tag key={view.code}>{view.label}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {VIEWS?.map((view, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={view.isChecked} onChange={(isChecked) => (view.isChecked = isChecked)}>
              {view.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
