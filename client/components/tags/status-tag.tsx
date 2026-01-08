import Tag from "./tag";

interface StatusTagProps {
  children?: string | React.ReactNode;
  className?: string;
  status?: string;
}

function mapStatus(status: string) {
  if (status === "ongoing") return "bg-[#3AAED8]! text-black/80!";
  if (status === "finished") return "bg-[#0C7C59]! text-white/80!";
  if (status === "postpone") return "bg-[#FFCB77]! text-black/80!";
  if (status === "upcoming") return "bg-[#D3EFBD]! text-black/80!";
  return "red";
}

export default function StatusTag({ children, status, className }: StatusTagProps) {
  return <Tag className={`${mapStatus(status ?? "")} ${className ?? ""}`}>{children}</Tag>;
}
