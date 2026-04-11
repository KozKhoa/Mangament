import { ButtonHTMLAttributes, MouseEventHandler } from "react";
import Loading from "../loadings/loading";

type ButtonType = "default" | "delete" | "add";

export default function Button({
  children,
  className,
  buttonType,
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
  function bgColorMapping(type?: ButtonType) {
    if (type === "default") return "bg-foreground";
    if (type === "add") return "bg-blue-800";
    if (type === "delete") return "bg-red-500";
    return "bg-background-items";
  }

  function borderColorMapping(type?: ButtonType) {
    if (type === "default") return "border-transparent";
    if (type === "add") return "border-blue-800";
    if (type === "delete") return "border-red-500";
    return "border-foreground";
  }

  function textColorMapping(type?: ButtonType) {
    if (type === "default") return "text-background-items";
    if (type === "delete") return "text-background-items";
    return "text-foreground";
  }

  return (
    <button
      onClick={onClick}
      type={type}
      tabIndex={tabIndex}
      disabled={disable}
      className={`w-fit py-1 px-8 border-2 text-center rounded-sm flex justify-center items-center gap-2
      ${bgColorMapping(buttonType)}
      ${textColorMapping(buttonType)}
      ${borderColorMapping(buttonType)}
        ${disable ? " opacity-50" : " cursor-pointer "}
        ${className}`}
    >
      {isProcessing && <Loading spinnerClassName="w-[20px]"></Loading>}
      {children}
    </button>
  );
}
