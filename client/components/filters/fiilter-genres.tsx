import LayerIcon from "@/public/layer.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import FilterProps from "@/types/filter";
import useApp from "@/contexts/AppContext";

interface FilterGenresProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const FilterGenres = ({ value, onChange }: FilterGenresProps) => {
  const app = useApp();

  const [genres, setGenres] = useState<string[]>([]);

  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  const resetAllField = useCallback(() => {
    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());

    onChange?.([]);
  }, []);

  function toggleCheckbox(index: number, checked: boolean) {
    const newSet = new Set(selectedIndexs);

    if (checked) {
      newSet.add(index);
    } else {
      newSet.delete(index);
    }

    setSelectedIndexs(newSet);
  }

  function handleFinish() {
    const result: string[] = [];

    const genresArr = [...genres];

    [...selectedIndexs].forEach((index) => {
      result.push(genresArr[index]);
    });

    setFinalSelectedIndex(new Set(selectedIndexs));

    onChange?.(result);
  }

  useEffect(() => {
    setGenres(app?.genres ?? []);
  }, [app?.genres]);

  useEffect(() => {
    const selected: number[] = [];

    const valueSet = new Set(value);

    let i = 0;
    for (const genre of genres) {
      if (valueSet.has(genre)) selected.push(i);
      i++;
    }

    setSelectedIndexs(new Set(selected));
    setFinalSelectedIndex(new Set(selected));
  }, [genres, value]);

  return (
    <ButtonDropdown
      className={`border-foreground/50 border rounded-[5] relative text-foreground`}
      acceptButtonLabel="Finish"
      onClickAcceptButton={handleFinish}
      closeButtonLabel="Reset"
      onClickCloseButton={resetAllField}
      icon={
        <div className={`flex flex-row relative justify-start items-center gap-1.5 cursor-pointer w-fit text-foreground px-2 `}>
          {
            <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit p-0.5">
              <LayerIcon className="w-5 h-5 text-foreground stroke-0"></LayerIcon>
              <p className="font-bold">Thể loại</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {genres?.map((genre, i) => finalSelectedIndex.has(i) && <Tag key={genre}>{snakeCaseToCapitalizeWord(genre)}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 w-[300px] sm:w-[400px] lg:grid-cols-3 lg:w-[600px]">
        {genres?.map((genre, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
              {snakeCaseToCapitalizeWord(genre)}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
};

export default FilterGenres;
