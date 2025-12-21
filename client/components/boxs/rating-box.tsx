import Rating from "@/types/ratings";

import DisplayStar from "../displays/ratings/display-star";

interface RatingBoxProps {
  rating?: Rating;

  className?: string;
}

export default function RatingBox({ rating, className }: RatingBoxProps) {
  return (
    <div className={`w-full h-full flex flex-col gap-2 ${className}`}>
      <div className="flex flex-row gap-5 w-fit">
        <div className="flex flex-row gap-2 justify-center items-end">
          <img className="h-10 aspect-square rounded-full object-cover" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + rating?.user?.avatar?.url}></img>
          <div className="flex flex-col gap-1">
            <div className="flex flex-row gap-2">
              <p className="font-bold">{rating?.user?.name}</p>
              <p className="text[0.8em] italic">{new Date(rating?.created_at ?? "").toLocaleDateString()}</p>
            </div>
            <label className="flex flex-row flex-wrap gap-2 justify-start items-center">
              <DisplayStar rating={rating?.star ?? 0} width="1.52em" height="1.2em"></DisplayStar>
            </label>
          </div>
        </div>
      </div>

      {/* Text box */}
      <p className="w-full h-full min-h-10 outline-none p-2 border-2 border-foreground rounded-md">{rating?.message}</p>
    </div>
  );
}
