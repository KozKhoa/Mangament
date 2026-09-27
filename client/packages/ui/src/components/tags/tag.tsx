import React from "react";

interface TagProps {
  children?: React.ReactNode | string;
  className?: string;
}

const Tag = React.memo(function Tag({ children, className }: TagProps) {
  return <p className={`rounded-sm px-1 bg-foreground/20  text-foreground ${className}`}>{children}</p>;
});

export default Tag;
