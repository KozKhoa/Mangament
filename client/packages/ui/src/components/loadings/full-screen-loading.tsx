import { useEffect } from "react";
import Loading from "./loading";

export default function FullScreenLoading({ label }: { label?: string }) {
  useEffect(() => {
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 bg-black/60 h-screen w-full flex flex-col gap-5 justify-center items-center z-50">
      <Loading></Loading>
      <p className="text-white/80 font-semibold">{label}</p>
    </div>
  );
}
