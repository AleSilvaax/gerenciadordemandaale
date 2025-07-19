
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Activity, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle 
} from "lucide-react";

interface StatisticCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatisticCard: React.FC<StatisticCardProps> = ({ 
  title, 
  value, 
  description, 
  icon, 
  trend 
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
        {trend && (
          <div className={`text-xs mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% em relação ao mês anterior
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface StatisticsData {
  totalServices: number;
  completedServices: number;
  pendingServices: number;
  overdue: number;
  activeUsers: number;
}

interface StatisticsCardsProps {
  data: StatisticsData;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({ data }) => {
  const cards = [
    {
      title: "Total de Serviços",
      value: data.totalServices,
      description: "Serviços cadastrados no sistema",
      icon: <Activity className="h-4 w-4 text-muted-foreground" />,
      trend: { value: 12, isPositive: true }
    },
    {
      title: "Serviços Concluídos",
      value: data.completedServices,
      description: "Serviços finalizados com sucesso",
      icon: <CheckCircle className="h-4 w-4 text-green-600" />,
      trend: { value: 8, isPositive: true }
    },
    {
      title: "Serviços Pendentes",
      value: data.pendingServices,
      description: "Aguardando execução",
      icon: <Clock className="h-4 w-4 text-yellow-600" />,
      trend: { value: 3, isPositive: false }
    },
    {
      title: "Em Atraso",
      value: data.overdue,
      description: "Serviços que passaram do prazo",
      icon: <AlertCircle className="h-4 w-4 text-red-600" />,
      trend: { value: 15, isPositive: false }
    },
    {
      title: "Usuários Ativos",
      value: data.activeUsers,
      description: "Usuários conectados hoje",
      icon: <Users className="h-4 w-4 text-blue-600" />,
      trend: { value: 5, isPositive: true }
    }
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
      {cards.map((card, index) => (
        <StatisticCard key={index} {...card} />
      ))}
    </div>
  );
};
