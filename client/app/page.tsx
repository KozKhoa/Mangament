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
import * as StoryCardVertical from "@/components/cards/stories/story-card-vertical";
import * as StoryCarHorizontal from "@/components/cards/stories/story-card-horizontal";

import Story from "@/models/story";
import StoryCard from "@/components/cards/stories";
import StoryInfoCard from "@/components/cards/stories/story-info-card";
import NewestChapter from "@/models/newest-chapter";
import { convertNewestChapter } from "@/utils/convert";
import SwitchPage from "@/components/buttons/switch-page/big";
import FilterSort from "@/components/lists/filter-sort";

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
    numberOfChidren: 16,
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
    coverArt: {
      url: "uploads/story/manga/Genshin Impact/cover_art.jpg",
      width: null,
      height: null,
    },
    newestChapter: [
      {
        id: "f07b3ef0-a697-49e6-b277-da512bbdc372",
        title: "",
        orderIndex: 23,
        storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
        type: "volume",
        createAt: new Date("2025-10-26T13:48:37.366Z"),
        children: [
          {
            id: "8ae3301b-ff3d-464d-b6d4-4fd3800feeb0",
            title: "",
            orderIndex: 8,
            storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
            parentId: "f07b3ef0-a697-49e6-b277-da512bbdc372",
            type: "chapter",
            children: [],
            createAt: new Date("2025-10-26T13:48:37.366Z"),
          },
          {
            id: "697d662c-ef80-4765-aa27-da3113da74c3",
            title: "",
            orderIndex: 7,
            storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
            parentId: "f07b3ef0-a697-49e6-b277-da512bbdc372",
            type: "chapter",
            children: [],
            createAt: new Date("2025-10-26T13:48:37.366Z"),
          },
        ],
      },
      {
        id: "6ddca7af-5334-467f-9cda-bd743b402e54",
        title: "",
        orderIndex: 6,
        storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",

        type: "chapter",
        children: [],
        createAt: new Date("2025-10-26T13:48:37.366Z"),
      },
      {
        id: "3ae154a1-dc91-4119-888a-13258519a062",
        title: "",
        orderIndex: 5,
        storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",

        type: "chapter",
        children: [],
        createAt: new Date("2025-10-26T13:48:37.366Z"),
      },
      {
        id: "76c54721-b30c-4c24-a975-180c0c3d2ab7",
        title: "",
        orderIndex: 4,
        storyId: "fdce2cd6-95cd-4535-a8f7-0625ff81fb5b",
        type: "chapter",
        children: [],
        createAt: new Date("2025-10-26T13:48:37.366Z"),
      },
    ],
  };
  const options = useRef(OPTIONS);

  const options2 = useRef(OPTIONS);

  const newestChapter = useRef<NewestChapter[]>(
    convertNewestChapter(story?.newestChapter || [])
  );

  function handlePress(text: string) {}

  return (
    <div className="flex flex-col gap-2.5 text-size-default">
      <SearchBar onSearch={handlePress} />

      <Link href={"/login"}>Login page</Link>
      <Link href={"/register"}>Register page</Link>

      <FilterSort></FilterSort>

      <SwitchPage
        maxPage={34}
        defaultPage={1}
        onChange={(page) => console.log(page)}
      ></SwitchPage>

      <StoryInfoCard
        story={story}
        newestChapter={newestChapter.current}
      ></StoryInfoCard>

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

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 gap-1.5 ">
        <StoryCard
          story={story}
          newestChapter={{ id: "423", dir: "Volume 3/Chapter 12", dayPass: 12 }}
        ></StoryCard>
        <StoryCard
          story={story}
          newestChapter={{ id: "423", dir: "Volume 3/Chapter 12", dayPass: 12 }}
        ></StoryCard>
        <StoryCard
          story={story}
          newestChapter={{ id: "423", dir: "Volume 3/Chapter 12", dayPass: 12 }}
        ></StoryCard>
        <StoryCard
          story={story}
          newestChapter={{ id: "423", dir: "Volume 3/Chapter 12", dayPass: 12 }}
        ></StoryCard>
        <StoryCard
          story={story}
          newestChapter={{ id: "423", dir: "Volume 3/Chapter 12", dayPass: 12 }}
        ></StoryCard>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 ">
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
        <StoryCarHorizontal.default story={story}></StoryCarHorizontal.default>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-1.5 ">
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
        <StoryCardVertical.default story={story}></StoryCardVertical.default>
      </div>

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
