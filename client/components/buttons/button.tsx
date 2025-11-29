export default function Button({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <button className={`w-32 py-1.5 font-semibold border-2 border-foreground text-center rounded-sm ${className}`}>{children}</button>;
}
