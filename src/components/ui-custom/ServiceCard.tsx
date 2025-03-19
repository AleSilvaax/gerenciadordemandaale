
import React from "react";
import { MoreVertical, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TeamMember } from "@/types/service";
import { TeamMemberAvatar } from "@/components/ui-custom/TeamMemberAvatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Link } from "react-router-dom";
import StatusBadge from "@/components/ui-custom/StatusBadge";

export interface ServiceCardProps {
  id: string;
  title: string;
  status: "pendente" | "concluido" | "cancelado";
  location: string;
  technician: TeamMember[];
  onDelete?: (id: string) => void;
}

export function ServiceCard({
  id,
  title,
  status,
  location,
  technician,
  onDelete,
}: ServiceCardProps) {
  return (
    <Card className="overflow-hidden border border-white/10">
      <CardContent className="p-0">
        <div className="p-4 flex justify-between items-start">
          <Link to={`/demandas/${id}`} className="flex-1">
            <div className="space-y-1">
              <div className="flex justify-between">
                <h3 className="font-medium truncate">{title}</h3>
              </div>
              <div className="flex items-center text-xs text-muted-foreground">
                <MapPin size={12} className="mr-1" />
                <span className="truncate">{location}</span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <div className="flex -space-x-2">
                  {technician.slice(0, 3).map((tech) => (
                    <TeamMemberAvatar
                      key={tech.id}
                      src={tech.avatar}
                      name={tech.name}
                      size="sm"
                      className="border-2 border-background"
                    />
                  ))}
                  {technician.length > 3 && (
                    <Badge
                      variant="secondary"
                      className="ml-1 h-8 rounded-full border-2 border-background"
                    >
                      +{technician.length - 3}
                    </Badge>
                  )}
                </div>
                <StatusBadge status={status} />
              </div>
            </div>
          </Link>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-2 rounded-full hover:bg-accent">
                <MoreVertical size={16} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link to={`/demandas/${id}`}>Ver detalhes</Link>
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onDelete(id);
                  }}
                >
                  Excluir
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
}
