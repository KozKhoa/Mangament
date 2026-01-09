interface TagProps {
  children?: React.ReactNode | string;
  className?: string;
}

export default function Tag({ children, className }: TagProps) {
  return <p className={`rounded-sm px-1 bg-foreground text-background-items ${className}`}>{children}</p>;
}
