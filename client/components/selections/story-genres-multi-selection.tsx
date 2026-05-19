import React, { useEffect, useState } from "react";
import MultiSelection from "./multi-selection/multi-selection";
import genreService from "@/services/genre";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Genre from "@/types/genre";

interface StoryStatusSelectionProps {
  className?: string;

  defaultValue?: string[];

  onChange?: (genres: string[]) => void;

  onReset?: (genres: string[]) => void;
}

export default function StoryGenreMultiSelection({ className, defaultValue, onChange, onReset }: StoryStatusSelectionProps) {
  const [defaultIndexs, setDefaultIndexs] = useState<number[]>([]);

  const [genres, setGenres] = useState<Set<Genre>>(new Set());

  function handleChange(indexs: number[]) {
    const genresArr = [...genres];

    onChange?.(indexs.map((index) => genresArr[index].name));
  }

  function handleReset(indexs: number[]) {
    handleChange(indexs);
  }

  useEffect(() => {
    const arr: number[] = [];

    const defaultValueSet = new Set(defaultValue);

    let i = 0;
    genres.forEach((genre) => {
      if (defaultValueSet.has(genre.name)) {
        arr.push(i);
      }
      i++;
    });

    setDefaultIndexs(arr);
  }, [defaultValue, genres]);

  useEffect(() => {
    async function fetchGenres() {
      const res = await genreService.getAllGenres();

      setGenres(new Set(res.data ?? []));
    }

    fetchGenres();
  }, []);

  return (
    <MultiSelection
      className={className}
      label="Thể loại"
      options={[...genres].map((genre) => genre.name)}
      defaultIndexs={defaultIndexs}
      onChange={handleChange}
      onReset={onReset ? handleReset : undefined}
    ></MultiSelection>
  );
}
