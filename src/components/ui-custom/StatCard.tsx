
import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: number | string;
  icon?: React.ReactNode;
  description?: string;
  className?: string;
  valueClassName?: string;
  titleClassName?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  description,
  className,
  valueClassName,
  titleClassName,
}) => {
  return (
    <div className={cn(
      "rounded-xl p-4 glass-card flex flex-col items-center justify-center text-center animate-scaleIn", 
      className
    )}>
      {icon && <div className="mb-2">{icon}</div>}
      <div className={cn("text-2xl font-bold", valueClassName)}>{value}</div>
      <div className={cn("text-xs text-muted-foreground mt-1", titleClassName)}>{title}</div>
      {description && <div className="text-xs text-muted-foreground mt-1">{description}</div>}
    </div>
  );
};
