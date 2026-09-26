export default function NoFilterResult({ onResetFilter }: { onResetFilter?: () => void }) {
  return (
    <div className="w-full flex flex-col gap-5 py-20 justify-center items-center">
      <img className="w-20 h-20" src={"/filter-color.png"}></img>
      <h2>Không có kết quả</h2>
      <p>Vui lòng điều chỉnh bộ lọc</p>
      <button
        disabled={onResetFilter ? false : true}
        className={`px-5 py-2 bg-foreground text-background-items rounded-sm 
          ${onResetFilter ? "cursor-pointer" : ""}`}
        onClick={() => onResetFilter?.()}
      >
        Xóa bộ lọc
      </button>
    </div>
  );
}
