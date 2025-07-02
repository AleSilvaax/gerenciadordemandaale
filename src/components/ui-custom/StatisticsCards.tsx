
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Users, CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface StatisticsCardsProps {
  total: number;
  pending: number;
  inProgress: number;
  completed: number;
  completionRate: number;
}

export const StatisticsCards: React.FC<StatisticsCardsProps> = ({
  total,
  pending,
  inProgress,
  completed,
  completionRate
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
      <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/50 dark:to-blue-900/50 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Total</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{total}</p>
            </div>
            <Users className="w-6 h-6 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200 dark:from-yellow-950/50 dark:to-yellow-900/50 dark:border-yellow-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pendentes</p>
              <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{pending}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 dark:from-purple-950/50 dark:to-purple-900/50 dark:border-purple-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-700 dark:text-purple-300">Em Andamento</p>
              <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{inProgress}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-purple-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/50 dark:to-green-900/50 dark:border-green-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-700 dark:text-green-300">Concluídas</p>
              <p className="text-2xl font-bold text-green-900 dark:text-green-100">{completed}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/50 dark:to-orange-900/50 dark:border-orange-800">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-orange-700 dark:text-orange-300">Taxa</p>
              <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{completionRate}%</p>
            </div>
            <TrendingUp className="w-6 h-6 text-orange-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
