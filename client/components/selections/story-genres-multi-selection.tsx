import React, { useEffect, useState } from "react";
import MultiSelection from "./multi-selection/multi-selection";
import genreService from "@/services/genre";
import { snakeCaseToCapitalizeWord } from "@/utils/string";

interface StoryStatusSelectionProps {
  className?: string;

  defaultValue?: string[];

  onChange?: (genres: string[]) => void;

  onReset?: (genres: string[]) => void;
}

export default function StoryGenreMultiSelection({ className, defaultValue, onChange, onReset }: StoryStatusSelectionProps) {
  const [defaultIndexs, setDefaultIndexs] = useState<number[]>([]);

  const [genres, setGenres] = useState<Set<string>>(new Set());

  function handleChange(indexs: number[]) {
    const genresArr = [...genres];

    onChange?.(indexs.map((index) => genresArr[index]));
  }

  function handleReset(indexs: number[]) {
    handleChange(indexs);
  }

  useEffect(() => {
    const arr: number[] = [];

    const defaultValueSet = new Set(defaultValue);

    let i = 0;
    genres.forEach((genre) => {
      if (defaultValueSet.has(genre)) {
        arr.push(i);
      }
      i++;
    });

    setDefaultIndexs(arr);
  }, [defaultValue, genres]);

  useEffect(() => {
    async function fetchGenres() {
      const res = await genreService.get();

      setGenres(new Set(res.data ?? []));
    }

    fetchGenres();
  }, []);

  return (
    <MultiSelection
      className={className}
      label="Thể loại"
      options={[...genres].map((genre) => snakeCaseToCapitalizeWord(genre))}
      defaultIndexs={defaultIndexs}
      onChange={handleChange}
      onReset={onReset ? handleReset : undefined}
    ></MultiSelection>
  );
}
