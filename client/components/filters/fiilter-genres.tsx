import { useEffect, useState } from "react";
import { toast } from "sonner";

import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";

import LayerIcon from "@/public/layer.svg";

import genreService from "@/services/genre";

import FilterProps from "@/types/filter";

import { snakeCaseToCapitalizeWord } from "@/utils/string";
import Tag from "../tags/tag";

interface FilterGenresProps {
  onFilter?: (options: FilterProps[]) => void;
  isReset?: boolean;
}

export default function FilterGenres({ onFilter, isReset }: FilterGenresProps) {
  const [genres, setGenres] = useState<FilterProps[]>([{ label: "ss", isChecked: false }]);

  async function fetchGenres() {
    const res = await genreService.get();

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const genres: FilterProps[] = res.data.map((genre: string) => {
      return {
        label: snakeCaseToCapitalizeWord(genre),
        code: genre,
        isChecked: false,
      };
    });

    setGenres(genres);
  }

  useEffect(() => {
    fetchGenres();
  }, []);

  useEffect(() => {
    setGenres(
      genres.map((genre) => {
        genre.isChecked = false;
        return genre;
      })
    );
  }, [isReset]);

  return (
    <ButtonDropdownCheckbox
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <LayerIcon className="w-5 h-5 text-foreground stroke-0"></LayerIcon>
          <p className="font-bold">Thể loại</p>
          <div className="flex flex-row flex-wrap gap-2">{genres?.map((genre, i) => genre.isChecked && <Tag key={genre.code}>{genre.label}</Tag>)}</div>
        </div>
      }
      options={genres}
      name="filter-sort-author"
      onFinishCheck={(checked) => onFilter?.(checked)}
    ></ButtonDropdownCheckbox>
  );
}
