
import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface TrendData {
  value: number;
  isPositive: boolean;
}

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: ReactNode;
  description?: string;
  className?: string;
  trend?: TrendData;
}

export const StatCard: React.FC<StatCardProps> = ({ 
  title, 
  value, 
  icon, 
  description, 
  className,
  trend
}) => {
  return (
    <Card className={cn("overflow-hidden transition-all hover:scale-[1.02]", className)}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <div className="text-3xl font-bold">{value}</div>
            {trend && (
              <div className={`flex items-center mt-2 text-xs ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}%
              </div>
            )}
            {description && (
              <p className="text-xs text-muted-foreground mt-2 max-w-40 line-clamp-2">
                {description}
              </p>
            )}
          </div>
          
          {icon && (
            <div className="rounded-full bg-background/50 p-3 backdrop-blur-sm border border-white/10">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
