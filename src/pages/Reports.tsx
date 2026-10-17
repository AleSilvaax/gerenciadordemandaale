import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, getTeamMembers } from "@/services/servicesDataService";
import { Service, TeamMember } from "@/types/serviceTypes";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  FileText,
  Download,
  BarChart3,
  Users,
  ClipboardCheck,
  PieChart,
  Loader2,
  Filter,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { toast } from "sonner";

const Reports = () => {
  const navigate = useNavigate();
  const [services, setServices] = useState<Service[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const [period, setPeriod] = useState("30d");
  const [techFilter, setTechFilter] = useState("todos");
  const [typeFilter, setTypeFilter] = useState("todos");

  useEffect(() => {
    Promise.all([getServices(), getTeamMembers().catch(() => [])])
      .then(([srv, tm]) => {
        setServices(srv || []);
        setTeam(tm || []);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const formatShortOS = (num?: string | number) => {
    if (!num) return "-";
    const parts = String(num).split("-");
    return `#${parts[parts.length - 1].replace("#", "")}`;
  };

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (techFilter !== "todos") {
        const hasTech = s.technicians?.some(
          (t) => t.id === techFilter || t.name === techFilter
        );
        if (!hasTech) return false;
      }
      if (typeFilter !== "todos" && s.serviceType !== typeFilter) {
        return false;
      }
      return true;
    });
  }, [services, techFilter, typeFilter]);

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
    const rate = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, inProgress, pending, rate };
  }, [filteredServices]);

  const generateCorporatePDF = async (
    reportKey: "executivo" | "operacional" | "equipe" | "servicos",
    title: string,
    subtitle: string
  ) => {
    setGeneratingType(reportKey);
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const nowStr = new Date().toLocaleString("pt-BR");

      // 1. Cabeçalho Corporativo Sóbrio (Slate-900 + Linha Azul)
      doc.setFillColor(15, 23, 42); // #0F172A
      doc.rect(0, 0, pageWidth, 34, "F");
      doc.setFillColor(37, 99, 235); // #2563EB
      doc.rect(0, 34, pageWidth, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text(title.toUpperCase(), 14, 15);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(203, 213, 225);
      doc.text(subtitle, 14, 22);
      doc.text(`Emitido em: ${nowStr}`, 14, 28);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(255, 255, 255);
      doc.text("ServiceFlow", pageWidth - 14, 15, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(148, 163, 184);
      doc.text("Gestão de Operações", pageWidth - 14, 21, { align: "right" });

      // 2. Bloco de KPIs com Alto Contraste
      let currentY = 44;
      doc.setFillColor(248, 250, 252); // #F8FAFC
      doc.setDrawColor(226, 232, 240); // #E2E8F0
      doc.roundedRect(14, currentY, pageWidth - 28, 22, 2, 2, "FD");

      const kpis = [
        { label: "TOTAL DE OS", val: String(metrics.total) },
        { label: "CONCLUÍDAS", val: String(metrics.completed) },
        { label: "PENDENTES", val: String(metrics.pending) },
        { label: "TAXA DE CONCLUSÃO", val: `${metrics.rate}%` },
      ];

      const colW = (pageWidth - 28) / 4;
      kpis.forEach((k, idx) => {
        const xPos = 14 + idx * colW + colW / 2;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(100, 116, 139);
        doc.text(k.label, xPos, currentY + 8, { align: "center" });

        doc.setFont("helvetica", "bold");
        doc.setFontSize(13);
        doc.setTextColor(15, 23, 42);
        doc.text(k.val, xPos, currentY + 17, { align: "center" });
      });

      currentY += 32;

      // 3. Tabelas Específicas por Tipo de Relatório (Alto Contraste)
      const headStyles = {
        fillColor: [30, 41, 59] as [number, number, number], // Slate-800
        textColor: [255, 255, 255] as [number, number, number],
        fontSize: 9,
        fontStyle: "bold" as const,
      };
      const bodyStyles = {
        textColor: [30, 41, 59] as [number, number, number],
        fontSize: 8.5,
      };
      const alternateRowStyles = {
        fillColor: [248, 250, 252] as [number, number, number],
      };

      if (reportKey === "executivo") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("1. Indicadores Estratégicos da Operação", 14, currentY);

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Indicador Operacional", "Resultado Atual", "Status"]],
          body: [
            ["Total de Ordens de Serviço", String(metrics.total), "Monitorado"],
            ["Ordens Concluídas", String(metrics.completed), "Finalizadas"],
            ["Ordens em Execução", String(metrics.inProgress), "Em Campo"],
            ["Ordens Pendentes", String(metrics.pending), "Aguardando"],
            ["Eficiência Operacional", `${metrics.rate}%`, metrics.rate >= 70 ? "Meta Atingida" : "Em Evolução"],
          ],
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });

        const nextY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("2. Produtividade por Colaborador", 14, nextY);

        const teamRows = team.map((m) => {
          const assigned = filteredServices.filter((s) =>
            s.technicians?.some(
              (t) =>
                t.id === m.id ||
                t.name?.toLowerCase() === m.name?.toLowerCase()
            )
          );
          const done = assigned.filter((s) => s.status === "concluido").length;
          const pend = assigned.filter((s) => s.status !== "concluido").length;
          return [
            m.name || "Colaborador",
            (m.role || "técnico").toUpperCase(),
            String(done),
            String(pend),
            String(assigned.length),
          ];
        });

        autoTable(doc, {
          startY: nextY + 4,
          head: [["Colaborador", "Função", "Concluídas", "Pendentes", "Total"]],
          body:
            teamRows.length > 0
              ? teamRows
              : [["Nenhum colaborador listado", "-", "0", "0", "0"]],
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });
      } else if (reportKey === "operacional") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Listagem Detalhada de Ordens de Serviço", 14, currentY);

        const srvRows = filteredServices.map((s) => [
          formatShortOS(s.number),
          s.title || "-",
          s.serviceType || "Vistoria",
          s.client || "-",
          s.technicians?.[0]?.name || "Não atribuído",
          (s.priority || "média").toUpperCase(),
          (s.status || "pendente").toUpperCase(),
        ]);

        autoTable(doc, {
          startY: currentY + 4,
          head: [
            ["OS", "Título", "Tipo", "Cliente", "Técnico", "Prioridade", "Status"],
          ],
          body:
            srvRows.length > 0
              ? srvRows
              : [["-", "Nenhuma demanda encontrada", "-", "-", "-", "-", "-"]],
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });
      } else if (reportKey === "equipe") {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("Quadro de Desempenho Técnico", 14, currentY);

        const teamRows = team.map((m) => {
          const assigned = filteredServices.filter((s) =>
            s.technicians?.some(
              (t) =>
                t.id === m.id ||
                t.name?.toLowerCase() === m.name?.toLowerCase()
            )
          );
          const done = assigned.filter((s) => s.status === "concluido").length;
          const pend = assigned.filter((s) => s.status !== "concluido").length;
          const pct =
            assigned.length > 0
              ? `${Math.round((done / assigned.length) * 100)}%`
              : "0%";
          return [
            m.name || "-",
            (m.role || "técnico").toUpperCase(),
            String(done),
            String(pend),
            pct,
          ];
        });

        autoTable(doc, {
          startY: currentY + 4,
          head: [
            [
              "Nome",
              "Cargo",
              "OS Concluídas",
              "OS Pendentes",
              "Taxa de Entrega",
            ],
          ],
          body:
            teamRows.length > 0
              ? teamRows
              : [["Nenhum membro encontrado", "-", "0", "0", "0%"]],
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });
      } else {
        // Análise de Serviços
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("1. Distribuição por Status", 14, currentY);

        const total = Math.max(filteredServices.length, 1);
        const statusRows = [
          [
            "Pendente",
            String(metrics.pending),
            `${Math.round((metrics.pending / total) * 100)}%`,
          ],
          [
            "Em Andamento",
            String(metrics.inProgress),
            `${Math.round((metrics.inProgress / total) * 100)}%`,
          ],
          [
            "Concluído",
            String(metrics.completed),
            `${Math.round((metrics.completed / total) * 100)}%`,
          ],
        ];

        autoTable(doc, {
          startY: currentY + 4,
          head: [["Status", "Quantidade", "Participação (%)"]],
          body: statusRows,
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });

        const nextY = (doc as any).lastAutoTable.finalY + 12;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(11);
        doc.setTextColor(15, 23, 42);
        doc.text("2. Distribuição por Prioridade", 14, nextY);

        const priorities = ["baixa", "media", "alta", "urgente"];
        const prioRows = priorities.map((p) => {
          const count = filteredServices.filter((s) => s.priority === p).length;
          return [
            p.toUpperCase(),
            String(count),
            `${Math.round((count / total) * 100)}%`,
          ];
        });

        autoTable(doc, {
          startY: nextY + 4,
          head: [["Prioridade", "Quantidade", "Participação (%)"]],
          body: prioRows,
          headStyles,
          bodyStyles,
          alternateRowStyles,
          margin: { left: 14, right: 14 },
        });
      }

      // 4. Rodapé Exato em Todas as Páginas
      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setDrawColor(226, 232, 240);
        doc.line(14, pageHeight - 14, pageWidth - 14, pageHeight - 14);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text(
          "ServiceFlow — Relatório Corporativo de Operações",
          14,
          pageHeight - 8
        );
        doc.text(
          `Página ${i} de ${totalPages}`,
          pageWidth - 14,
          pageHeight - 8,
          { align: "right" }
        );
      }

      const fileName = `relatorio-${reportKey}-${new Date()
        .toISOString()
        .slice(0, 10)}.pdf`;
      doc.save(fileName);
      toast.success(`${title} gerado com sucesso!`);
    } catch (error) {
      console.error("Erro ao gerar PDF:", error);
      toast.error("Não foi possível gerar o PDF.");
    } finally {
      setGeneratingType(null);
    }
  };

  const reportTypes = [
    {
      key: "executivo" as const,
      title: "Relatório Executivo",
      description:
        "Visão geral estratégica com KPIs e indicadores para tomada de decisão",
      icon: BarChart3,
      iconStyle: "bg-blue-50 text-blue-600",
    },
    {
      key: "operacional" as const,
      title: "Relatório Operacional",
      description:
        "Listagem completa de ordens de serviço, clientes, técnicos e status",
      icon: ClipboardCheck,
      iconStyle: "bg-emerald-50 text-emerald-600",
    },
    {
      key: "equipe" as const,
      title: "Performance da Equipe",
      description:
        "Avaliação individual e coletiva dos técnicos com métricas de entrega",
      icon: Users,
      iconStyle: "bg-indigo-50 text-indigo-600",
    },
    {
      key: "servicos" as const,
      title: "Análise de Serviços",
      description:
        "Distribuição detalhada por tipo de serviço, prioridade e status",
      icon: PieChart,
      iconStyle: "bg-amber-50 text-amber-600",
    },
  ];

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
            Relatórios Corporativos
          </h1>
          <p className="text-xs text-slate-500">
            Exporte relatórios executivos em PDF prontos para apresentação
          </p>
        </div>
      </div>

      {/* Filtros */}
      <Card className="bg-white dark:bg-slate-900 border border-slate-200/80 rounded-xl shadow-2xs">
        <CardHeader className="px-4 py-3 border-b border-slate-100 dark:border-slate-800">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Filter className="h-4 w-4 text-blue-600" />
            Parâmetros dos Relatórios
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="all">Todo o período</SelectItem>
            </SelectContent>
          </Select>

          <Select value={techFilter} onValueChange={setTechFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Técnico" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Técnicos</SelectItem>
              {team
                .filter((t) => t && t.name)
                .map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Tipo de Serviço" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os Tipos</SelectItem>
              <SelectItem value="Vistoria">Vistoria</SelectItem>
              <SelectItem value="Instalação">Instalação</SelectItem>
              <SelectItem value="Manutenção">Manutenção</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Cards de Exportação de Relatórios */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reportTypes.map((rep) => {
          const Icon = rep.icon;
          const isGenerating = generatingType === rep.key;
          return (
            <Card
              key={rep.key}
              className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-2xs hover:shadow-md transition-all rounded-xl"
            >
              <CardContent className="p-5 flex flex-col justify-between h-full gap-4">
                <div className="flex items-start gap-3.5">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${rep.iconStyle}`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {rep.title}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-[10px] bg-slate-50 text-slate-600 border-slate-200"
                      >
                        PDF A4
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed">
                      {rep.description}
                    </p>
                  </div>
                </div>

                <Button
                  type="button"
                  disabled={isLoading || isGenerating}
                  onClick={() =>
                    generateCorporatePDF(rep.key, rep.title, rep.description)
                  }
                  className="w-full h-9 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando Documento...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Baixar {rep.title}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Reports;
