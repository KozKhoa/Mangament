import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";

import PeopleIcon from "@/public/people/people.svg";

import { snakeCaseToCapitalizeWord } from "@/utils/string";

import useApp from "@/contexts/AppContext";

interface FilterGenresProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const FilterAuthors = React.memo(({ value, onChange }: FilterGenresProps) => {
  const app = useApp();

  const [authors, setAuthors] = useState<string[]>([]);

  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());

  const resetAllField = useCallback(() => {
    setSelectedIndexs(new Set());
    setFinalSelectedIndex(new Set());
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

    const genresArr = [...authors];

    [...selectedIndexs].forEach((index) => {
      result.push(genresArr[index]);
    });

    onChange?.(result);

    setFinalSelectedIndex(new Set(selectedIndexs));
  }

  useEffect(() => {
    setAuthors(app?.authors ?? []);
  }, [app?.authors]);

  useEffect(() => {
    const selected: number[] = [];

    const valueSet = new Set(value);

    let i = 0;
    for (const author of authors) {
      if (valueSet.has(author)) selected.push(i);
      i++;
    }

    setSelectedIndexs(new Set(selected));
    setFinalSelectedIndex(new Set(selected));
  }, [authors, value]);

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
              <PeopleIcon className="w-5 h-5 text-foreground stroke-0"></PeopleIcon>
              <p className="font-bold">Tác giả</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {authors?.map((author, i) => finalSelectedIndex.has(i) && <Tag key={author}>{snakeCaseToCapitalizeWord(author)}</Tag>)}
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
        {authors?.map((author, i) => (
          <div key={i} className="flex w-full h-fit justify-start items-center">
            <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
              {snakeCaseToCapitalizeWord(author)}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
});

export default FilterAuthors;
