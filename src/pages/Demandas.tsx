import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getServices } from "@/services/servicesDataService";
import { Service } from "@/types/serviceTypes";
import { StatisticsCards } from "@/components/ui-custom/StatisticsCards";
import { CompactMobileServiceCard } from "@/components/ui-custom/CompactMobileServiceCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ClipboardList,
  Plus,
  RefreshCw,
  Search,
  Filter,
  RotateCcw,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const Demandas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"todas" | "ativas" | "concluidas">(
    "todas"
  );
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("todas");

  const loadServices = async () => {
    setIsLoading(true);
    try {
      const data = await getServices();
      setServices(data || []);
    } catch (error) {
      console.error("Erro ao carregar demandas:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, []);

  // Indicadores globais sempre baseados no total de demandas do sistema
  const globalStats = useMemo(() => {
    const total = services.length;
    const completed = services.filter((s) => s.status === "concluido").length;
    const inProgress = services.filter(
      (s) => (s.status as string) === "em_andamento"
    ).length;
    const pending = services.filter(
      (s) => s.status === "pendente" || (s.status as string) === "em_andamento"
    ).length;
    const highPriority = services.filter(
      (s) =>
        (s.priority === "alta" || s.priority === "urgente") &&
        s.status !== "concluido"
    ).length;
    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      pending,
      inProgress,
      completed,
      highPriority,
      completionRate,
    };
  }, [services]);

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      // Filtro de Aba: "Ativas" inclui Pendentes + Em Andamento
      if (activeTab === "ativas") {
        const isActive =
          service.status === "pendente" ||
          (service.status as string) === "em_andamento";
        if (!isActive) return false;
      } else if (activeTab === "concluidas") {
        if (service.status !== "concluido") return false;
      }

      // Busca por texto
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const match =
          service.title?.toLowerCase().includes(term) ||
          service.client?.toLowerCase().includes(term) ||
          service.location?.toLowerCase().includes(term) ||
          String(service.number || "")
            .toLowerCase()
            .includes(term);
        if (!match) return false;
      }

      // Filtro de prioridade
      if (
        priorityFilter !== "todas" &&
        service.priority !== priorityFilter
      ) {
        return false;
      }

      return true;
    });
  }, [services, activeTab, searchTerm, priorityFilter]);

  const canCreate =
    user &&
    ["super_admin", "owner", "administrador", "gestor", "requisitor"].includes(
      user.role
    );

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Demandas
            </h1>
            <p className="text-xs text-slate-500">
              Gerencie e acompanhe todas as ordens de serviço
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            className="h-9 w-9 border-slate-200 bg-white"
            title="Buscar e filtrar"
          >
            <Search className="h-4 w-4 text-slate-600" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={loadServices}
            className="h-9 w-9 border-slate-200 bg-white"
            title="Atualizar lista"
          >
            <RefreshCw className="h-4 w-4 text-slate-600" />
          </Button>
          {canCreate && (
            <Button
              onClick={() => navigate("/nova-demanda")}
              className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium px-3.5 rounded-lg"
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova
            </Button>
          )}
        </div>
      </div>

      {/* Cards de Resumo Globais */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <StatisticsCards {...globalStats} />
      )}

      {/* Abas de Status */}
      <div className="space-y-3">
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as any)}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-3 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl h-10">
            <TabsTrigger
              value="todas"
              className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs"
            >
              Todas ({globalStats.total})
            </TabsTrigger>
            <TabsTrigger
              value="ativas"
              className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs"
            >
              Ativas ({globalStats.pending})
            </TabsTrigger>
            <TabsTrigger
              value="concluidas"
              className="rounded-lg text-xs font-semibold data-[state=active]:bg-white data-[state=active]:text-slate-900 data-[state=active]:shadow-2xs"
            >
              Concluídas ({globalStats.completed})
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Barra de Filtros Expansível */}
        {showFilters && (
          <div className="flex flex-col sm:flex-row gap-2.5 p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-200/80 shadow-2xs">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Pesquisar por título, cliente ou nº da OS..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="h-9 text-xs w-full sm:w-44">
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
              {(searchTerm || priorityFilter !== "todas") && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchTerm("");
                    setPriorityFilter("todas");
                  }}
                  className="h-9 text-xs"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" />
                  Limpar
                </Button>
              )}
            </div>
          </div>
        )}

        {/* Contagem e Botão de Filtro Rápido */}
        <div className="flex items-center justify-between px-1">
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 hover:text-blue-600"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros e Busca
          </button>
          <span className="font-mono text-xs text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
            {filteredServices.length} resultado
            {filteredServices.length !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Lista de Demandas */}
        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-slate-900 border border-slate-200/80 rounded-xl">
            <ClipboardList className="h-10 w-10 text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Nenhuma demanda encontrada
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Não há ordens de serviço para o filtro selecionado.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredServices.map((service) => (
              <CompactMobileServiceCard key={service.id} service={service} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Demandas;
