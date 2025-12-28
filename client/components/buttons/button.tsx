import { MouseEventHandler } from "react";

type ButtonType = "default" | "delete" | "add";

export default function Button({
  children,
  className,
  type = "default",
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  type?: ButtonType;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  function bgColorMapping(type: ButtonType) {
    if (type === "default") return "bg-foreground";
    if (type === "add") return "bg-blue-800";
    if (type === "delete") return "bg-red-500";
    return "bg-background";
  }

  function borderColorMapping(type: ButtonType) {
    if (type === "default") return "border-foreground";
    return "border-transparent";
  }

  function textColorMapping(type: ButtonType) {
    if (type === "default") return "text-background";
    return "text-white";
  }

  return (
    <button
      onClick={onClick}
      className={`w-32 py-1.5 font-semibold border-2 text-center rounded-sm 
        ${bgColorMapping(type)} 
        ${borderColorMapping(type)}  
        ${textColorMapping(type)}
        ${className}`}
    >
      {children}
    </button>
  );
}
