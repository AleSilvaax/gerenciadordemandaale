
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, AlertTriangle, CheckCircle } from "lucide-react";
import { format } from 'date-fns';

interface DeadlineItem {
  id: string;
  title: string;
  dueDate: string;
  status: 'pending' | 'overdue' | 'completed';
  priority: 'low' | 'medium' | 'high';
}

interface DeadlineManagerProps {
  deadlines: DeadlineItem[];
}

export const DeadlineManager: React.FC<DeadlineManagerProps> = ({ deadlines }) => {
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'overdue':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Gerenciador de Prazos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {deadlines.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              Nenhum prazo encontrado
            </p>
          ) : (
            deadlines.map((deadline) => (
              <div
                key={deadline.id}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {getStatusIcon(deadline.status)}
                  <div>
                    <h4 className="font-medium">{deadline.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Vencimento: {format(new Date(deadline.dueDate), 'dd/MM/yyyy')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getPriorityColor(deadline.priority)}>
                    {deadline.priority === 'high' ? 'Alta' : 
                     deadline.priority === 'medium' ? 'Média' : 'Baixa'}
                  </Badge>
                  <Badge className={getStatusColor(deadline.status)}>
                    {deadline.status === 'completed' ? 'Concluído' :
                     deadline.status === 'overdue' ? 'Atrasado' : 'Pendente'}
                  </Badge>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
