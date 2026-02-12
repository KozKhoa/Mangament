import { snakeCaseToCapitalizeWord } from "@/utils/string";

export default function RoleTag({ className, role }: { className?: string; role: string }) {
  return (
    <div
      className={`
        ${role === "admin" ? "bg-yellow-400/30" : "bg-foreground/5"} 
        text-center rounded-md ${className}`}
    >
      {snakeCaseToCapitalizeWord(role ?? "")}
    </div>
  );
}
