import { ButtonHTMLAttributes, MouseEventHandler } from "react";
import Loading from "../loadings/loading";

type ButtonType = "default" | "delete" | "add" | "default-shadow";

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
    if (type === "default-shadow") return "bg-background-items";
    if (type === "add") return "bg-blue-800";
    if (type === "delete") return "bg-red-500";
    return "bg-background-items";
  }

  function borderColorMapping(type?: ButtonType) {
    if (type === "default") return "border-transparent";
    if (type === "default-shadow") return "border-foreground";
    if (type === "add") return "border-blue-800";
    if (type === "delete") return "border-red-500";
    return "border-foreground";
  }

  function textColorMapping(type?: ButtonType) {
    if (type === "default") return "text-background-items";
    if (type === "default-shadow") return "text-foreground";
    if (type === "delete") return "text-background-items";
    return "text-foreground";
  }

  function shadowColorMapping(type?: ButtonType) {
    if (type === "default-shadow") return "shadow-[2px_4px_1px_var(--foreground)]/80 ";
    return "";
  }

  function hoverBgColorMapping(type?: ButtonType) {
    if (type === "default") return "hover:bg-foreground/80";
    if (type === "default-shadow") return "hover:bg-foreground/10";
    if (type === "add") return "hover:bg-blue-800/80";
    if (type === "delete") return "hover:bg-red-500/80";
    return "hover:bg-foreground/10";
  }
  return (
    <button
      onClick={onClick}
      type={type}
      tabIndex={tabIndex}
      disabled={disable}
      className={`w-fit py-1 px-5 border-2 text-center text-base rounded-sm flex justify-center items-center gap-1 
      ${bgColorMapping(buttonType)}
      ${textColorMapping(buttonType)}
      ${borderColorMapping(buttonType)}
        ${shadowColorMapping(buttonType)}
        ${disable ? " opacity-50" : `cursor-pointer ${hoverBgColorMapping(buttonType)}`}
        ${className}`}
    >
      {isProcessing && <Loading spinnerClassName="w-[20px]"></Loading>}
      {children}
    </button>
  );
}
