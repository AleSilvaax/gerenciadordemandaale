
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
          variant: "default" as const,
          className: "bg-green-500 hover:bg-green-600",
        };
      case "pendente":
        return {
          label: "Pendente",
          variant: "secondary" as const,
          className: "bg-yellow-500 hover:bg-yellow-600 text-black",
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

  const { label, variant, className: statusClassName } = getStatusConfig(status);

  return (
    <Badge 
      variant={variant} 
      className={cn("text-xs font-medium", statusClassName, className)}
    >
      {label}
    </Badge>
  );
};
