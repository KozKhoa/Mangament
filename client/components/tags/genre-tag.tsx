export default function GenreTag({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-0.5 border rounded-[5] text-[0.8em] bg-background">
      <p>#{children}</p>
    </div>
  );
}
