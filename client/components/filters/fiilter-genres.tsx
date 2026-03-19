import LayerIcon from "@/public/layer.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useCallback, useEffect, useState } from "react";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import useApp from "@/contexts/AppContext";
import SearchBar from "../search/search";

interface FilterGenresProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const FilterGenres = ({ value, onChange }: FilterGenresProps) => {
  const app = useApp();

  const genres = app?.genres ?? [];

  const [beautyGenres, setBeautyGenres] = useState(genres.map((genre) => snakeCaseToCapitalizeWord(genre)));

  const [selectedIndexs, setSelectedIndexs] = useState<Set<number>>(new Set());
  const [finalSelectedIndex, setFinalSelectedIndex] = useState<Set<number>>(new Set());
  const [hidden, setHidden] = useState<Set<number>>(new Set());

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

    [...selectedIndexs].forEach((index) => {
      result.push(genres[index]);
    });

    setFinalSelectedIndex(new Set(selectedIndexs));

    onChange?.(result);
  }

  function handleSearch(keyword: string) {
    if (!keyword) {
      setHidden(new Set());
      return;
    }

    const newSet = new Set<number>();

    beautyGenres?.forEach((genre, i) => {
      if (!genre.toLowerCase().includes(keyword.toLowerCase())) {
        newSet.add(i);
      }
    });

    setHidden(newSet);
  }

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

  useEffect(() => {
    setBeautyGenres(genres.map((genre) => snakeCaseToCapitalizeWord(genre)));
  }, [genres]);

  return (
    <ButtonDropdown
      className={`border-foreground/30 border rounded-sm relative text-foreground`}
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
      <>
        <div className="grid grid-cols-2 gap-2.5 w-[300px] sm:w-[400px] lg:grid-cols-3 lg:w-[600px] mt-12">
          {beautyGenres?.map((genre, i) => (
            <div key={i} className={`flex w-full h-fit justify-start items-center ${hidden.has(i) ? "hidden" : ""}`}>
              <Checkbox value={selectedIndexs.has(i)} onChange={(isChecked) => toggleCheckbox(i, isChecked)}>
                {genre}
              </Checkbox>
            </div>
          ))}
        </div>

        <div className="absolute top-0 left-0 w-full p-2">
          <SearchBar placeHolder="Tìm kiếm: (vd: Slice of life)" onType={handleSearch} delay={200} />
        </div>
      </>
    </ButtonDropdown>
  );
};

export default FilterGenres;
