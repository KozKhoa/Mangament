import { MouseEventHandler } from "react";

export interface StatsCardProps {
  className?: string;

  label?: string | React.ReactNode;
  subLabel?: string | number;
  value?: number;
  icon?: React.ReactNode;

  onClick?: MouseEventHandler<HTMLDivElement>;
}

export default function StatsCard({ label, subLabel, value, icon, onClick, className }: StatsCardProps) {
  return (
    <div
      onClick={onClick}
      className={` 
        flex flex-row gap-1 justify-center items-center
        bg-background-items px-5 py-2.5 rounded-md 
        border border-foreground/30 shadow-[0px_5px_12px_rgba(0,0,0,0.1)]
        ${className}`}
    >
      {/* Content for stats card */}
      <div className="flex flex-col gap-1 justify-center items-start w-full">
        <div className="text-foreground/80">{label}</div>
        <p className="text-[1.8em] text-foreground font-semibold ">{value}</p>
        <p className="text-foreground/80">{subLabel}</p>
      </div>

      {/* Icon for stats card */}
      <div className="w-12 h-12">{icon}</div>
    </div>
  );
}
