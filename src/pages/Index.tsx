import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { getServices, getTeamMembers } from "@/services/servicesDataService";
import { Service, TeamMember } from "@/types/serviceTypes";
import { CompactMobileServiceCard } from "@/components/ui-custom/CompactMobileServiceCard";
import { StatCard } from "@/components/ui-custom/StatCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ClipboardList,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Search,
  Plus,
  ArrowRight,
  RotateCcw,
} from "lucide-react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [services, setServices] = useState<Service[]>([]);
  const [technicians, setTechnicians] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");
  const [priorityFilter, setPriorityFilter] = useState("todas");
  const [techFilter, setTechFilter] = useState("todos");

  useEffect(() => {
    let mounted = true;
    const loadDashboardData = async () => {
      setIsLoading(true);
      try {
        const [servicesData, teamData] = await Promise.all([
          getServices(),
          getTeamMembers().catch(() => []),
        ]);
        if (mounted) {
          setServices(servicesData || []);
          setTechnicians(teamData || []);
        }
      } catch (error) {
        console.error("Erro ao carregar dashboard:", error);
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    loadDashboardData();
    return () => {
      mounted = false;
    };
  }, []);

  const stats = useMemo(() => {
    const total = services.length;
    const completed = services.filter((s) => s.status === "concluido").length;
    const pending = services.filter(
      (s) => s.status === "pendente" || (s.status as string) === "em_andamento"
    ).length;
    const highPriority = services.filter(
      (s) =>
        (s.priority === "alta" || s.priority === "urgente") &&
        s.status !== "concluido" &&
        s.status !== "cancelado"
    ).length;

    return { total, completed, pending, highPriority };
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      const matchesSearch =
        !searchTerm ||
        service.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.client?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        service.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(service.number || "")
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === "todos" || service.status === statusFilter;

      const matchesPriority =
        priorityFilter === "todas" || service.priority === priorityFilter;

      const matchesTech =
        techFilter === "todos" ||
        service.technicians?.some(
          (t) => t.id === techFilter || t.name === techFilter
        );

      return matchesSearch && matchesStatus && matchesPriority && matchesTech;
    });
  }, [services, searchTerm, statusFilter, priorityFilter, techFilter]);

  const hasActiveFilters =
    searchTerm !== "" ||
    statusFilter !== "todos" ||
    priorityFilter !== "todas" ||
    techFilter !== "todos";

  const clearFilters = () => {
    setSearchTerm("");
    setStatusFilter("todos");
    setPriorityFilter("todas");
    setTechFilter("todos");
  };

  const canCreateService =
    user &&
    ["super_admin", "owner", "administrador", "gestor", "requisitor"].includes(
      user.role
    );

  return (
    <div className="space-y-6">
      {/* Cabeçalho Executivo */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Painel Operacional
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Tempo Real
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visão geral das ordens de serviço e produtividade em campo
          </p>
        </div>

        {canCreateService && (
          <Button
            onClick={() => navigate("/nova-demanda")}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-xs h-9 px-4 text-xs sm:text-sm font-medium rounded-lg self-start sm:self-auto"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Nova Demanda
          </Button>
        )}
      </div>

      {/* KPI Cards Limpos (Design System Industrial Precision) */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            title="Total de Demandas"
            value={stats.total}
            description="Registradas no sistema"
            icon={<ClipboardList className="h-4 w-4 text-blue-600" />}
          />
          <StatCard
            title="Concluídas"
            value={stats.completed}
            description="Atendimentos finalizados"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          />
          <StatCard
            title="Em Aberto"
            value={stats.pending}
            description="Pendentes ou em execução"
            icon={<Clock className="h-4 w-4 text-amber-600" />}
          />
          <StatCard
            title="Alta Prioridade"
            value={stats.highPriority}
            description="Atenção prioritária"
            icon={<AlertTriangle className="h-4 w-4 text-rose-600" />}
          />
        </div>
      )}

      {/* Barra de Busca e Filtros Compacta */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl">
        <CardContent className="p-3.5 sm:p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Buscar por título, cliente, endereço ou nº da OS..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 h-10 bg-slate-50/70 dark:bg-slate-950 border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos os Status</SelectItem>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_andamento">Em Andamento</SelectItem>
                <SelectItem value="concluido">Concluído</SelectItem>
                <SelectItem value="cancelado">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200">
                <SelectValue placeholder="Prioridade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as Prioridades</SelectItem>
                <SelectItem value="baixa">Baixa</SelectItem>
                <SelectItem value="media">Média</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>

            <div className="col-span-2 sm:col-span-1 flex items-center gap-2">
              <Select value={techFilter} onValueChange={setTechFilter}>
                <SelectTrigger className="h-9 text-xs bg-white dark:bg-slate-900 border-slate-200 flex-1">
                  <SelectValue placeholder="Técnico" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Técnicos</SelectItem>
                  {technicians
                    .filter((t) => t && t.name)
                    .map((tech) => (
                      <SelectItem key={tech.id} value={tech.id}>
                        {tech.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>

              {hasActiveFilters && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-2.5 text-xs text-slate-600 hover:text-slate-900 shrink-0"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Demandas Recentes */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs rounded-xl">
        <CardHeader className="flex flex-row items-center justify-between px-4 py-3.5 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-blue-600" />
            <CardTitle className="text-base font-semibold text-slate-900 dark:text-white">
              Demandas Recentes
            </CardTitle>
          </div>
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="h-8 text-xs font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50"
          >
            <Link to="/demandas">
              Ver Todas
              <ArrowRight className="h-3.5 w-3.5 ml-1" />
            </Link>
          </Button>
        </CardHeader>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-28 w-full rounded-xl" />
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-slate-400 mb-3">
                <ClipboardList className="h-6 w-6" />
              </div>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhuma demanda encontrada
              </p>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                {hasActiveFilters
                  ? "Tente limpar os filtros para visualizar todas as ordens de serviço."
                  : "Comece criando a primeira ordem de serviço do sistema."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredServices.slice(0, 8).map((service) => (
                <CompactMobileServiceCard key={service.id} service={service} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
