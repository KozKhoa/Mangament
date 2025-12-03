import { ButtonHTMLAttributes, MouseEventHandler } from "react";

export default function NoContent({
  header1 = "Không có kết quả",
  header2,
  buttonLabel,
  onClickButton,
  className,
}: {
  header1?: string;
  header2?: string;
  buttonLabel?: string;
  onClickButton?: MouseEventHandler<HTMLButtonElement>;
  className?: string;
}) {
  return (
    <div className={`w-full flex flex-col gap-4 py-10 justify-center items-center ${className}`}>
      <img className="w-20 h-20" src={"/out-of-stock.png"}></img>
      <h2>{header1}</h2>
      <p>{header2}</p>
      {buttonLabel && (
        <button onClick={onClickButton} className="px-5 py-2 bg-foreground text-background rounded-sm">
          {buttonLabel}
        </button>
      )}
    </div>
  );
}
