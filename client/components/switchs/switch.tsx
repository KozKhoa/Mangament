"use client";

import { useEffect, useState } from "react";
import Loading from "../loadings/loading";

interface SwithProps {
  disable?: boolean;
  loading?: boolean;

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

  children?: React.ReactNode | React.ReactNode[];

  className?: string;
}

function Switch({
  disable = false,
  loading = false,

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

  children,

  className = "",
}: SwithProps) {
  const [stage, setStage] = useState(defaultValue);

  function handleToggle() {
    if (disable || loading) return;

    onToggle(!stage);
    // setStage(!stage);
  }

  useEffect(() => {
    setStage(defaultValue);
  }, [defaultValue]);

  return (
    <button
      className={`flex relative justify-center items-center w-fit 
        ${disable || loading ? "cursor-default opacity-60" : "cursor-pointer"}  ${className}`}
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

          transform: stage ? `translateX(${width - roundHeight + 1}px)` : `translateX(0px)`,
          transition: `transform ${duration}ms ease, background-color ${duration}ms linear`,

          backgroundColor: stage ? roundColorOn : roundColorOff,
          backgroundImage: stage ? `url(${roundImageBgOnUrl})` : `url(${roundImageBgOffUrl})`,
          backgroundRepeat: "no-repeat",
          backgroundSize: "80%",
          backgroundPosition: "center",
        }}
      >
        {loading ? <Loading className="m-px"></Loading> : <>{children}</>}
      </div>
    </button>
  );
}

export default Switch;
