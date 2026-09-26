import Link from "@/components/link/Link";

import GenreCategoryCard from "../cards/categories/genre-category-card";

const GENRES = [
  "action",
  "adventure",
  "comedy",
  "crime",
  "cyberpunk",
  "dark_fantasy",
  "detective",
  "drama",
  "dystopian_fiction",
  "ecchi",
  "fairy_tale",
  "fantasy",
  "fiction",
  "gekiga",
  "gothic_fiction",
  "harem",
  "high_fantasy",
  "historical",
  "historical_fiction",
  "horror",
  "isekai",
  "josei",
  "kodomo",
  "literary_fiction",
  "low_fantasy",
  "magical_realism",
  "martial_arts",
  "mecha",
  "mystery",
  "parody",
  "post_apocalyptic",
  "psychology",
  "romance",
  "science_fiction",
  "seinen",
  "shojo",
  "shonen",
  "shoujo_ai",
  "shounen_ai",
  "slice_of_life",
  "space_opera",
  "sport",
  "steampunk",
  "supernatural",
  "survival",
  "thriller",
  "tragedy",
  "yaoi",
  "yuri",
];

export default function GenresSuggestion() {
  return (
    <div className="flex flex-col gap-2 justify-center items-center">
      <p className="text-[1.5em] font-semibold">Khám phá</p>
      <div className="flex flex-col gap-2 p-1">
        {GENRES.map((genre, i) => (
          <Link href={`/genre/${genre}`} key={i}>
            <GenreCategoryCard className="hover:scale-100" genre={genre}></GenreCategoryCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
