import { useEffect, useState } from "react";
import { toast } from "sonner";

import ButtonDropdownCheckbox from "../buttons/dropdown/btn-dropdown-checkbox";

import PeopleIcon from "@/public/people/people.svg";

import authorService from "@/services/author";

import FilterProps from "@/types/filter";
import Tag from "../tags/tag";

interface FilterAuthorsProps {
  onFilter?: (options: FilterProps[]) => void;
  isReset?: boolean;
  className?: string;
}

export default function FilterAuthors({ onFilter, isReset }: FilterAuthorsProps) {
  const [authors, setAuthors] = useState<FilterProps[]>();

  async function fetchAuthors() {
    const res = await authorService.get();

    if (!res) return toast.warning("Cannot connect with server");
    if (!res.success) return toast.warning(res.message);

    const authors = res.data.map((author: { id: string; name: string }) => {
      const { id, name, ...newAuthor } = {
        ...author,
        ...{
          label: author.name,
          checked: false,
          code: author.id,
        },
      };

      return newAuthor;
    });
    setAuthors(authors);
  }

  useEffect(() => {
    fetchAuthors();
  }, []);

  useEffect(() => {
    setAuthors(
      authors?.map((author) => {
        author.isChecked = false;
        return author;
      })
    );
  }, [isReset]);

  return (
    <ButtonDropdownCheckbox
      label={
        <div className="flex flex-row flex-wrap gap-1.5 justify-center items-center w-fit h-fit">
          <PeopleIcon className="w-5 h-5 text-foreground stroke-0"></PeopleIcon>
          <p className="font-bold">Tác giả</p>
          <div className="flex flex-row flex-wrap gap-2">{authors?.map((author, i) => author.isChecked && <Tag key={author.code}>{author.label}</Tag>)}</div>
        </div>
      }
      options={authors || []}
      name="filter-sort-author"
      onFinishCheck={(checked) => onFilter?.(checked)}
    ></ButtonDropdownCheckbox>
  );
}
