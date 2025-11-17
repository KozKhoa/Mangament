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

import Story from "@/models/story";
// import StoryCard from "@/components/cards/stories/story-card";
import StoryInfoCard from "@/components/cards/stories/story-info-card";
import NewestChapter from "@/models/newest-chapter";
import { convertNewestChapter } from "@/utils/convert";
import SwitchPage from "@/components/switch-page/big";
import FilterSort from "@/components/filter-sorts/filter-sort";
import StoryGrid from "@/components/grids/story-grid";

const OPTIONS = [
  { label: "op1", checked: false },
  { label: "op2", checked: false },
  { label: "op3", checked: false },
];

export default function Home() {
  const story: Story = {
    id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
    title: "Genshin Impact Frieren Phap su tieng tang",

    view: 123123123,
    star: 2.4,
    type: "manga",
    status: "ongoing",
    number_of_chidren: 16,
    author: ["23424", "1fsdf"],
    genre: [
      "roman",
      "action",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
      "shounen",
    ],
    summary: `Tổ đội anh hùng đã đánh bại được quỷ vương và kết thúc cuộc hành trình của họ. 
    Nhưng thế chưa phải là hết, cuộc đời của cô nàng pháp sư Elf này sẽ còn rất dài, 
    hơn cả những người đồng đội cũ của cô, một cuộc phiêu lưu mới để cô trải qua nhiều cung bậc cảm xúc,
     cũng như là học hỏi thêm về con người
`,
    cover_art: {
      url: "uploads/story/manga/Genshin Impact/cover_art.jpg",
      width: null,
      height: null,
    },
    newest_chapter: [
      {
        id: "f07b3ef0-a697-49e6-b277-da512bbdc372",
        title: "",
        order_index: 23,
        story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
        type: "volume",
        created_at: new Date("2025-10-26T13:48:37.366Z"),
        children: [
          {
            id: "8ae3301b-ff3d-464d-b6d4-4fd3800feeb0",
            title: "",
            order_index: 8,
            story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
            parent_id: "f07b3ef0-a697-49e6-b277-da512bbdc372",
            type: "chapter",
            children: [],
            created_at: new Date("2025-10-26T13:48:37.366Z"),
          },
          {
            id: "697d662c-ef80-4765-aa27-da3113da74c3",
            title: "",
            order_index: 7,
            story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
            parent_id: "f07b3ef0-a697-49e6-b277-da512bbdc372",
            type: "chapter",
            children: [],
            created_at: new Date("2025-10-26T13:48:37.366Z"),
          },
        ],
      },
      {
        id: "6ddca7af-5334-467f-9cda-bd743b402e54",
        title: "",
        order_index: 6,
        story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",

        type: "chapter",
        children: [],
        created_at: new Date("2025-10-26T13:48:37.366Z"),
      },
      {
        id: "3ae154a1-dc91-4119-888a-13258519a062",
        title: "",
        order_index: 5,
        story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",

        type: "chapter",
        children: [],
        created_at: new Date("2025-10-26T13:48:37.366Z"),
      },
      {
        id: "76c54721-b30c-4c24-a975-180c0c3d2ab7",
        title: "",
        order_index: 4,
        story_id: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
        type: "chapter",
        children: [],
        created_at: new Date("2025-10-26T13:48:37.366Z"),
      },
    ],
  };
  const options = useRef(OPTIONS);

  const options2 = useRef(OPTIONS);

  const newestChapter = useRef<NewestChapter[]>(
    convertNewestChapter(story?.newest_chapter || [])
  );

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

      <StoryGrid label="Manga" type="manga" elemetsPerPage={18}></StoryGrid>

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
