import { MouseEventHandler } from "react";

export default function CategoryCard({
  imageSource,
  label,
  onClick,
  className,
  labelClassName,
}: {
  imageSource: string;
  label?: string;
  onClick?: MouseEventHandler<HTMLDivElement>;
  className?: string;
  labelClassName?: string;
}) {
  return (
    <div
      onClick={onClick}
      className={`overflow-hidden rounded-lg w-fit relative hover:scale-110 hover:z-10 transition-all duration-200 cursor-pointer 
        shadow-md
        ${className}`}
    >
      <img src={imageSource} className="max-w-[500px] w-full aspect-3/2 object-cover"></img>
      <div className="absolute bottom-10 left-0 w-full hover:scale-120 hover:z-10 duration-200">
        <p
          className={`text-xl md:text-2xl lg:text-3xl font-bold font-aclonica bg-background px-10 py-3 w-fit m-auto rounded-full
             [clip-path:polygon(10%_0%,90%_0%,100%_100%,0%_100%)] shadow-md text-center
             ${labelClassName}
             `}
        >
          {label}
        </p>
      </div>
    </div>
  );
}
