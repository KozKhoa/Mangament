import Masonry from "react-masonry-css";

export default function MasonryGrid({
  breakpointCols,
  className,
  columnClassName,
  children,
}: {
  className?: string;
  columnClassName?: string;
  breakpointCols?: number | { [key: string | number]: number };
  children?: React.ReactNode[];
}) {
  const breakpointColumnsObj = {
    default: 5,
    1400: 4,
    1100: 3,
    700: 2,
    500: 2,
    300: 1,
  };

  return (
    <Masonry
      breakpointCols={breakpointCols ? breakpointCols : breakpointColumnsObj}
      className={`my-masonry-grid ${className}`}
      columnClassName={`my-masonry-grid_column ${columnClassName}`}
    >
      {children && children.length > 0 && children.map((child, i) => child)}
    </Masonry>
  );
}
