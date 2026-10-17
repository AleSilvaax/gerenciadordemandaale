import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  Activity,
  Target,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticsCardsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
  completionRate: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  total,
  pending,
  completed,
  highPriority,
  completionRate,
}) => {
  const stats = [
    {
      title: "Total",
      value: total,
      icon: Activity,
      iconBox: "bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400",
    },
    {
      title: "Pendentes",
      value: pending,
      icon: Clock,
      iconBox:
        "bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400",
    },
    {
      title: "Concluídas",
      value: completed,
      icon: CheckCircle2,
      iconBox:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400",
    },
    {
      title: "Alta Prioridade",
      value: highPriority,
      icon: AlertTriangle,
      iconBox:
        "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400",
    },
    {
      title: "Taxa de Conclusão",
      value: `${completionRate}%`,
      icon: Target,
      iconBox:
        "bg-indigo-50 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {stats.map((stat, idx) => {
        const Icon = stat.icon;
        const isLastOdd = idx === stats.length - 1;
        return (
          <Card
            key={stat.title}
            className={cn(
              "bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl",
              isLastOdd && "col-span-2 sm:col-span-1"
            )}
          >
            <CardContent className="p-3.5 sm:p-4 flex items-center justify-between gap-3">
              <div className="space-y-0.5 min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 truncate">
                  {stat.title}
                </p>
                <p className="text-xl sm:text-2xl font-bold font-mono text-slate-900 dark:text-white">
                  {stat.value}
                </p>
              </div>
              <div
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  stat.iconBox
                )}
              >
                <Icon className="h-4 w-4" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
