"use client";

import Image from "next/image";
import Link from "next/link";

import NavBar from "@/components/layouts/navbar/navbar";
import Switch from "@/components/buttons/switch";
import SearchBar from "@/components/search/search";
import ButtonExpandable from "@/components/buttons/btn-expandable";
import ButtonDropdown from "@/components/buttons/btn-dropdown";

export default function Home() {
  function handlePress(text: string) {
    console.log("Press: " + text);
  }
  return (
    <div>
      {/* <NavBar></NavBar> */}
      <SearchBar onSearch={handlePress} />
      <ButtonExpandable items={["Hello", "Hi"]}></ButtonExpandable>
      <Switch roundImageBgOnUrl="/sun.svg" roundImageBgOffUrl="/moon.svg" />

      <div className="flex flex-row">
        <ButtonDropdown>
          <ButtonExpandable></ButtonExpandable>
          <ButtonExpandable items={["Hello", "Hi"]}></ButtonExpandable>
          <ButtonExpandable></ButtonExpandable>

          <button onClick={() => console.log("Click helo")}>helo</button>
          <button onClick={() => console.log("Click helo")}>helo</button>
        </ButtonDropdown>

        <Switch roundImageBgOnUrl="/sun.svg" roundImageBgOffUrl="/moon.svg" />
      </div>

      <Switch roundImageBgOnUrl="/sun.svg" roundImageBgOffUrl="/moon.svg" />
    </div>
  );
}
