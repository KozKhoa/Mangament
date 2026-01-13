import PeopleIcon from "@/public/people/people.svg";

import authorService from "@/services/author";

import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import { useEffect, useState } from "react";

import { toast } from "sonner";

import FilterProps from "@/types/filter";

interface FilterAuthorsProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

export default function FilterAuthors({ value, onChange }: FilterAuthorsProps) {
  const [rerender, setRerender] = useState(false); // This only use to force this component re render to update items
  const [authors, setAuthors] = useState<FilterProps[]>([]);

  let AUTHORS = [...authors];

  async function fetchAuthors() {
    const res = await authorService.get();

    if (!res.success) return toast.warning(res.message);

    const authors = res.data.map((author: { id: string; name: string }) => {
      const { id, name, ...newAuthor } = {
        ...author,
        ...{
          label: author.name,
          code: author.id,
          isChecked: value.includes(author.id) ?? false,
        },
      };

      return newAuthor;
    });

    setAuthors(authors);
  }

  function handleFinish() {
    console.log(AUTHORS);
    onChange?.(AUTHORS.filter((author) => author.isChecked).map((author) => author.code ?? ""));
    setRerender(!rerender);
  }

  function resetAllField() {
    AUTHORS.forEach((author) => {
      author.isChecked = false;
    });

    handleFinish();

    setAuthors(AUTHORS);
  }

  useEffect(() => {
    AUTHORS.forEach((author) => {
      if (value.includes(author.code ?? "")) {
        author.isChecked = true;
      } else {
        author.isChecked = false;
      }
    });
  }, [value]);

  useEffect(() => {
    fetchAuthors();
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
              <PeopleIcon className="w-5 h-5 text-foreground stroke-0"></PeopleIcon>
              <p className="font-bold">Tác giả</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {AUTHORS.map((author, i) => author.isChecked && <Tag key={author.code}>{author.label}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="flex flex-col justify-start items-center gap-2.5 w-full h-fit">
        {AUTHORS.map((author, index) => (
          <div key={index} className="flex w-full h-fit justify-start items-center">
            <Checkbox
              defaultChecked={author.isChecked}
              onChange={(isChecked) => {
                console.log(isChecked);
                author.isChecked = isChecked;
              }}
            >
              {author.label}
            </Checkbox>
          </div>
        ))}
      </div>
    </ButtonDropdown>
  );
}
