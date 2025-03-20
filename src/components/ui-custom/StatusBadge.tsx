
import React from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

type StatusType = "concluido" | "pendente" | "cancelado";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  const getStatusConfig = (status: StatusType) => {
    switch (status) {
      case "concluido":
        return {
          label: "Concluído",
          variant: "success" as const,
        };
      case "pendente":
        return {
          label: "Pendente",
          variant: "warning" as const,
        };
      case "cancelado":
        return {
          label: "Cancelado",
          variant: "destructive" as const,
        };
      default:
        return {
          label: "Desconhecido",
          variant: "outline" as const,
        };
    }
  };

  const { label, variant } = getStatusConfig(status);

  return (
    <Badge 
      variant={variant} 
      className={cn("text-xs font-medium", className)}
    >
      {label}
    </Badge>
  );
};
