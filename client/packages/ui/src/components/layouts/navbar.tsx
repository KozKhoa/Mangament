import React from "react";

interface NavbarProps {
  items: string[];
  onClickItem?: (itemIndex: number) => void;

  className?: string;
}

function NavbarItem({ item, index, onClickItem }: { item: string; index: number; onClickItem?: (itemIndex: number) => void }) {
  return (
    <div className="flex flex-row flex-wrap gap-1 text-foreground/80 text-[1em] transition-all duration-300 rounded-md">
      <div onClick={() => onClickItem?.(index)} className={`w-fit cursor-pointer p-1 px-4 hover:bg-foreground/20 bg-foreground/10 rounded-md`}>
        {item}
      </div>
    </div>
  );
}

const Navbar = React.memo(function Navbar({ items, onClickItem, className }: NavbarProps) {
  return (
    <div className={`flex flex-row flex-wrap gap-1 text-foreground/80 ${className}`}>
      {items.map((item, i) => (
        <NavbarItem key={i} item={item} index={i} onClickItem={onClickItem} />
      ))}
    </div>
  );
});

export default Navbar;
