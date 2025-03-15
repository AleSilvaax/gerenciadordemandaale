
import React from "react";
import { cn } from "@/lib/utils";

type StatusType = "concluido" | "pendente" | "cancelado";

interface StatusBadgeProps {
  status: StatusType;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className }) => {
  return (
    <span className={cn("status-badge", `status-${status}`, className)}>
      {status === "concluido" && "Concluído"}
      {status === "pendente" && "Pendente"}
      {status === "cancelado" && "Cancelado"}
    </span>
  );
};
