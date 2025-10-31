import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ButtonDropDownProps {
  onClick?: () => void;
  onClickItem?: (item: string, itemIndex: number) => void;
  items?: string[];
  label?: string;
}

function ButtonDropDown({
  label = "Drop down button",
  onClick,
  onClickItem,
  items = ["hello", "hi"],
}: ButtonDropDownProps) {
  const [open, setOpen] = useState(false);
  const mainHeight = useRef(0);
  const listHeight = useRef(0);

  useEffect(() => {
    mainHeight.current = document.getElementById("main")?.offsetHeight || 53;
    listHeight.current = document.getElementById("list")?.offsetHeight || 100;

    console.log(mainHeight, listHeight);
  }, []);

  function toggleOpenList() {
    setOpen(!open);
  }

  function handleClickMain() {
    onClick && onClick();
    console.log("Click main label");
  }

  function handleClickItem(item: string, itemIndex: number) {
    onClickItem && onClickItem(item, itemIndex);
    console.log("Click item: ", item, itemIndex);
  }

  return (
    <div
      id="main"
      className={`flex flex-col gap-0 transition-all duration-300 ease-in-out 
        overflow-hidden w-full h-fit`}
    >
      {/* Main button*/}
      <div
        id="button-main"
        className={`font-afacad text-2xl flex flex-row justify-between items-center 
        px-5 py-2.5 border-b w-full   `}
      >
        <button className="cursor-pointer" onClick={handleClickMain}>
          <p>{label}</p>
        </button>
        <button
          className="cursor-pointer h-full justify-center items-center"
          onClick={toggleOpenList}
        >
          <Image
            src={"/triangle-down.svg"}
            alt="Dropdown button"
            width={20}
            height={15}
          ></Image>
        </button>
      </div>

      {/* List of sub buttons */}
      {/* {open && ( */}
      <div id="list" className={`flex pl-5 md:pl-7 lg:pl-10 w-full h-fit `}>
        <ul
          className="flex flex-col justify-center items-start 
                border-b-[1] border-l-[1] rounded-bl-[5] w-full h-fit"
        >
          {items?.map((item, index) => (
            <li
              key={index}
              className={`font-afacad  text-lg w-full h-fit ${
                index === items.length - 1 ? "border-b-0" : "border-b-[1]"
              } px-5 py-2`}
            >
              <button
                className="w-full cursor-pointer text-start"
                onClick={() => handleClickItem(item, index)}
              >
                {item}
              </button>
            </li>
          ))}
        </ul>
      </div>
      {/* )} */}
    </div>
  );
}

export default ButtonDropDown;
