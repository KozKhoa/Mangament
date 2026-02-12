import Selection from "./selection";

import OngoingIcon from "@/public/story-status/ongoing.svg";
import PostponeIcon from "@/public/story-status/postpone.svg";
import FinishIcon from "@/public/story-status/finished.svg";
import UpcomingIcon from "@/public/story-status/upcoming.svg";
import React, { useEffect, useRef, useState } from "react";
import MultiSelection from "./multi-selection/multi-selection";
import genreService from "@/services/genre";
import { capitalizeWords, snakeCaseToCapitalizeWord } from "@/utils/string";
import GenreTag from "../tags/genre-tag";

interface StoryStatusSelectionProps {
  className?: string;

  defaultValue?: string[];

  onChange?: (genres: string[]) => void;
}

export default function StoryGenreMultiSelection({ className, defaultValue, onChange }: StoryStatusSelectionProps) {
  const [defaultIndexs, setDefaultIndexs] = useState<number[]>([]);

  const [genres, setGenres] = useState<Set<string>>(new Set());

  function handleChange(indexs: number[]) {
    const genresArr = [...genres];
    onChange?.(indexs.map((index) => genresArr[index]));
  }

  useEffect(() => {
    const arr: number[] = [];

    defaultValue?.forEach((value, i) => {
      if (genres.has(value)) arr.push(i);
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
      onReset={handleChange}
    ></MultiSelection>
  );
}
