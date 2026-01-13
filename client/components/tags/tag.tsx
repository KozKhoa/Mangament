interface TagProps {
  children?: React.ReactNode | string;
  className?: string;
}

export default function Tag({ children, className }: TagProps) {
  return <p className={`rounded-sm px-1 bg-foreground/30   text-foreground ${className}`}>{children}</p>;
}
