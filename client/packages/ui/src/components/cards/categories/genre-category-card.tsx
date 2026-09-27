import CategoryCard from "./category-card";
import { CSSProperties } from "react";

export default function GenreCategoryCard({ genre, className, style }: { className?: string; genre: string; style?: CSSProperties }) {
  return (
    <CategoryCard
      style={style}
      className={`${className}`}
      imageSource={`/genres/${genre}.jpg`}
      label={genre.toLocaleUpperCase().replaceAll("_", " ")}
    ></CategoryCard>
  );
}
