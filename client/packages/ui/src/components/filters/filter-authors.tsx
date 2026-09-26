import SharpTriangleDownIcon from "@/public/sharp-triangle-down.svg";
import Tag from "../tags/tag";

import ButtonDropdown from "../buttons/dropdown/btn-dropdown";
import Checkbox from "../inputs/checkbox";
import React, { useCallback, useEffect, useState } from "react";

import PeopleIcon from "@/public/people/people.svg";

import useApp from "@/contexts/AppContext";
import Author from "@/types/author";
import SwitchPageSmall from "../switch-page/small";
import SearchBar from "../search/search";
import { isEqualFlexible, isFitSearch, normalize } from "@/utils/string";

interface FilterAuthorProps {
  value: string[];
  onChange?: (value: string[]) => void;
}

const PAGE_SIZE = 100;

const AuthorCheckBox = React.memo(
  ({ author, isChecked, toggleCheckbox }: { author: Author; isChecked: boolean; toggleCheckbox: (id: string, checked: boolean) => void }) => {
    return (
      <div className="flex w-full h-fit justify-start items-center">
        <Checkbox value={isChecked} onChange={(isChecked) => toggleCheckbox(author.id ?? "", isChecked)}>
          {author.name}
        </Checkbox>
      </div>
    );
  },
);

const FilterAuthors = React.memo(({ value, onChange }: FilterAuthorProps) => {
  const app = useApp();

  const [authors, setAuthors] = useState<Set<Author>>(new Set(app?.authors ?? []));

  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [finalSelectedIds, setFinalSelectedIds] = useState<Set<string>>(new Set());

  function resetAllField() {
    setSelectedIds(new Set());
    setFinalSelectedIds(new Set());

    onChange?.([]);
  }

  function handleFinish() {
    onChange?.([...selectedIds]);

    setFinalSelectedIds(new Set(selectedIds));
  }

  function handleSearch(keyword: string) {
    if (!keyword) {
      setAuthors(new Set(app?.authors));
      return;
    }

    const searchAuthors = new Set<Author>();

    app?.authors?.forEach((author) => {
      if (isFitSearch(keyword, author.name ?? "")) {
        searchAuthors.add(author);
      }
    });

    setAuthors(searchAuthors);
  }

  const toggleCheckbox = useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const newSet = new Set(prev);

      if (checked) {
        newSet.add(id);
      } else {
        newSet.delete(id);
      }

      return newSet;
    });
  }, []);

  useEffect(() => {
    const selected: string[] = [];

    const valueSet = new Set(value);

    for (const author of app?.authors ?? []) {
      if (valueSet.has(author.id ?? "")) selected.push(author.id ?? "");
    }

    setSelectedIds(new Set(selected));
    setFinalSelectedIds(new Set(selected));
  }, [value]);

  useEffect(() => {
    setAuthors(new Set(app?.authors ?? []));
  }, [app?.authors]);

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
              <PeopleIcon className="w-5 h-5 text-foreground stroke-0"></PeopleIcon>
              <p className="font-bold">Tác giả</p>
              <div className="flex flex-row flex-wrap gap-0.5">
                {[...authors]?.map((author, i) => finalSelectedIds.has(author.id ?? "") && <Tag key={author.id}>{author.name}</Tag>)}
              </div>
            </div>
          }
          <div className="w-[1em] h-[1em]">
            <SharpTriangleDownIcon className="w-[1em] h-[1em] text-foreground" />
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-2 gap-2.5 w-[300px] sm:w-[400px] lg:grid-cols-3 lg:w-[600px] mt-12">
        {[...authors].map((author) => (
          <AuthorCheckBox key={author.id} author={author} isChecked={selectedIds.has(author.id ?? "")} toggleCheckbox={toggleCheckbox} />
        ))}
      </div>

      <div className="absolute top-0 left-0 w-full p-2">
        <SearchBar placeHolder="Tìm kiếm: (vd: Slice of life)" onType={handleSearch} delay={200} className="bg-background" />
      </div>
    </ButtonDropdown>
  );
});

export default FilterAuthors;
