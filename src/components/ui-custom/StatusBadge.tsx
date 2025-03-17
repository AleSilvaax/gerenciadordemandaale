
import React from "react";
import { cn } from "@/lib/utils";
import { ServiceStatus } from "@/types/service";

interface StatusBadgeProps {
  status: ServiceStatus;
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

// Default export for React.lazy()
export default StatusBadge;
