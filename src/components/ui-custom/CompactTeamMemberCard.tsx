import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, CheckCircle2, Clock, Star } from "lucide-react";
import { TeamMember } from "@/types/serviceTypes";
import { cn } from "@/lib/utils";

interface CompactTeamMemberCardProps {
  member: TeamMember;
  onEdit?: (member: TeamMember) => void;
  stats?: {
    completedServices: number;
    pendingServices: number;
    inProgressServices?: number;
    totalServices?: number;
    highPriorityServices?: number;
    avgRating: number;
    completionRate?: number;
    joinDate: string;
  };
}

export const CompactTeamMemberCard: React.FC<CompactTeamMemberCardProps> = ({
  member,
  onEdit,
  stats,
}) => {
  const memberStats = stats ||
    member.stats || {
      completedServices: 0,
      pendingServices: 0,
      avgRating: 0,
      joinDate: new Date().toLocaleDateString("pt-BR"),
    };

  const getRoleDisplayName = (role: string) => {
    switch (role) {
      case "tecnico":
        return "Técnico";
      case "administrador":
        return "Administrador";
      case "gestor":
        return "Gestor";
      case "requisitor":
        return "Requisitor";
      default:
        return role;
    }
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case "administrador":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "gestor":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "tecnico":
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  // Oculta e-mails fictícios gerados com @empresa.com ou @exemplo.com
  const hasRealEmail =
    member.email &&
    !member.email.endsWith("@empresa.com") &&
    !member.email.endsWith("@exemplo.com");

  return (
    <Card
      onClick={() => onEdit?.(member)}
      className="group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md hover:border-blue-300 transition-all rounded-xl"
    >
      <CardContent className="p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar className="h-10 w-10 border border-slate-200">
              <AvatarImage src={member.avatar} />
              <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
                {member.name
                  ?.split(" ")
                  .map((n) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2) || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="min-w-0">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white truncate capitalize">
                {member.name}
              </h3>
              <p className="text-xs text-slate-500 truncate">
                {hasRealEmail
                  ? member.email
                  : `Função: ${getRoleDisplayName(member.role)}`}
              </p>
            </div>
          </div>

          <Badge
            variant="outline"
            className={cn(
              "text-[11px] font-medium px-2.5 py-0.5 shrink-0",
              getRoleBadgeStyle(member.role)
            )}
          >
            {getRoleDisplayName(member.role)}
          </Badge>
        </div>

        <div className="flex items-center justify-between mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-4">
            <span className="inline-flex items-center gap-1 font-medium text-emerald-700 dark:text-emerald-400">
              <CheckCircle2 className="h-3.5 w-3.5" />
              {memberStats.completedServices} concluído
              {memberStats.completedServices !== 1 ? "s" : ""}
            </span>

            <span className="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-400">
              <Clock className="h-3.5 w-3.5" />
              {memberStats.pendingServices} pendente
              {memberStats.pendingServices !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {memberStats.completedServices > 0 && memberStats.avgRating > 0 && (
              <span className="inline-flex items-center gap-1 font-mono text-xs font-semibold text-amber-600">
                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                {memberStats.avgRating.toFixed(1)}
              </span>
            )}
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
