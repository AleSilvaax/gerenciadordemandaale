import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

export type KpiTone = "blue" | "emerald" | "amber" | "rose" | "slate";

const toneClasses: Record<KpiTone, string> = {
  blue: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400",
  emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400",
  amber: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400",
  rose: "bg-rose-50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400",
  slate: "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
};

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
  className?: string;
  tone?: KpiTone;
}

/** Card de KPI padronizado: fundo branco, título pequeno, valor mono, ícone em box suave. */
export const StatCard: React.FC<StatCardProps> = ({ title, value, icon, description, className, tone = "slate" }) => (
  <div
    className={cn(
      "w-full min-w-0 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 shadow-sm",
      className
    )}
  >
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500 uppercase tracking-wider truncate">{title}</p>
        <div className="mt-1 text-2xl font-bold font-mono text-slate-900 dark:text-white truncate">{value}</div>
        {description && <p className="mt-0.5 text-xs text-slate-500 truncate">{description}</p>}
      </div>
      {icon && (
        <div className={cn("h-9 w-9 shrink-0 rounded-lg flex items-center justify-center [&_svg]:h-4 [&_svg]:w-4 [&_svg]:text-current", toneClasses[tone])}>
          {icon}
        </div>
      )}
    </div>
  </div>
);
