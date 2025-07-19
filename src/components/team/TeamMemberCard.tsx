
import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User, Edit, Trash2 } from "lucide-react";
import { TeamMember } from '@/types/serviceTypes';

interface TeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  onDelete?: (memberId: string) => void;
}

export const TeamMemberCard: React.FC<TeamMemberCardProps> = ({ 
  member, 
  onEdit, 
  onDelete 
}) => {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center space-x-3">
          <Avatar>
            <AvatarImage src={member.avatar} alt={member.name} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h3 className="font-medium text-sm">{member.name}</h3>
            <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          <div className="flex items-center space-x-2 text-xs text-muted-foreground">
            <User className="h-3 w-3" />
            <span>ID: {member.id}</span>
          </div>
          
          <div className="flex gap-2 pt-2">
            {onEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(member)}
                className="flex-1"
              >
                <Edit className="h-3 w-3 mr-1" />
                Editar
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="destructive"
                onClick={() => onDelete(member.id)}
                className="flex-1"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Remover
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
