import FlagIcon from "@/public/flag.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";
import SearchBar from "../search/search";
import useApp from "@/contexts/AppContext";

interface FilterRatingsProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const Item = React.memo(function Item({
  children,
  isOn,
  index,
  toggleCheckbox,

  className,
}: {
  children: string;
  isOn: boolean;
  toggleCheckbox: (index: number) => void;
  index: number;

  className?: string;
}) {
  return (
    <div className={`flex w-fit h-fit justify-start items-center ${className}`}>
      <Checkbox value={isOn} onChange={() => toggleCheckbox(index)}>
        {children}
      </Checkbox>
    </div>
  );
});

const FilterNation = React.memo(({ value, onChange }: FilterRatingsProps) => {
  const app = useApp();

  const nations = app?.nations ?? [];

  const [hidden, setHidden] = useState<Set<number>>(new Set());
  const [selectedIndex, setSelectedIndex] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  function handleFinish() {
    const result: string[] = [];

    [...selectedIndex].map((index) => {
      result.push(nations?.[index]?.name ?? "");
    });

    setFinalSelectedIndex(selectedIndex);

    onChange?.(result);
  }

  function resetAllField() {
    setSelectedIndex(new Set());
    setFinalSelectedIndex(new Set());

    setHidden(new Set());

    onChange?.([]);
  }

  function handleSearch(keyword: string) {
    if (!keyword) {
      setHidden(new Set());
      return;
    }

    const newSet = new Set<number>();

    [...nations]?.forEach((nation, i) => {
      if (!nation.name.toLowerCase().includes(keyword.toLowerCase())) {
        newSet.add(i);
      }
    });

    setHidden(newSet);
  }

  const toggleCheckbox = useCallback((index: number) => {
    setSelectedIndex((prev) => {
      const newSet = new Set(prev);
      if (prev.has(index)) {
        newSet.delete(index);
      } else {
        newSet.add(index);
      }
      return newSet;
    });
  }, []);

  useEffect(() => {
    const valueSet = new Set(value);

    const selectedArr: number[] = [];

    nations?.forEach((nation, i) => {
      if (valueSet.has(nation.name)) selectedArr.push(i);
    });

    setSelectedIndex(new Set(selectedArr));
    setFinalSelectedIndex(new Set(selectedArr));
  }, [value]);

  return (
    <ButtonDropdown
      openOnLeft={true}
      className={`border-foreground/30 border rounded-sm relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 p-0.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
              <FlagIcon className="w-5 h-5 fill-background-items stroke-foreground"></FlagIcon>
              <p className="font-bold">Quốc gia</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {nations?.map((nation, i) => finalSelectedIndex.has(i) && <Tag key={nation.name}>{nation.flag_icon + " " + nation.name}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <>
        <div className="grid grid-cols-2 gap-3 w-[300px] sm:w-[500px] lg:grid-cols-3 lg:w-[800px] mt-12">
          {nations?.map((nation, i) => (
            <Item key={i} index={i} isOn={selectedIndex.has(i)} toggleCheckbox={toggleCheckbox} className={`${hidden.has(i) ? "hidden" : ""}`}>
              {nation.flag_icon + " " + nation.name}
            </Item>
          ))}
        </div>

        <div className="absolute top-0 left-0 w-full p-2">
          <SearchBar placeHolder="Tìm kiếm: (vd: japan)" onType={handleSearch} delay={200} />
        </div>
      </>
    </ButtonDropdown>
  );
});

export default FilterNation;
