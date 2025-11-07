"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

import NavBar from "@/components/layouts/navbar/navbar";
import Switch from "@/components/switchs/switch";
import SearchBar from "@/components/search/search";
import ButtonExpandable from "@/components/buttons/btn-expandable";
import ButtonDropdown from "@/components/buttons/dropdown/btn-dropdown";

import ButtonDropdownCheckbox from "@/components/buttons/dropdown/btn-dropdown-checkbox";
import Checkbox from "@/components/inputs/checkbox";
import AuthorIcon from "@/public/people/people.svg";
import Radio from "@/components/inputs/radio";
import ButtonDropdownRadio from "@/components/buttons/dropdown/btn-drop-down-radio";
import LoginRegister from "@/components/forms/login-register";
import Input from "@/components/forms/input";
import StoryHorizontalNavigation from "@/components/navigations/stories/story-horizontal";

const OPTIONS = [
  { label: "op1", checked: false },
  { label: "op2", checked: false },
  { label: "op3", checked: false },
];

export default function Home() {
  const options = useRef(OPTIONS);

  const options2 = useRef(OPTIONS);

  function handlePress(text: string) {}
  return (
    <div className="flex flex-col gap-2.5 text-size-default">
      <SearchBar onSearch={handlePress} />

      <Link href={"/login"}>Login page</Link>
      <Link href={"/register"}>Register page</Link>

      <Checkbox>Check box</Checkbox>
      <div className="flex gap-2.5">
        <ButtonDropdownCheckbox
          options={options.current}
          label={
            <div className="flex gap-1.5 justify-center items-center">
              <AuthorIcon className="w-6" />
              Author
            </div>
          }
          onFinishCheck={(items) => {
            console.log("items: ", items);
            console.log("Options in home page: ", options.current);
          }}
        />
      </div>

      <ButtonDropdownRadio
        label={
          <div className="flex gap-1">
            <Image
              src={"/vercel.svg"}
              alt="Icon"
              width={24}
              height={24}
            ></Image>
            <span>hello</span>
          </div>
        }
        name="sort"
        options={options2.current}
        onFinishCheck={(items) => {
          console.log(items);
        }}
      ></ButtonDropdownRadio>

      <Input
        type="password"
        label={"Email"}
        placeHolder="Placeholder"
        error="error"
      ></Input>

      <StoryHorizontalNavigation
        link=""
        title="[Manga] Frieren - Pháp sư tiễn táng Giả sử tên dài nên bị tràn xuống"
      ></StoryHorizontalNavigation>

      <div className="w-full flex flex-col gap-5 justify-center">
        {/* <LoginRegister type="register"></LoginRegister> */}
        <LoginRegister type="login"></LoginRegister>
      </div>

      <Radio>hello</Radio>

      <Switch
        roundImageBgOnUrl="/theme/sun.svg"
        roundImageBgOffUrl="/theme/moon.svg"
      />
    </div>
  );
}
