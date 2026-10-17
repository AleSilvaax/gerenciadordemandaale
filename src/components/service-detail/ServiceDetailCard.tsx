import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  Edit2,
  Building2,
  FileText,
  Wrench,
  AlertTriangle,
} from "lucide-react";
import { Service, TeamMember } from "@/types/serviceTypes";
import { StatusBadge } from "@/components/ui-custom/StatusBadge";
import { TechnicianAssigner } from "@/components/ui-custom/TechnicianAssigner";
import { ServiceEditForm } from "./ServiceEditForm";
import { assignTechnicianToService } from "@/services/servicesDataService";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

interface ServiceDetailCardProps {
  service: Service;
  onServiceUpdate: () => void;
}

export const ServiceDetailCard: React.FC<ServiceDetailCardProps> = ({
  service,
  onServiceUpdate,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const { user } = useAuth();

  const isConcluded = service.status === "concluido";
  const canManage =
    user &&
    ["super_admin", "owner", "administrador", "gestor"].includes(user.role);

  const formatDateTime = (dateStr?: string | null) => {
    if (!dateStr) return "Não definido";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getPriorityBadgeStyle = (priority?: string) => {
    switch (priority) {
      case "urgente":
      case "alta":
        return "bg-rose-50 text-rose-700 border-rose-200";
      case "media":
        return "bg-amber-50 text-amber-700 border-amber-200";
      default:
        return "bg-emerald-50 text-emerald-700 border-emerald-200";
    }
  };

  const handleAssignTechnician = async (technician: TeamMember | null) => {
    await assignTechnicianToService(service.id, technician?.id || null);
    onServiceUpdate();
  };

  if (isEditing && !isConcluded) {
    return (
      <ServiceEditForm
        service={service}
        onServiceUpdate={() => {
          setIsEditing(false);
          onServiceUpdate();
        }}
        onCancel={() => setIsEditing(false)}
      />
    );
  }

  const technician = service.technicians?.[0];

  return (
    <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl overflow-hidden">
      <CardContent className="p-5 space-y-5">
        {/* Topo: Localidade, Status e Botão Editar (oculto se concluído) */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="h-4 w-4 text-blue-600 shrink-0" />
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {service.location || service.city || "São Paulo"}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <StatusBadge status={service.status} />
            {!isConcluded && canManage && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
                className="h-8 text-xs gap-1.5 border-slate-200"
              >
                <Edit2 className="h-3.5 w-3.5" />
                Editar
              </Button>
            )}
          </div>
        </div>

        {/* Faixa de Resumo Rápido: Prioridade e Tipo */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Prioridade
            </p>
            <div className="mt-1">
              <Badge
                variant="outline"
                className={cn(
                  "capitalize text-xs font-semibold",
                  getPriorityBadgeStyle(service.priority)
                )}
              >
                {(service.priority === "alta" ||
                  service.priority === "urgente") && (
                  <AlertTriangle className="h-3 w-3 mr-1" />
                )}
                {service.priority || "Média"}
              </Badge>
            </div>
          </div>

          <div className="p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Tipo de Serviço
            </p>
            <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-blue-600" />
              {service.serviceType || "Vistoria"}
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1 p-3 rounded-xl bg-slate-50/80 dark:bg-slate-950 border border-slate-100 dark:border-slate-800">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Data de Abertura
            </p>
            <p className="text-sm font-mono font-semibold text-slate-900 dark:text-white mt-1">
              {service.creationDate
                ? new Date(service.creationDate).toLocaleDateString("pt-BR")
                : "-"}
            </p>
          </div>
        </div>

        {/* Dados do Cliente e Endereço */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 text-blue-600" />
            Dados do Cliente e Local
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <User className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400">Cliente</p>
                <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                  {service.client || "Não informado"}
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600">
                <MapPin className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-medium text-slate-400">
                  Endereço de Execução
                </p>
                <p className="text-sm font-medium text-slate-800 dark:text-slate-200">
                  {[service.address, service.city].filter(Boolean).join(", ") ||
                    service.location ||
                    "Não informado"}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Cronograma */}
        <div className="space-y-2.5">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-blue-600" />
            Cronograma
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600">
                <Calendar className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">Criação</p>
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateTime(service.creationDate)}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600">
                <Clock className="h-4 w-4" />
              </div>
              <div>
                <p className="text-[11px] font-medium text-slate-400">
                  Prazo de Vencimento
                </p>
                <p className="text-xs font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {formatDateTime(service.dueDate)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Descrição (se existir) */}
        {service.description && (
          <div className="space-y-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <FileText className="h-3.5 w-3.5 text-blue-600" />
              Descrição Técnica
            </h3>
            <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-slate-950 border border-slate-200/60 text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
              {service.description}
            </div>
          </div>
        )}

        {/* Técnico Responsável */}
        <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-blue-600" />
            Técnico Responsável
          </h3>

          <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/40">
            <div className="flex items-center gap-3">
              <Avatar className="h-9 w-9 border border-slate-200">
                <AvatarImage src={technician?.avatar} />
                <AvatarFallback className="bg-blue-50 text-blue-600 text-xs font-bold">
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
              <div>
                <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                  {technician?.name || "Não atribuído"}
                </p>
                <p className="text-xs text-slate-500 capitalize">
                  {technician?.role || "Aguardando designação"}
                </p>
              </div>
            </div>
          </div>

          {/* Só permite alterar atribuição se a demanda NÃO estiver concluída */}
          {!isConcluded && canManage && (
            <div className="pt-1">
              <p className="text-xs font-medium text-slate-500 mb-2">
                Alterar Atribuição
              </p>
              <TechnicianAssigner
                currentTechnicianId={technician?.id}
                onAssign={handleAssignTechnician}
              />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
