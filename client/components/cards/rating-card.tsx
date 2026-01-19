import Rating from "@/types/ratings";
import { convertDateTo_yyyMMddHHmm } from "@/utils/convert";
import StarIcon from "@/public/star.svg";
import DisplayStar from "../displays/ratings/display-star";

export default function RatingCard({ className, rating }: { rating: Rating; className?: string }) {
  return (
    <div className={`flex flex-col gap-2 p-4 rounded-md shadow-lg bg-background-items w-fit ${className}`}>
      <div className="flex flex-row flex-wrap justify-between items-center gap-2">
        <p className="text-[1.4em] sm:text-[1.6em]">{rating.title}</p>

        <div className="flex flex-row justify-center items-center gap-1">
          <DisplayStar rating={rating.star}></DisplayStar>
          <p>{rating.star}</p>
        </div>
      </div>

      <p className="text-foreground/70 text-[0.85em] sm:text-[1em]">{rating.content}</p>

      <div className="flex flex-row flex-wrap gap-2 justify-between items-center">
        <div className="flex flex-row justify-center items-center gap-3">
          <img className="rounded-full w-8 aspect-square" src={process.env.NEXT_PUBLIC_API_URL + "uploads/" + rating.user?.avatar?.url} alt="Avatar"></img>
          <p className="text-[0.9em] line-clamp-2">{rating.user?.name}</p>
        </div>
        <p className="text-foreground/60 text-[0.8em] italic text-end">{convertDateTo_yyyMMddHHmm(new Date(rating.created_at ?? ""))}</p>
      </div>
    </div>
  );
}
