"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef } from "react";

import NavBar from "@/components/layouts/navbar/navbar";
import Switch from "@/components/switchs/switch";
import SearchBar from "@/components/inputs/search";
import ButtonExpandable from "@/components/buttons/expandable/btn-expandable";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";

import ButtonDropdownCheckbox from "@/components/buttons/dropdown/btn-dropdown-checkbox";
import Checkbox from "@/components/inputs/checkbox";
import AuthorIcon from "@/public/people/people.svg";
import Radio from "@/components/inputs/radio";
import ButtonDropdownRadio from "@/components/buttons/dropdown/btn-drop-down-radio";
import LoginRegister from "@/components/forms/login-register";
import Input from "@/components/forms/input";

import Story from "@/types/story";
// import StoryCard from "@/components/cards/stories/story-card";
import StoryInfoCard from "@/components/cards/stories/story-info-card";
import NewestChapter from "@/types/newest-chapter";
import { convertNewestChapter } from "@/utils/convert";
import SwitchPage from "@/components/switch-page/big";
import FilterSort from "@/components/list/filter-sort";
import StoryGrid from "@/components/grids/story-grid";

const OPTIONS = [
  { label: "op1", checked: false },
  { label: "op2", checked: false },
  { label: "op3", checked: false },
];

export default function Home() {
  const options = useRef(OPTIONS);

  const options2 = useRef(OPTIONS);

  // const newestChapter = useRef<NewestChapter[]>(convertNewestChapter(story?.newest_chapter || []));

  function handlePress(text: string) {}

  return (
    <div className="flex flex-col gap-2.5 text-size-default">
      <SearchBar onSearch={handlePress} />

      <Link className="w-fit" href={"/login"}>
        Login page
      </Link>
      <Link className="w-fit" href={"/register"}>
        Register page
      </Link>

      <StoryGrid label="Manga" storyType="manga" elementsPerPage={18}></StoryGrid>

      <Input type="password" label={"Email"} placeHolder="Placeholder" error="error"></Input>

      <div className="w-full flex flex-col gap-5 justify-center">
        {/* <LoginRegister type="register"></LoginRegister> */}
        <LoginRegister type="login"></LoginRegister>
      </div>

      <Radio>hello</Radio>

      <Switch roundImageBgOnUrl="/theme/sun.svg" roundImageBgOffUrl="/theme/moon.svg" />
    </div>
  );
}
