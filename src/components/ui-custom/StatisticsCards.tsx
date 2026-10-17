import React from "react";
import { CheckCircle, Clock, AlertTriangle, Activity, Target } from "lucide-react";
import { StatCard, KpiTone } from "./StatCard";

interface StatisticsCardsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  highPriority: number;
  completionRate: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ total, pending, completed, highPriority, completionRate }) => {
  const stats: { title: string; value: string | number; icon: React.ElementType; tone: KpiTone }[] = [
    { title: "Total", value: total, icon: Activity, tone: "blue" },
    { title: "Pendentes", value: pending, icon: Clock, tone: "amber" },
    { title: "Concluídas", value: completed, icon: CheckCircle, tone: "emerald" },
    { title: "Alta Prioridade", value: highPriority, icon: AlertTriangle, tone: "rose" },
    { title: "Taxa de Conclusão", value: `${completionRate}%`, icon: Target, tone: "slate" },
  ];
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <StatCard key={i} title={s.title} value={s.value} tone={s.tone} icon={<Icon />}
            className={i === 4 ? "col-span-2 lg:col-span-1" : undefined} />
        );
      })}
    </div>
  );
};
