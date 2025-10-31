import Image from "next/image";
import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import React from "react";

interface ButtonDropdownProps {
  onClick?: () => void;
  label?: string;
  children?: React.ReactNode;
  styles?: React.CSSProperties;
  duration?: number;
  openOnLeft?: boolean;
}

function ButtonDropdown({
  onClick = () => {},
  label = "Label",
  children,
  styles = {},
  duration = 100,
  openOnLeft = false,
}: ButtonDropdownProps) {
  const [open, setOpen] = useState<boolean>(false);
  const childrenArray = useRef(React.Children.toArray(children));

  function handleOpen() {
    setOpen(!open);
  }

  function handleClick() {
    onClick();
  }

  return (
    <div
      className="flex flex-col relative justify-center items-start font-afacad text-2xl h-fit w-fit bg-inherit"
      style={styles}
    >
      {/* Main button */}
      <div className="flex flex-row justify-center items-center gap-2.5 bg-inherit">
        <button className="w-full h-full cursor-pointer" onClick={handleClick}>
          <p>{label}</p>
        </button>
        {children && (
          <button className="w-full h-full cursor-pointer" onClick={handleOpen}>
            <Image
              src={"/triangle-down.svg"}
              alt="Dropdown button"
              width={15}
              height={15}
            ></Image>
          </button>
        )}
      </div>

      {/* Dropdown list */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "fit-content", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: duration / 1000, ease: "linear" }}
            className={`flex w-fit h-fit relative bg-background z-50`}
          >
            <ul
              className="flex absolute top-2.5 left-0 flex-col justify-center items-start w-fit h-fit rounded-[5] min-w-72
                border-2 border-black p-2.5 gap-2.5 bg-inherit shadow-[11px_13px_5px_rgba(0,0,0,0.3)]"
            >
              {childrenArray.current.map((child, index) => (
                <li key={index} className="w-full h-fit">
                  {child}
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ButtonDropdown;
