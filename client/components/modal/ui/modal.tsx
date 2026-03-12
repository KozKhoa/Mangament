export default function Modal({ children, onClickOutside, zIndex = 50 }: { children?: React.ReactNode; onClickOutside?: () => void; zIndex?: number }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ zIndex }}>
      <div className="absolute inset-0 bg-black/60" onClick={onClickOutside} />

      <div className="relative rounded-md bg-background-items p-5 shadow">{children}</div>
    </div>
  );
}
