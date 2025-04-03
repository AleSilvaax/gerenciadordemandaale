
import React from "react";
import { cn } from "@/lib/utils";
import { StatusBadge } from "./StatusBadge";
import { TeamMemberAvatar } from "./TeamMemberAvatar";
import { MoreVertical, Edit, Trash2 } from "lucide-react";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import { Service } from "@/types/serviceTypes";

interface ServiceCardProps {
  service: Service;
  className?: string;
  onDelete?: (id: string) => void;
}

export const ServiceCard: React.FC<ServiceCardProps> = ({
  service,
  className,
  onDelete,
}) => {
  const { id, title, status, location, technician } = service;
  
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
      
      <div className="flex items-center">
        <div className="text-sm font-medium text-primary mr-2">{id}</div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full flex items-center justify-center bg-secondary/50 hover:bg-secondary">
              <MoreVertical size={16} />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <Link to={`/demandas/${id}`}>
              <DropdownMenuItem className="cursor-pointer">
                <Edit size={16} className="mr-2" />
                Gerenciar
              </DropdownMenuItem>
            </Link>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              className="cursor-pointer text-destructive focus:text-destructive"
              onClick={() => onDelete && onDelete(id)}
            >
              <Trash2 size={16} className="mr-2" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
};
