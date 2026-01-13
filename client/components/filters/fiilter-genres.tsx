import LayerIcon from "@/public/layer.svg";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";
import genreService from "@/services/genre";
import { toast } from "sonner";
import { snakeCaseToCapitalizeWord } from "@/utils/string";
import FilterProps from "@/types/filter";

interface FilterGenresProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterGenres({ value, onChange }: FilterGenresProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items
  const [genres, setGenres] = useState<FilterProps[]>([]);

  let GENRES = [...genres];

  async function fetchGenres() {
    const res = await genreService.get();

    if (!res.success) return toast.warning(res.message);

    const genres: FilterProps[] = res.data.map((genre: string) => {
      return {
        label: snakeCaseToCapitalizeWord(genre),
        code: genre,
        isChecked: value.includes(genre) ?? false,
      };
    });

    setGenres(genres);
  }

  function handleFinish() {
    setRerender(!rerender);
    onChange?.(GENRES.filter((genre) => genre.isChecked).map((genre) => genre.code ?? ""));
  }

  function resetAllField() {
    GENRES.forEach((genre) => {
      genre.isChecked = false;
    });

    handleFinish();

    setGenres(GENRES);
  }

  useEffect(() => {
    GENRES.forEach((genre) => {
      if (value.includes(genre.code ?? "")) {
        genre.isChecked = true;
      } else {
        genre.isChecked = false;
      }
    });
  }, [value]);

  useEffect(() => {
    fetchGenres();
  }, []);

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
              <LayerIcon className="w-5 h-5 text-foreground stroke-0"></LayerIcon>
              <p className="font-bold">Thể loại</p>
              <div className="flex flex-row flex-wrap gap-0.5">{GENRES?.map((genre, i) => genre.isChecked && <Tag key={genre.code}>{genre.label}</Tag>)}</div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {GENRES?.map((genre, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox defaultChecked={genre.isChecked} onChange={(isChecked) => (genre.isChecked = isChecked)}>
              {genre.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
