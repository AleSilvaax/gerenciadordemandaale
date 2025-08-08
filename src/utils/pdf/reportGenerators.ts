import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, TeamMember } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { addPageNumbers } from './pdfFormatters';

export const generateExecutiveReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Cover page
  createReportCover(doc, 'RELATÓRIO EXECUTIVO', 'Visão geral de performance e KPIs');
  
  // Summary statistics
  doc.addPage();
  let currentY = 30;
  
  // Title
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('RESUMO EXECUTIVO', PDF_DIMENSIONS.margin, currentY);
  currentY += 15;
  
  // Stats
  const stats = calculateServiceStats(services);
  const statsData = [
    ['Total de Serviços', stats.total.toString()],
    ['Serviços Concluídos', stats.completed.toString()],
    ['Em Andamento', stats.inProgress.toString()],
    ['Pendentes', stats.pending.toString()],
    ['Taxa de Conclusão', `${Math.round((stats.completed / stats.total) * 100)}%`],
    ['Equipe Ativa', teamMembers.length.toString()]
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Métrica', 'Valor']],
    body: statsData,
    theme: 'grid',
    headStyles: {
      fillColor: [...PDF_COLORS.primary],
      textColor: [255, 255, 255],
      fontSize: 12
    },
    bodyStyles: {
      fontSize: 11,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  // Top performers
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('TOP PERFORMERS', PDF_DIMENSIONS.margin, currentY);
  currentY += 10;
  
  const topPerformers = teamMembers
    .sort((a, b) => (b.stats?.completedServices || 0) - (a.stats?.completedServices || 0))
    .slice(0, 5);
  
  const performersData = topPerformers.map(member => [
    member.name,
    member.role,
    (member.stats?.completedServices || 0).toString(),
    (member.stats?.avgRating || 0).toFixed(1)
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Técnico', 'Função', 'Concluídos', 'Avaliação']],
    body: performersData,
    theme: 'striped',
    headStyles: {
      fillColor: [...PDF_COLORS.accent],
      textColor: [255, 255, 255],
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  // Footer/page numbers
  addPageNumbers(doc);
  const fileName = `relatorio-executivo-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateOperationalReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  createReportCover(doc, 'RELATÓRIO OPERACIONAL', 'Detalhes técnicos e operacionais');
  
  doc.addPage();
  let currentY = 30;
  
  // Services by type
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('SERVIÇOS POR TIPO', PDF_DIMENSIONS.margin, currentY);
  currentY += 15;
  
  const servicesByType = services.reduce((acc, service) => {
    const type = service.serviceType || 'Não especificado';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const typeData = Object.entries(servicesByType).map(([type, count]) => [type, count.toString()]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Tipo de Serviço', 'Quantidade']],
    body: typeData,
    theme: 'grid',
    headStyles: {
      fillColor: [...PDF_COLORS.primary],
      textColor: [255, 255, 255],
      fontSize: 12
    },
    bodyStyles: {
      fontSize: 11,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  // Services details
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 30;
  }
  
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('DETALHES DOS SERVIÇOS', PDF_DIMENSIONS.margin, currentY);
  currentY += 10;
  
  const servicesData = services.slice(0, 20).map(service => [
    service.number || 'N/A',
    service.title.substring(0, 30) + (service.title.length > 30 ? '...' : ''),
    service.status,
    service.client || 'N/A',
    service.location || 'N/A'
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['OS', 'Título', 'Status', 'Cliente', 'Local']],
    body: servicesData,
    theme: 'striped',
    headStyles: {
      fillColor: [...PDF_COLORS.accent],
      textColor: [255, 255, 255],
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  addPageNumbers(doc);
  const fileName = `relatorio-operacional-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateTeamPerformanceReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  createReportCover(doc, 'PERFORMANCE DA EQUIPE', 'Análise detalhada dos técnicos');
  
  doc.addPage();
  let currentY = 30;
  
  // Team overview
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('VISÃO GERAL DA EQUIPE', PDF_DIMENSIONS.margin, currentY);
  currentY += 15;
  
  const teamData = teamMembers.map(member => [
    member.name,
    member.role,
    (member.stats?.completedServices || 0).toString(),
    (member.stats?.pendingServices || 0).toString(),
    (member.stats?.avgRating || 0).toFixed(1),
    member.stats?.joinDate || 'N/A'
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Nome', 'Função', 'Concluídos', 'Pendentes', 'Avaliação', 'Entrada']],
    body: teamData,
    theme: 'grid',
    headStyles: {
      fillColor: [...PDF_COLORS.primary],
      textColor: [255, 255, 255],
      fontSize: 10
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  // Performance metrics
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  if (currentY > 200) {
    doc.addPage();
    currentY = 30;
  }
  
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('MÉTRICAS DE PERFORMANCE', PDF_DIMENSIONS.margin, currentY);
  currentY += 10;
  
  const avgCompletedServices = teamMembers.reduce((acc, member) => acc + (member.stats?.completedServices || 0), 0) / teamMembers.length;
  const avgRating = teamMembers.reduce((acc, member) => acc + (member.stats?.avgRating || 0), 0) / teamMembers.length;
  
  const metricsData = [
    ['Média de Serviços Concluídos', avgCompletedServices.toFixed(1)],
    ['Avaliação Média da Equipe', avgRating.toFixed(1)],
    ['Total de Técnicos', teamMembers.filter(m => m.role === 'tecnico').length.toString()],
    ['Total de Gestores', teamMembers.filter(m => m.role === 'gestor').length.toString()],
    ['Total de Administradores', teamMembers.filter(m => m.role === 'administrador').length.toString()]
  ];
  
  autoTable(doc, {
    startY: currentY,
    head: [['Métrica', 'Valor']],
    body: metricsData,
    theme: 'striped',
    headStyles: {
      fillColor: [...PDF_COLORS.accent],
      textColor: [255, 255, 255],
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  addPageNumbers(doc);
  const fileName = `relatorio-performance-equipe-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateServiceAnalysisReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  createReportCover(doc, 'ANÁLISE DE SERVIÇOS', 'Breakdown detalhado por categoria');
  
  doc.addPage();
  let currentY = 30;
  
  // Services by status
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('SERVIÇOS POR STATUS', PDF_DIMENSIONS.margin, currentY);
  currentY += 15;
  
  const servicesByStatus = services.reduce((acc, service) => {
    acc[service.status] = (acc[service.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const statusData = Object.entries(servicesByStatus).map(([status, count]) => [
    getStatusDisplayName(status),
    count.toString(),
    `${Math.round((count / services.length) * 100)}%`
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Status', 'Quantidade', 'Percentual']],
    body: statusData,
    theme: 'grid',
    headStyles: {
      fillColor: [...PDF_COLORS.primary],
      textColor: [255, 255, 255],
      fontSize: 12
    },
    bodyStyles: {
      fontSize: 11,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  // Services by priority
  currentY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('SERVIÇOS POR PRIORIDADE', PDF_DIMENSIONS.margin, currentY);
  currentY += 10;
  
  const servicesByPriority = services.reduce((acc, service) => {
    const priority = service.priority || 'media';
    acc[priority] = (acc[priority] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const priorityData = Object.entries(servicesByPriority).map(([priority, count]) => [
    priority.charAt(0).toUpperCase() + priority.slice(1),
    count.toString(),
    `${Math.round((count / services.length) * 100)}%`
  ]);
  
  autoTable(doc, {
    startY: currentY,
    head: [['Prioridade', 'Quantidade', 'Percentual']],
    body: priorityData,
    theme: 'striped',
    headStyles: {
      fillColor: [...PDF_COLORS.accent],
      textColor: [255, 255, 255],
      fontSize: 11
    },
    bodyStyles: {
      fontSize: 10,
      textColor: [...PDF_COLORS.text]
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  });
  
  addPageNumbers(doc);
  const fileName = `relatorio-analise-servicos-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

// Helper functions
const createReportCover = (doc: jsPDF, title: string, subtitle: string): void => {
  // Cover background
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 100, 'F');
  
  // Accent bar
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 95, PDF_DIMENSIONS.pageWidth, 10, 'F');
  
  // Title
  doc.setFontSize(24);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.pageWidth / 2, 50, { align: 'center' });
  
  // Subtitle
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, 'normal');
  doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 70, { align: 'center' });
  
  // Date
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, PDF_DIMENSIONS.pageWidth / 2, 270, { align: 'center' });
};

const calculateServiceStats = (services: Service[]) => {
  return {
    total: services.length,
    completed: services.filter(s => s.status === 'concluido').length,
    inProgress: services.filter(s => s.status === 'em_andamento').length,
    pending: services.filter(s => s.status === 'pendente').length,
    cancelled: services.filter(s => s.status === 'cancelado').length
  };
};

const getStatusDisplayName = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'agendado': 'Agendado'
  };
  return statusMap[status] || status;
};