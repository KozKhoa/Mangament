import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ButtonDropDownProps {
  onClick?: () => void;
  onClickItem?: (item: string, itemIndex: number) => void;
  items?: string[];
  label?: string;
  duration?: number;
  styles?: React.CSSProperties;
}

function ButtonExpandable({
  label = "Drop down button",
  onClick,
  onClickItem,
  items = [],
  duration = 100,
  styles = {},
}: ButtonDropDownProps) {
  const [open, setOpen] = useState<boolean>(false);

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
      className={`flex flex-col gap-0 overflow-hidden w-full h-fit font-afacad text-2xl rounded-t-[5]`}
      style={styles}
    >
      {/* Main button*/}
      <div
        className={`flex flex-row justify-between items-center 
        px-5 py-1.5 border-b w-full rounded-t-[5] hover:bg-[#d8d8d8]`}
      >
        <button className="cursor-pointer" onClick={handleClickMain}>
          <p>{label}</p>
        </button>
        {items.length > 0 && (
          <button
            className="cursor-pointer h-full justify-center items-center"
            onClick={toggleOpenList}
          >
            <Image
              src={"/triangle-down.svg"}
              alt="Dropdown button"
              width={15}
              height={15}
            ></Image>
          </button>
        )}
      </div>

      {/* List of sub buttons */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "fit-content" }}
            exit={{ height: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`flex pl-5 md:pl-7 lg:pl-10 w-full h-fit `}
          >
            <ul
              className="flex flex-col justify-center items-start 
                border-b border-l rounded-bl w-full h-fit"
            >
              {items?.map((item, index) => (
                <li
                  key={index}
                  className={`w-full h-fit px-5 py-2 hover:bg-[#d8d8d8] ${
                    index === items.length - 1 ? "border-b-0" : "border-b"
                  }`}
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
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonExpandable;
