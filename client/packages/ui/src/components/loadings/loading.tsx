interface LoadingProps {
  className?: string;
  spinnerClassName?: string;
}

export default function Loading({ spinnerClassName, className }: LoadingProps) {
  return (
    <div className={`inset-0 flex items-center justify-center ${className}`}>
      <div className={`animate-spin aspect-square border-4 border-gray-400 border-t-transparent rounded-full w-10 ${spinnerClassName}`}></div>
    </div>
  );
}
10;
