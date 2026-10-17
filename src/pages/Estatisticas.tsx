import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, getTeamMembers } from "@/services/servicesDataService";
import { Service, TeamMember } from "@/types/serviceTypes";
import { StatCard } from "@/components/ui-custom/StatCard";
import { AnimatedPieChart } from "@/components/dashboard/AnimatedPieChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  BarChart3,
  CheckCircle2,
  Clock,
  Target,
  Activity,
  FileText,
  Download,
  Users,
  Wrench,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const Estatisticas = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [period, setPeriod] = useState("30d");
  const [serviceTypeFilter, setServiceTypeFilter] = useState("todos");

  useEffect(() => {
    setIsLoading(true);
    Promise.all([getServices(), getTeamMembers().catch(() => [])])
      .then(([srv, tm]) => {
        setServices(srv || []);
        setTeam(tm || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (
        serviceTypeFilter !== "todos" &&
        s.serviceType !== serviceTypeFilter
      ) {
        return false;
      }
      return true;
    });
  }, [services, serviceTypeFilter]);

  const metrics = useMemo(() => {
    const total = filteredServices.length;
    const completed = filteredServices.filter(
      (s) => s.status === "concluido"
    ).length;
    const inProgress = filteredServices.filter(
      (s) => (s.status as string) === "em_andamento"
    ).length;
    const pending = filteredServices.filter(
      (s) => s.status === "pendente"
    ).length;
    const canceled = filteredServices.filter(
      (s) => s.status === "cancelado"
    ).length;
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      inProgress,
      pending,
      canceled,
      rate,
    };
  }, [filteredServices]);

  const pieData = useMemo(() => {
    return [
      { name: "Concluído", value: metrics.completed, color: "#10b981" },
      { name: "Em Andamento", value: metrics.inProgress, color: "#3b82f6" },
      { name: "Pendente", value: metrics.pending, color: "#f59e0b" },
      { name: "Cancelado", value: metrics.canceled, color: "#f43f5e" },
    ].filter((item) => item.value > 0);
  }, [metrics]);

  const serviceTypesBreakdown = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredServices.forEach((s) => {
      const type = s.serviceType || "Vistoria";
      counts[type] = (counts[type] || 0) + 1;
    });
    const total = Math.max(filteredServices.length, 1);
    return Object.entries(counts).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100),
    }));
  }, [filteredServices]);

  const teamPerformance = useMemo(() => {
    return team.map((member) => {
      const assigned = filteredServices.filter((s) =>
        s.technicians?.some(
          (t) =>
            t.id === member.id ||
            t.name?.toLowerCase() === member.name?.toLowerCase()
        )
      );
      const total = assigned.length;
      const completed = assigned.filter((s) => s.status === "concluido").length;
      const pending = assigned.filter((s) => s.status !== "concluido").length;
      const rate = total > 0 ? Math.round((completed / total) * 100) : 0;

      return {
        id: member.id,
        name: member.name,
        role: member.role,
        total,
        completed,
        pending,
        rate,
      };
    });
  }, [team, filteredServices]);

  const handleExportSummaryPDF = () => {
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const nowStr = new Date().toLocaleString("pt-BR");

      // Cabeçalho Executivo
      doc.setFillColor(15, 23, 42);
      doc.rect(0, 0, pageWidth, 32, "F");
      doc.setFillColor(37, 99, 235);
      doc.rect(0, 32, pageWidth, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(15);
      doc.text("PANORAMA ESTATÍSTICO DE OPERAÇÕES", 14, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Emitido em: ${nowStr}  •  ServiceFlow Analytics`, 14, 22);

      autoTable(doc, {
        startY: 42,
        head: [["Indicador", "Valor"]],
        body: [
          ["Total de Demandas", String(metrics.total)],
          ["Concluídas", String(metrics.completed)],
          ["Pendentes / Em Aberto", String(metrics.pending + metrics.inProgress)],
          ["Taxa de Conclusão", `${metrics.rate}%`],
        ],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });

      const nextY = (doc as any).lastAutoTable.finalY + 10;
      autoTable(doc, {
        startY: nextY,
        head: [["Colaborador", "Cargo", "Total", "Concluídas", "Pendentes", "Taxa"]],
        body: teamPerformance.map((tp) => [
          tp.name,
          (tp.role || "técnico").toUpperCase(),
          String(tp.total),
          String(tp.completed),
          String(tp.pending),
          `${tp.rate}%`,
        ]),
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255] },
        margin: { left: 14, right: 14 },
      });

      doc.save(`estatisticas-serviceflow-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Relatório estatístico exportado com sucesso!");
    } catch (e) {
      toast.error("Erro ao exportar PDF.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xs">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              Análise e Estatísticas
            </h1>
            <p className="text-xs text-slate-500">
              Acompanhe o desempenho operacional e a evolução da equipe
            </p>
          </div>
        </div>

        {/* Filtros e Ações */}
        <div className="flex flex-wrap items-center gap-2">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={serviceTypeFilter}
            onValueChange={setServiceTypeFilter}
          >
            <SelectTrigger className="h-9 w-36 text-xs bg-white border-slate-200">
              <SelectValue placeholder="Tipo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os tipos</SelectItem>
              <SelectItem value="Vistoria">Vistoria</SelectItem>
              <SelectItem value="Instalação">Instalação</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
            </SelectContent>
          </Select>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate("/relatorios")}
            className="h-9 text-xs border-slate-200 bg-white"
          >
            <FileText className="h-3.5 w-3.5 mr-1.5 text-blue-600" />
            Relatórios
          </Button>

          <Button
            type="button"
            size="sm"
            onClick={handleExportSummaryPDF}
            className="h-9 text-xs bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Download className="h-3.5 w-3.5 mr-1.5" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* KPI Cards Padronizados */}
      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            title="Total de Demandas"
            value={metrics.total}
            description="Volume no período"
            icon={<Activity className="h-4 w-4 text-blue-600" />}
          />
          <StatCard
            title="Concluídas"
            value={metrics.completed}
            description="Ordens finalizadas"
            icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />}
          />
          <StatCard
            title="Em Aberto"
            value={metrics.pending + metrics.inProgress}
            description="Aguardando conclusão"
            icon={<Clock className="h-4 w-4 text-amber-600" />}
          />
          <StatCard
            title="Taxa de Conclusão"
            value={`${metrics.rate}%`}
            description="Eficiência operacional"
            icon={<Target className="h-4 w-4 text-indigo-600" />}
          />
        </div>
      )}

      {/* Gráficos e Distribuição */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 shadow-2xs rounded-xl">
          <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Clock className="h-4 w-4 text-blue-600" />
              Distribuição por Status
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5">
            {pieData.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Sem dados suficientes para exibir o gráfico.
              </div>
            ) : (
              <AnimatedPieChart data={pieData} />
            )}
          </CardContent>
        </Card>

        {/* Tipos de Serviço */}
        <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 shadow-2xs rounded-xl">
          <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <Wrench className="h-4 w-4 text-blue-600" />
              Demandas por Tipo de Serviço
            </CardTitle>
          </CardHeader>
          <CardContent className="p-5 space-y-4">
            {serviceTypesBreakdown.length === 0 ? (
              <div className="py-12 text-center text-xs text-slate-400">
                Nenhum serviço registrado.
              </div>
            ) : (
              serviceTypesBreakdown.map((item) => (
                <div key={item.name} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {item.name}
                    </span>
                    <span className="font-mono font-bold text-blue-600">
                      {item.count} ({item.pct}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-600 transition-all duration-500"
                      style={{ width: `${item.pct}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>

      {/* Performance da Equipe */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 shadow-2xs rounded-xl">
        <CardHeader className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Users className="h-4 w-4 text-blue-600" />
            Performance da Equipe
          </CardTitle>
        </CardHeader>
        <CardContent className="p-5">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {teamPerformance.map((member) => (
              <div
                key={member.id}
                className="p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/40 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white capitalize">
                      {member.name}
                    </h4>
                    <p className="text-[11px] text-slate-500 capitalize">
                      {member.role || "Técnico"}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      member.rate >= 70
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200 font-mono"
                        : "bg-slate-100 text-slate-700 border-slate-200 font-mono"
                    }
                  >
                    {member.rate}%
                  </Badge>
                </div>

                <div className="h-1.5 w-full rounded-full bg-slate-200/70 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${member.rate}%` }}
                  />
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1 text-center">
                  <div className="rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-100">
                    <span className="block font-mono text-sm font-bold text-slate-900 dark:text-white">
                      {member.total}
                    </span>
                    <span className="text-[10px] text-slate-500">Total</span>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-100">
                    <span className="block font-mono text-sm font-bold text-emerald-600">
                      {member.completed}
                    </span>
                    <span className="text-[10px] text-slate-500">Concluídos</span>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-slate-900 p-2 border border-slate-100">
                    <span className="block font-mono text-sm font-bold text-amber-600">
                      {member.pending}
                    </span>
                    <span className="text-[10px] text-slate-500">Pendentes</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Estatisticas;
