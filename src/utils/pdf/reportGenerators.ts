import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, TeamMember } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { addPageNumbers, addHeader } from './pdfFormatters';
import { defaultTableTheme } from './pdfLayout';
import { processImage } from './imageProcessor';

export const generateExecutiveReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  // Cover page
  await createReportCover(doc, 'RELATÓRIO EXECUTIVO', 'Visão geral de performance e KPIs');
  
  // Summary statistics
  doc.addPage();
  let currentY = addHeader(doc, 'RELATÓRIO EXECUTIVO', 0);
  
// Title
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text('RESUMO EXECUTIVO', PDF_DIMENSIONS.margin, currentY);
  currentY += 12;
  
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
  ...defaultTableTheme('primary'),
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
  ...defaultTableTheme('accent'),
  theme: 'striped',
});
  
  // Footer/page numbers
  addPageNumbers(doc);
  const fileName = `relatorio-executivo-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateOperationalReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  await createReportCover(doc, 'RELATÓRIO OPERACIONAL', 'Detalhes técnicos e operacionais');
  
  doc.addPage();
  let currentY = addHeader(doc, 'RELATÓRIO OPERACIONAL', 0);
  
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
  ...defaultTableTheme('primary'),
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
  ...defaultTableTheme('accent'),
  theme: 'striped',
});
  
  addPageNumbers(doc);
  const fileName = `relatorio-operacional-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateTeamPerformanceReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  await createReportCover(doc, 'PERFORMANCE DA EQUIPE', 'Análise detalhada dos técnicos');
  
  doc.addPage();
  let currentY = addHeader(doc, 'PERFORMANCE DA EQUIPE', 0);
  
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
  ...defaultTableTheme('primary'),
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
  ...defaultTableTheme('accent'),
  theme: 'striped',
});
  
  addPageNumbers(doc);
  const fileName = `relatorio-performance-equipe-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

export const generateServiceAnalysisReport = async (services: Service[], teamMembers: TeamMember[]): Promise<void> => {
  const doc = new jsPDF('portrait', 'mm', 'a4');
  
  await createReportCover(doc, 'ANÁLISE DE SERVIÇOS', 'Breakdown detalhado por categoria');
  
  doc.addPage();
  let currentY = addHeader(doc, 'ANÁLISE DE SERVIÇOS', 0);
  
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
  ...defaultTableTheme('primary'),
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
  ...defaultTableTheme('accent'),
  theme: 'striped',
});
  
  addPageNumbers(doc);
  const fileName = `relatorio-analise-servicos-${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

// Helper functions
const createReportCover = async (doc: jsPDF, title: string, subtitle: string): Promise<void> => {
  // Modern gradient background
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 120, 'F');
  
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(0, 100, PDF_DIMENSIONS.pageWidth, 20, 'F');
  
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 115, PDF_DIMENSIONS.pageWidth, 8, 'F');
  
  // Decorative geometric elements
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.circle(180, 25, 15, 'F');
  doc.setFillColor(...PDF_COLORS.white);
  doc.circle(180, 25, 8, 'F');
  
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(170, 35, 30, 3, 'F');
  doc.rect(175, 40, 20, 2, 'F');
  
  // Modern logo
  try {
    const logo = await processImage('/logo.svg');
    if (logo) {
      doc.addImage(logo, 'PNG', PDF_DIMENSIONS.margin, 15, 24, 24);
    } else {
      // Fallback modern logo
      doc.setFillColor(...PDF_COLORS.white);
      doc.roundedRect(PDF_DIMENSIONS.margin, 15, 24, 24, 4, 4, 'F');
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(PDF_DIMENSIONS.margin + 12, 27, 8, 'F');
    }
  } catch {
    // Fallback design
    doc.setFillColor(...PDF_COLORS.white);
    doc.roundedRect(PDF_DIMENSIONS.margin, 15, 24, 24, 4, 4, 'F');
    doc.setFillColor(...PDF_COLORS.accent);
    doc.circle(PDF_DIMENSIONS.margin + 12, 27, 8, 'F');
  }
  
  // Main title with enhanced typography
  doc.setFontSize(32);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.pageWidth / 2, 50, { align: 'center' });
  
  // Subtitle with accent
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'normal');
  doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 70, { align: 'center' });
  
  // System branding
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('ServiceFlow Analytics', PDF_DIMENSIONS.pageWidth / 2, 85, { align: 'center' });
  
  // Modern info card
  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(35, 140, 140, 100, 8, 8, 'F');
  
  // Card shadow effect
  doc.setFillColor(...PDF_COLORS.mediumGray);
  doc.roundedRect(37, 142, 140, 100, 8, 8, 'F');
  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(35, 140, 140, 100, 8, 8, 'F');
  
  // Card header
  doc.setFillColor(...PDF_COLORS.lightGray);
  doc.roundedRect(35, 140, 140, 25, 8, 8, 'F');
  doc.rect(35, 157, 140, 8, 'F');
  
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.text('INFORMAÇÕES DO RELATÓRIO', 105, 155, { align: 'center' });
  
  // Card content
  doc.setTextColor(...PDF_COLORS.text);
  doc.setFontSize(11);
  doc.setFont(PDF_FONTS.normal, 'normal');
  
  const currentDate = new Date().toLocaleDateString('pt-BR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
  
  const reportInfo = [
    `📊 Período: ${currentDate}`,
    `📈 Sistema: Gestão Integrada`,
    `🔒 Confidencial: Uso Interno`,
    `⚡ Gerado Automaticamente`
  ];
  
  let infoY = 180;
  reportInfo.forEach(info => {
    doc.text(info, 105, infoY, { align: 'center' });
    infoY += 12;
  });
  
  // Footer with enhanced branding
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textLight);
  doc.text(`Documento gerado em ${currentDate}`, 
           PDF_DIMENSIONS.pageWidth / 2, 275, { align: 'center' });
  doc.text('ServiceFlow • Sistema de Gestão de Demandas', 
           PDF_DIMENSIONS.pageWidth / 2, 285, { align: 'center' });
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