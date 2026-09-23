export default function Modal({ children, onClickOutside, zIndex = 50 }: { children?: React.ReactNode; onClickOutside?: () => void; zIndex?: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex }}>
      <div
        className="absolute inset-0 bg-black/60"
        onClick={(e) => {
          e.stopPropagation();
          onClickOutside?.();
        }}
      />

      <div
        className="relative rounded-lg bg-background-items p-5 shadow-2xl border border-foreground/10 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
