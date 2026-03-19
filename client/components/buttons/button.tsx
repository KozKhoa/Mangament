import { ButtonHTMLAttributes, MouseEventHandler } from "react";
import Loading from "../loadings/loading";

type ButtonType = "default" | "delete" | "add";

export default function Button({
  children,
  className,
  buttonType = "default",
  isProcessing = false,

  disable,
  type,
  tabIndex,

  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  buttonType?: ButtonType;
  isProcessing?: boolean;

  disable?: boolean;
  type?: React.ButtonHTMLAttributes<HTMLButtonElement>["type"];
  tabIndex?: React.ButtonHTMLAttributes<HTMLButtonElement>["tabIndex"];

  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  function bgColorMapping(type: ButtonType) {
    if (type === "default") return "bg-foreground";
    if (type === "add") return "bg-blue-800";
    if (type === "delete") return "bg-red-500";
    return "bg-background-items";
  }

  // function borderColorMapping(type: ButtonType) {
  //   if (type === "default") return "border-foreground";
  //   return "border-transparent";
  // }

  function textColorMapping(type: ButtonType) {
    if (type === "default") return "text-background-items";
    return "text-white";
  }

  return (
    <button
      onClick={onClick}
      type={type}
      tabIndex={tabIndex}
      disabled={disable}
      className={`w-fit py-1 px-8 border border-transparent text-center rounded-sm flex justify-center items-center gap-2
      ${bgColorMapping(buttonType)} 
      ${textColorMapping(buttonType)}
        ${disable ? " opacity-50" : " cursor-pointer "}
        ${className}`}
    >
      {isProcessing && <Loading spinnerClassName="w-[20px]"></Loading>}
      {children}
    </button>
  );
}
