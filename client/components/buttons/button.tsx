import { MouseEventHandler } from "react";

export default function Button({
  children,
  className,
  onClick,
}: {
  children?: React.ReactNode;
  className?: string;
  onClick?: MouseEventHandler<HTMLButtonElement>;
}) {
  return (
    <button onClick={onClick} className={`w-32 py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${className}`}>
      {children}
    </button>
  );
}
