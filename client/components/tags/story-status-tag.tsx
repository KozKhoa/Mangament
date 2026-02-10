import Tag from "./tag";

interface StatusTagProps {
  children?: string | React.ReactNode;
  className?: string;
  status?: string;
}

function mapStatus(status: string) {
  if (status === "ongoing") return "bg-[#3AAED8]! text-black!";
  if (status === "finished") return "bg-[#0C7C59]! text-white!";
  if (status === "postpone") return "bg-[#FFCB77]! text-black!";
  if (status === "upcoming") return "bg-[#D3EFBD]! text-black!";
  return "red";
}

export default function StoryStatusTag({ children, status, className }: StatusTagProps) {
  return <Tag className={`${mapStatus(status ?? "")} ${className ?? ""}`}>{children}</Tag>;
}
