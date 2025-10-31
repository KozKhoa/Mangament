"use client";

import Image from "next/image";
import Link from "next/link";

import NavBar from "@/components/layouts/navbar/navbar";
import Switch from "@/components/buttons/switch";
import SearchBar from "@/components/search/search";
import ButtonDropDown from "@/components/buttons/btn-dropdown";

export default function Home() {
  function handlePress(text: string) {
    console.log("Press: " + text);
  }
  return (
    <div>
      {/* <NavBar></NavBar> */}

      <SearchBar onSearch={handlePress} />

      <ButtonDropDown></ButtonDropDown>

      <Switch roundImageBgOnUrl="/sun.svg" roundImageBgOffUrl="/moon.svg" />
    </div>
  );
}
