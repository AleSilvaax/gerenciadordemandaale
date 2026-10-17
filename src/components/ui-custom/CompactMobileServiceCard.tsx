import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar, AlertTriangle, ChevronRight, MapPin } from "lucide-react";
import { Service } from "@/types/serviceTypes";
import { useNavigate } from "react-router-dom";
import { StatusBadge } from "./StatusBadge";
import { cn } from "@/lib/utils";

interface CompactMobileServiceCardProps {
  service: Service;
  onClick?: () => void;
}

export const CompactMobileServiceCard: React.FC<CompactMobileServiceCardProps> = ({
  service,
  onClick,
}) => {
  const navigate = useNavigate();

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return null;
    const date = new Date(dateStr);
    return date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  };

  // Transforma "#SRV-1792121069721-2940" em "OS #2940"
  const formatShortOS = (num?: string | number) => {
    if (!num) return null;
    const str = String(num);
    const parts = str.split("-");
    const lastPart = parts[parts.length - 1];
    return `OS #${lastPart.replace("#", "")}`;
  };

  const getPriorityBorder = (priority?: string) => {
    switch (priority) {
      case "urgente":
      case "alta":
        return "border-l-4 border-l-rose-500";
      case "media":
        return "border-l-4 border-l-amber-500";
      default:
        return "border-l-4 border-l-emerald-500";
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority) {
      case "urgente":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "alta":
        return "bg-rose-50/80 text-rose-600 border-rose-200";
      case "media":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-slate-100 text-slate-600 border-slate-200";
    }
  };

  const handleCardClick = () => {
    if (onClick) {
      onClick();
    } else {
      navigate(`/demanda/${service.id}`);
    }
  };

  const technician = service.technicians?.[0];

  return (
    <Card
      onClick={handleCardClick}
      className={cn(
        "group cursor-pointer bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs hover:shadow-md hover:border-blue-300 transition-all duration-200 rounded-xl overflow-hidden",
        getPriorityBorder(service.priority)
      )}
    >
      <CardContent className="p-4">
        {/* Linha 1: OS Curta + Status */}
        <div className="flex items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            {service.number && (
              <span className="font-mono text-[11px] font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                {formatShortOS(service.number)}
              </span>
            )}
            {service.serviceType && (
              <span className="text-[11px] font-medium text-slate-500 truncate max-w-[140px]">
                {service.serviceType}
              </span>
            )}
          </div>
          <StatusBadge status={service.status} small />
        </div>

        {/* Linha 2: Título e Localização/Cliente */}
        <div className="space-y-1 mb-3">
          <h3 className="text-sm sm:text-base font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors line-clamp-1">
            {service.title}
          </h3>
          {(service.client || service.location) && (
            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="truncate">
                {[service.client, service.location].filter(Boolean).join(" • ")}
              </span>
            </div>
          )}
        </div>

        {/* Linha 3: Rodapé com Técnico, Prazo e Prioridade */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2 min-w-0">
            <Avatar className="h-6 w-6 border border-slate-200">
              <AvatarImage src={technician?.avatar} />
              <AvatarFallback className="text-[10px] font-semibold bg-slate-100 text-slate-700">
                {technician?.name
                  ? technician.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : "?"}
              </AvatarFallback>
            </Avatar>
            <span className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate max-w-[120px]">
              {technician?.name || "Não atribuído"}
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {service.priority && (
              <Badge
                variant="outline"
                className={cn(
                  "text-[10px] px-1.5 py-0 font-medium capitalize",
                  getPriorityBadge(service.priority)
                )}
              >
                {(service.priority === "alta" || service.priority === "urgente") && (
                  <AlertTriangle className="h-2.5 w-2.5 mr-1" />
                )}
                {service.priority}
              </Badge>
            )}

            {service.dueDate && (
              <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                <Calendar className="h-3 w-3 text-slate-400" />
                {formatDate(service.dueDate)}
              </span>
            )}

            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
