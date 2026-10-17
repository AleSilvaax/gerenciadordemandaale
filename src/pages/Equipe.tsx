import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getTeamMembers, getServices } from "@/services/servicesDataService";
import { TeamMember, Service } from "@/types/serviceTypes";
import { CompactTeamMemberCard } from "@/components/ui-custom/CompactTeamMemberCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  Shield,
  Wrench,
  UserCheck,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Equipe = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("todos");

  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
    role: "tecnico",
  });
  const [isSaving, setIsSaving] = useState(false);

  const loadTeamData = async () => {
    setIsLoading(true);
    try {
      const [teamData, servicesData] = await Promise.all([
        getTeamMembers(),
        getServices().catch(() => []),
      ]);
      setMembers(teamData || []);
      setServices(servicesData || []);
    } catch (error) {
      console.error("Erro ao carregar equipe:", error);
      toast.error("Não foi possível carregar os membros da equipe.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTeamData();
  }, []);

  const roleCounts = useMemo(() => {
    const total = members.length;
    const admins = members.filter((m) => m.role === "administrador").length;
    const gestores = members.filter((m) => m.role === "gestor").length;
    const tecnicos = members.filter((m) => m.role === "tecnico").length;
    return { total, admins, gestores, tecnicos };
  }, [members]);

  // Calcula os serviços concluídos e pendentes reais de cada membro
  const memberStatsMap = useMemo(() => {
    const map: Record<
      string,
      {
        completedServices: number;
        pendingServices: number;
        avgRating: number;
        joinDate: string;
      }
    > = {};

    members.forEach((m) => {
      const assigned = services.filter((s) =>
        s.technicians?.some(
          (t) =>
            t.id === m.id ||
            t.name?.toLowerCase() === m.name?.toLowerCase()
        )
      );
      const completedServices = assigned.filter(
        (s) => s.status === "concluido"
      ).length;
      const pendingServices = assigned.filter(
        (s) =>
          s.status === "pendente" || (s.status as string) === "em_andamento"
      ).length;

      map[m.id] = {
        completedServices,
        pendingServices,
        avgRating: 0,
        joinDate: new Date().toLocaleDateString("pt-BR"),
      };
    });

    return map;
  }, [members, services]);

  const filteredMembers = useMemo(() => {
    if (roleFilter === "todos") return members;
    return members.filter((m) => m.role === roleFilter);
  }, [members, roleFilter]);

  const handleOpenEdit = (member: TeamMember) => {
    const cleanEmail =
      member.email &&
      !member.email.endsWith("@empresa.com") &&
      !member.email.endsWith("@exemplo.com")
        ? member.email
        : "";

    setEditingMember(member);
    setEditForm({
      name: member.name || "",
      email: cleanEmail,
      phone: member.phone || "",
      role: member.role || "tecnico",
    });
  };

  const handleSaveMember = async () => {
    if (!editingMember) return;
    if (!editForm.name.trim()) {
      toast.error("O nome do membro é obrigatório.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Atualiza o nome na tabela profiles
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ name: editForm.name.trim() })
        .eq("id", editingMember.id);

      if (profileError) throw profileError;

      // 2. Verifica se já existe registro em user_roles e atualiza ou insere
      const { data: existingRole } = await supabase
        .from("user_roles")
        .select("id")
        .eq("user_id", editingMember.id)
        .maybeSingle();

      if (existingRole) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .update({ role: editForm.role as any })
          .eq("user_id", editingMember.id);
        if (roleError) throw roleError;
      } else {
        const { error: insertRoleError } = await supabase
          .from("user_roles")
          .insert({
            user_id: editingMember.id,
            role: editForm.role as any,
          });
        if (insertRoleError) throw insertRoleError;
      }

      // Atualiza estado local imediatamente e recarrega do banco
      setMembers((prev) =>
        prev.map((m) =>
          m.id === editingMember.id
            ? {
                ...m,
                name: editForm.name.trim(),
                role: editForm.role as any,
                phone: editForm.phone,
              }
            : m
        )
      );

      toast.success("Dados e função do membro atualizados no sistema!");
      setEditingMember(null);
      await loadTeamData();
    } catch (error: any) {
      console.error("Erro ao atualizar membro no Supabase:", error);
      toast.error("Não foi possível gravar a alteração no banco de dados", {
        description:
          error?.message || "Verifique suas permissões de administrador/gestor.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={() => navigate(-1)}
          className="h-9 w-9 rounded-lg border-slate-200 bg-white"
        >
          <ArrowLeft className="h-4 w-4 text-slate-700" />
        </Button>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Gestão de Equipe
          </h1>
          <p className="text-xs text-slate-500">
            Gerencie funções, permissões e produtividade dos colaboradores
          </p>
        </div>
      </div>

      {/* KPIs da Equipe */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total da Equipe"
            value={roleCounts.total}
            icon={<Users className="h-4 w-4 text-blue-600" />}
          />
          <StatCard
            title="Gestores"
            value={roleCounts.gestores}
            icon={<UserCheck className="h-4 w-4 text-indigo-600" />}
          />
          <StatCard
            title="Técnicos"
            value={roleCounts.tecnicos}
            icon={<Wrench className="h-4 w-4 text-emerald-600" />}
          />
          <StatCard
            title="Administradores"
            value={roleCounts.admins}
            icon={<Shield className="h-4 w-4 text-rose-600" />}
          />
        </div>
      )}

      {/* Filtro e Lista de Membros */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-xl p-4 space-y-4 shadow-2xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            Membros Cadastrados
          </h2>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-48 h-9 text-xs">
              <SelectValue placeholder="Filtrar por função" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todas as Funções</SelectItem>
              <SelectItem value="tecnico">Técnicos</SelectItem>
              <SelectItem value="gestor">Gestores</SelectItem>
              <SelectItem value="administrador">Administradores</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredMembers.length === 0 ? (
          <div className="py-10 text-center text-sm text-slate-500">
            Nenhum membro encontrado para este filtro.
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMembers.map((member) => (
              <CompactTeamMemberCard
                key={member.id}
                member={member}
                stats={memberStatsMap[member.id]}
                onEdit={handleOpenEdit}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Edição com Persistência no Supabase */}
      <Dialog
        open={!!editingMember}
        onOpenChange={(open) => !open && setEditingMember(null)}
      >
        <DialogContent className="sm:max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">
              Editar Membro da Equipe
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              Altere o nome ou o nível de acesso do colaborador no sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Nome Completo
              </Label>
              <Input
                value={editForm.name}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="Nome do colaborador"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold uppercase tracking-wider text-slate-600">
                Função no Sistema
              </Label>
              <Select
                value={editForm.role}
                onValueChange={(val) =>
                  setEditForm((prev) => ({ ...prev, role: val }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tecnico">Técnico</SelectItem>
                  <SelectItem value="gestor">Gestor</SelectItem>
                  <SelectItem value="administrador">Administrador</SelectItem>
                  <SelectItem value="requisitor">Requisitor</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex justify-end gap-2 pt-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingMember(null)}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={handleSaveMember}
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Salvar Alterações"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Equipe;
