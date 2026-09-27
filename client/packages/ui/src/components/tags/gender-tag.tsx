import { snakeCaseToCapitalizeWord } from "@/utils/string";

export default function GenderTag({ className, gender }: { className?: string; gender: string }) {
  return (
    <div
      className={`
        ${gender === "male" ? "bg-blue-400/40" : gender === "female" ? "bg-pink-500/40" : "bg-foreground/5"} 
        text-center rounded-md
        ${className}
    `}
    >
      {snakeCaseToCapitalizeWord(gender ?? "")}
    </div>
  );
}
