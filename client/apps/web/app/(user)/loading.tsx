export default function Loading() {
  return (
    <div className="p-6 space-y-3">
      <div className="h-6 w-1/3 bg-gray-300 animate-pulse rounded"></div>
      <div className="h-4 w-full bg-gray-300 animate-pulse rounded"></div>
      <div className="h-4 w-4/5 bg-gray-300 animate-pulse rounded"></div>
      <div className="h-4 w-2/3 bg-gray-300 animate-pulse rounded"></div>
    </div>
  );
}
