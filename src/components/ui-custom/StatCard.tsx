
import React, { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
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
  className 
}) => {
  return (
    <Card className={cn("overflow-hidden transition-all hover:scale-[1.02] bg-card/70 backdrop-blur-sm", className)}>
      <CardContent className="p-4 sm:p-6">
        <div className="flex items-center justify-between">
          <div className="flex flex-col flex-1 min-w-0">
            <p className="text-xs sm:text-sm font-medium text-muted-foreground mb-1 text-left-force text-no-wrap">
              {title}
            </p>
            <div className="text-2xl sm:text-3xl font-bold text-left-force">{value}</div>
            {description && (
              <p className="text-xs text-muted-foreground mt-2 text-left-force line-clamp-2">
                {description}
              </p>
            )}
          </div>
          
          {icon && (
            <div className="rounded-full bg-background/60 p-2 sm:p-3 backdrop-blur-sm border border-border/20 ml-3 flex-shrink-0">
              {icon}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
