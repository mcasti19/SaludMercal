import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  change?: number;
  changeType?: "up" | "down" | "neutral";
  colorClass?: string;
  bgClass?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  change,
  changeType = "neutral",
  colorClass = "text-blue-400",
  bgClass = "bg-blue-500/10",
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "relative bg-white/80 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700/50 rounded-2xl p-5 hover:border-slate-300 dark:hover:border-slate-600/50 transition-all duration-200 group overflow-hidden shadow-sm dark:shadow-none",
        className
      )}
    >
      {/* Background glow */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300",
          bgClass.replace("bg-", "bg-gradient-to-br from-").replace("/10", "/5 to-transparent")
        )}
      />

      <div className="relative flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-slate-500 dark:text-slate-400 text-xs font-medium uppercase tracking-wider truncate">
            {label}
          </p>
          <p className="text-slate-900 dark:text-white text-3xl font-bold mt-1 tabular-nums">
            {value}
          </p>
          {change !== undefined && (
            <p
              className={cn(
                "text-xs mt-1 font-medium",
                changeType === "up" && "text-emerald-600 dark:text-emerald-400",
                changeType === "down" && "text-red-600 dark:text-red-400",
                changeType === "neutral" && "text-slate-500 dark:text-slate-400"
              )}
            >
              {changeType === "up" && "↑ "}
              {changeType === "down" && "↓ "}
              {change}% vs. semana anterior
            </p>
          )}
        </div>
        <div
          className={cn(
            "flex items-center justify-center w-12 h-12 rounded-xl shrink-0",
            bgClass
          )}
        >
          <Icon className={cn("w-6 h-6", colorClass)} />
        </div>
      </div>
    </div>
  );
}
