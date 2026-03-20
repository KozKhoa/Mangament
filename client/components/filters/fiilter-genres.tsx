import LayerIcon from "@/public/layer.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";

import { isFitSearch, normalize, snakeCaseToCapitalizeWord } from "@/utils/string";
import useApp from "@/contexts/AppContext";
import SearchBar from "../search/search";

interface FilterGenresProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const GenreCheckBox = React.memo(
  ({
    genre,
    isChecked,
    isHidden,
    toggleCheckbox,
  }: {
    genre: string;
    isChecked: boolean;
    isHidden: boolean;
    toggleCheckbox: (genre: string, checked: boolean) => void;
  }) => {
    return (
      <div className={`flex w-full h-fit justify-start items-center ${isHidden ? "hidden" : ""}`}>
        <Checkbox value={isChecked} onChange={(isChecked) => toggleCheckbox(genre, isChecked)}>
          {snakeCaseToCapitalizeWord(genre)}
        </Checkbox>
      </div>
    );
  },
);

const FilterGenres = ({ value, onChange }: FilterGenresProps) => {
  const app = useApp();

  const genres = app?.genres ?? [];

  const [selectedGenres, setSelectedGenres] = useState<Set<string>>(new Set());
  const [finalSelectedGenres, setFinalSelectedGenres] = useState<Set<string>>(new Set());
  const [hidden, setHidden] = useState<Set<string>>(new Set());

  const resetAllField = useCallback(() => {
    setSelectedGenres(new Set());
    setFinalSelectedGenres(new Set());

    onChange?.([]);
  }, []);

  const toggleCheckbox = useCallback((genre: string, checked: boolean) => {
    setSelectedGenres((prev) => {
      const newSet = new Set(prev);

      if (checked) {
        newSet.add(genre);
      } else {
        newSet.delete(genre);
      }

      return newSet;
    });
  }, []);

  function handleFinish() {
    const result: string[] = [];

    [...selectedGenres].forEach((genre) => {
      result.push(genre);
    });

    setFinalSelectedGenres(new Set(selectedGenres));

    onChange?.(result);
  }

  function handleSearch(keyword: string) {
    if (!keyword) {
      setHidden(new Set());
      return;
    }

    const newSet = new Set<string>();

    genres?.forEach((genre) => {
      if (!isFitSearch(keyword, genre)) {
        newSet.add(genre);
      }
    });

    setHidden(newSet);
  }

  useEffect(() => {
    const selected: string[] = [];

    const valueSet = new Set(value);

    for (const genre of genres) {
      if (valueSet.has(genre)) selected.push(genre);
    }

    setSelectedGenres(new Set(selected));
    setFinalSelectedGenres(new Set(selected));
  }, [genres, value]);

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
                {genres?.map((genre, i) => finalSelectedGenres.has(genre) && <Tag key={genre}>{snakeCaseToCapitalizeWord(genre)}</Tag>)}
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
          {genres?.map((genre, i) => (
            <GenreCheckBox key={genre} genre={genre} isChecked={selectedGenres.has(genre)} toggleCheckbox={toggleCheckbox} isHidden={hidden.has(genre)} />
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
