export default function Loading() {
  return (
    <div className="fixed top-0 left-0 w-full h-[3px] z-50">
      <div className="h-full w-full animate-loading bg-blue-500"></div>
    </div>
  );
}
