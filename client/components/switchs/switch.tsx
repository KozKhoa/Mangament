"use client";

import { useState } from "react";

interface SwithProps {
  onToggle?: (isOn: boolean) => void;
  duration?: number;
  width?: number;
  height?: number;
  roundHeight?: number;
  bgColorOn?: string;
  bgColorOff?: string;
  roundColorOn?: string;
  roundColorOff?: string;
  roundImageBgOnUrl?: string;
  roundImageBgOffUrl?: string;
  borderWeight?: number;
  borderColor?: string;
  defaultValue?: boolean;
  className?: string;
}

function Switch({
  onToggle = (isOn: boolean) => {},
  duration = 100,
  width = 50,
  height = 20,
  roundHeight = 28,
  bgColorOn = "#3765ce",
  bgColorOff = "#bebebe",
  roundColorOn = "#d8d8d8",
  roundColorOff = "#828282",
  roundImageBgOnUrl = "",
  roundImageBgOffUrl = "",
  borderWeight = 1,
  borderColor = "black",
  defaultValue = false,
  className = "",
}: SwithProps) {
  const [stage, setStage] = useState(defaultValue);

  function handleToggle() {
    onToggle(!stage);
    setStage(!stage);
  }

  return (
    <button
      className={`flex relative justify-center items-center w-fit cursor-pointer  ${className}`}
      style={{
        height: roundHeight > height ? roundHeight : height,
      }}
      onClick={handleToggle}
    >
      <div
        className={`rounded-full `}
        style={{
          width: width,
          height: height,
          border: `solid ${borderWeight}px ${borderColor}`,

          backgroundColor: stage ? bgColorOn : bgColorOff,
        }}
      ></div>

      {/* Round button */}
      <div
        className={`absolute left-0 rounded-full`}
        style={{
          top: height - roundHeight <= 0 ? 0 : (height - roundHeight) / 2,
          border: `solid ${borderWeight}px ${borderColor}`,

          width: roundHeight,
          height: roundHeight,

          transform: stage
            ? `translateX(${width - roundHeight + 1}px)`
            : `translateX(0px)`,
          transition: `transform ${duration}ms ease, background-color ${duration}ms linear`,

          backgroundColor: stage ? roundColorOn : roundColorOff,
          backgroundImage: stage
            ? `url(${roundImageBgOnUrl})`
            : `url(${roundImageBgOffUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "80%",
          backgroundPosition: "center",
        }}
      ></div>
    </button>
  );
}

export default Switch;

{
  /* <label className="inline-flex items-center cursor-pointer">
        <input type="checkbox" value="" className="sr-only peer" />
        <div
          className="relative w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4
         peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700
         peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full
          peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px]
           after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all
            dark:border-gray-600 peer-checked:bg-blue-600 dark:peer-checked:bg-blue-600"
        ></div>
      </label> */
}

// ...((roundImageBgOnUrl || roundImageBgOffUrl) && {
//   backgroundImage: stage
// ? `url(${roundImageBgOn})`
// : `url(${roundImageBgOff})`,
// }),
