interface LineProps {
  className?: string;
}

export default function Line({ className }: LineProps) {
  return <div className={`w-full border-b my-3 ${className}`}></div>;
}
