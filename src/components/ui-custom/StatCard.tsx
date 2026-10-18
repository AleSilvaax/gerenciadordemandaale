import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  tone?: string;
  title: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
  className?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
}) => {
  return (
    <Card
      className={cn(
        "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md transition-all duration-200 rounded-xl",
        className
      )}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {title}
            </p>
            <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
              {value}
            </div>
          </div>
          {icon && (
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
              {icon}
            </div>
          )}
        </div>
        {description && (
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  );
};
