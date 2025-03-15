
import React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { TeamMemberAvatar } from "./TeamMemberAvatar";

interface ServiceCardProps {
  id: string;
  title: string;
  status: "concluido" | "pendente" | "cancelado";
  location: string;
  technician: {
    id: string;
    name: string;
    avatar: string;
  };
  className?: string;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  id,
  title,
  status,
  location,
  technician,
  className,
}) => {
  return (
    <div 
      className={cn(
        "flex items-center p-3 rounded-lg glass-card mb-2 animate-slideIn",
        className
      )}
    >
      <TeamMemberAvatar 
        src={technician.avatar} 
        name={technician.name} 
        size="md" 
        className="mr-3" 
      />
      
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-medium truncate">{title}</h3>
        <div className="flex items-center text-xs text-muted-foreground mt-0.5">
          <span>Status: </span>
          <StatusBadge status={status} className="ml-1" />
        </div>
        <div className="text-xs text-muted-foreground mt-0.5 truncate">
          Local: {location}
        </div>
      </div>
      
      <div className="text-sm font-medium text-primary ml-2">{id}</div>
    </div>
  );
};
