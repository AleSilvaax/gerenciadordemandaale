
import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Activity, Target } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";

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
  const isMobile = useIsMobile();

  const stats = [
    {
      title: "Total",
      value: total,
      icon: Activity,
      color: "text-blue-600",
      bgColor: "bg-blue-50 dark:bg-blue-900/20",
    },
    {
      title: "Pendentes",
      value: pending,
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50 dark:bg-orange-900/20",
    },
    {
      title: "Concluídas",
      value: completed,
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50 dark:bg-green-900/20",
    },
    {
      title: "Alta Prioridade",
      value: highPriority,
      icon: AlertTriangle,
      color: "text-red-600",
      bgColor: "bg-red-50 dark:bg-red-900/20",
    },
    {
      title: "Taxa de Conclusão",
      value: `${completionRate}%`,
      icon: Target,
      color: "text-purple-600",
      bgColor: "bg-purple-50 dark:bg-purple-900/20",
    },
  ];

  if (isMobile) {
    return (
      <div className="grid grid-cols-2 gap-3">
        {stats.slice(0, 4).map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-lg font-bold">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-4 h-4 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
        
        {/* Taxa de conclusão em card separado no mobile */}
        <Card className="col-span-2 overflow-hidden">
          <CardContent className="p-3">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Taxa de Conclusão
                </p>
                <p className="text-lg font-bold">
                  {completionRate}%
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 p-2 rounded-full">
                <Target className="w-4 h-4 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="overflow-hidden hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-2xl font-bold">
                    {stat.value}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
