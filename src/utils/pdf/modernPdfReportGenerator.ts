import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';

// Constants for styling
const colors = {
  primary: { r: 41, g: 128, b: 185 },
  text: { r: 52, g: 58, b: 64 },
  muted: { r: 108, g: 117, b: 125 },
  light: { r: 248, g: 249, b: 250 },
  border: { r: 233, g: 236, b: 239 }
};

const margins = { left: 20, right: 20, top: 20, bottom: 20 };
const pageWidth = 210; // A4 width in mm

// Utility functions
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .toString()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .trim();
};

const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Não informado';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Data inválida';
  }
};

export const generateModernServiceReport = async (service: Service): Promise<void> => {
  const doc = new jsPDF();
  
  // Create sections
  await createHeader(doc, service);
  
  // Service summary section
  let yPosition = 60;
  yPosition = await createServiceSummarySection(doc, service, yPosition);
  
  // Client information section
  yPosition = await createClientSection(doc, service, yPosition);
  
  // Service details section
  yPosition = await createServiceDetailsSection(doc, service, yPosition);
  
  // Technician information section
  yPosition = await createTechnicianSection(doc, service, yPosition);
  
  // Technical fields section
  if (service.customFields && Object.keys(service.customFields).length > 0) {
    yPosition = await createTechnicalFieldsSection(doc, service, yPosition);
  }
  
  // Service timeline section
  yPosition = await createTimelineSection(doc, service, yPosition);
  
  // Messages section
  if (service.messages && service.messages.length > 0) {
    yPosition = await createMessagesSection(doc, service, yPosition);
  }
  
  // Feedback section
  if (service.feedback) {
    yPosition = await createFeedbackSection(doc, service, yPosition);
  }
  
  // Photos section
  if (service.photos && service.photos.length > 0) {
    yPosition = await createPhotosSection(doc, service, yPosition);
  }
  
  // Footer
  createFooter(doc);
  
  // Save the PDF
  const fileName = `relatorio_servico_${service.number || service.id}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

const createHeader = async (doc: jsPDF, service: Service): Promise<void> => {
  // Header background
  doc.setFillColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Title
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE SERVIÇO', margins.left, 20);
  
  // Service info in header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`OS #${service.number || 'N/A'} - ${sanitizeText(service.title)}`, margins.left, 35);
  doc.text(`Data: ${formatDate(new Date().toISOString())}`, pageWidth - margins.right - 80, 35);
};

const createServiceSummarySection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Background for summary section
  doc.setFillColor(248, 250, 252);
  doc.rect(margins.left - 5, yPosition - 5, pageWidth - margins.left - margins.right + 10, 35, 'F');
  
  // Service number and title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text(`OS #${service.number || 'N/A'} - ${service.title}`, margins.left, yPosition + 8);
  
  // Status and priority badges
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  
  // Status badge
  const statusText = getStatusText(service.status);
  doc.setFillColor(...getStatusColor(service.status));
  doc.setTextColor(255, 255, 255);
  doc.rect(margins.left, yPosition + 15, 30, 8, 'F');
  doc.text(statusText, margins.left + 2, yPosition + 20);
  
  // Priority badge
  if (service.priority) {
    const priorityText = service.priority.toUpperCase();
    doc.setFillColor(...getPriorityColor(service.priority));
    doc.rect(margins.left + 35, yPosition + 15, 25, 8, 'F');
    doc.text(priorityText, margins.left + 37, yPosition + 20);
  }
  
  return yPosition + 40;
};

const createClientSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('INFORMAÇÕES DO CLIENTE', margins.left, yPosition);
  
  yPosition += 15;
  
  // Client details
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  
  const clientInfo = [
    ['Nome:', service.client || 'Não informado'],
    ['Endereço:', service.address || 'Não informado'],
    ['Cidade:', service.city || 'Não informada'],
    ['Local do Serviço:', service.location || 'Não informado'],
  ];
  
  clientInfo.forEach(([label, value], index) => {
    doc.setFont('helvetica', 'bold');
    doc.text(label, margins.left, yPosition + (index * 8));
    doc.setFont('helvetica', 'normal');
    doc.text(value, margins.left + 40, yPosition + (index * 8));
  });
  
  return yPosition + clientInfo.length * 8 + 15;
};

const createServiceDetailsSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('DETALHES DO SERVIÇO', margins.left, yPosition);
  
  yPosition += 15;
  
  // Service details in table format
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  
  const serviceInfo = [
    ['Tipo de Serviço:', service.serviceType || 'Não especificado'],
    ['Localização:', service.location || 'Não informado'],
    ['Data de Criação:', formatDate(service.creationDate)],
    ['Prazo de Conclusão:', service.dueDate ? formatDate(service.dueDate) : 'Não definido'],
    ['Endereço:', service.address || 'Não informado'],
    ['Cidade:', service.city || 'Não informada'],
  ];
  
  serviceInfo.forEach(([label, value], index) => {
    const row = index % 2;
    if (row === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margins.left - 2, yPosition + (index * 8) - 2, pageWidth - margins.left - margins.right + 4, 8, 'F');
    }
    
    doc.setFont('helvetica', 'bold');
    doc.text(label, margins.left, yPosition + (index * 8));
    doc.setFont('helvetica', 'normal');
    doc.text(value, margins.left + 50, yPosition + (index * 8));
  });
  
  yPosition += serviceInfo.length * 8 + 10;
  
  // Description
  if (service.description) {
    doc.setFont('helvetica', 'bold');
    doc.text('Descrição do Serviço:', margins.left, yPosition);
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(service.description, pageWidth - margins.left - margins.right);
    doc.text(descriptionLines, margins.left, yPosition);
    yPosition += descriptionLines.length * 6 + 15;
  }
  
  return yPosition;
};

const createTechnicianSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('TÉCNICO RESPONSÁVEL', margins.left, yPosition);
  
  yPosition += 15;
  
  if (service.technicians && service.technicians.length > 0) {
    const technician = service.technicians[0];
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    
    const techInfo = [
      ['Nome:', technician.name],
      ['Função:', technician.role || 'Técnico'],
      ['Email:', technician.email || 'Não informado'],
      ['Telefone:', technician.phone || 'Não informado'],
    ];
    
    techInfo.forEach(([label, value], index) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, margins.left, yPosition + (index * 8));
      doc.setFont('helvetica', 'normal');
      doc.text(value, margins.left + 30, yPosition + (index * 8));
    });
    
    yPosition += techInfo.length * 8 + 15;
  } else {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(150, 150, 150);
    doc.text('Nenhum técnico atribuído', margins.left, yPosition);
    yPosition += 20;
  }
  
  return yPosition;
};

const createTimelineSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('CRONOGRAMA DO SERVIÇO', margins.left, yPosition);
  
  yPosition += 15;
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
  
  const timeline = [
    ['Criação:', formatDate(service.creationDate), '✓'],
    ['Atribuição:', service.technicians?.[0] ? 'Concluída' : 'Pendente', service.technicians?.[0] ? '✓' : '○'],
    ['Execução:', service.status === 'em_andamento' ? 'Em andamento' : service.status === 'concluido' ? 'Concluída' : 'Não iniciada', service.status === 'concluido' ? '✓' : service.status === 'em_andamento' ? '◐' : '○'],
    ['Conclusão:', service.status === 'concluido' ? formatDate(new Date().toISOString()) : 'Pendente', service.status === 'concluido' ? '✓' : '○'],
  ];
  
  timeline.forEach(([label, value, status], index) => {
    // Timeline indicator
    doc.setFont('helvetica', 'bold');
    doc.text(status as string, margins.left, yPosition + (index * 10));
    
    // Timeline content
    doc.setFont('helvetica', 'bold');
    doc.text(label as string, margins.left + 10, yPosition + (index * 10));
    doc.setFont('helvetica', 'normal');
    doc.text(value as string, margins.left + 40, yPosition + (index * 10));
  });
  
  yPosition += timeline.length * 10 + 15;
  
  return yPosition;
};

const createTechnicalFieldsSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Check if we need a new page
  if (yPosition > 200) {
    doc.addPage();
    yPosition = 20;
  }

  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('CAMPOS TÉCNICOS', margins.left, yPosition);
  
  yPosition += 15;
  
  const customFields = service.customFields || [];
  
  customFields.forEach((field: any) => {
    if (field.value) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
      doc.text(`${field.name}:`, margins.left, yPosition);
      
      doc.setFont('helvetica', 'normal');
      const valueText = typeof field.value === 'object' ? JSON.stringify(field.value) : String(field.value);
      const lines = doc.splitTextToSize(sanitizeText(valueText), pageWidth - margins.left - margins.right - 30);
      doc.text(lines, margins.left + 30, yPosition);
      
      yPosition += Math.max(8, lines.length * 5) + 5;
      
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 20;
      }
    }
  });
  
  return yPosition + 10;
};

const createMessagesSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Check if we need a new page
  if (yPosition > 180) {
    doc.addPage();
    yPosition = 20;
  }

  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('MENSAGENS E COMUNICAÇÕES', margins.left, yPosition);
  
  yPosition += 15;
  
  service.messages?.forEach((message, index) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(colors.muted.r, colors.muted.g, colors.muted.b);
    doc.text(`${formatDate(message.createdAt)} - ${message.senderId || 'Sistema'}:`, margins.left, yPosition);
    
    yPosition += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    const messageLines = doc.splitTextToSize(sanitizeText(message.content || ''), pageWidth - margins.left - margins.right);
    doc.text(messageLines, margins.left, yPosition);
    
    yPosition += messageLines.length * 5 + 8;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  return yPosition + 10;
};

const createFeedbackSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text('FEEDBACK DO CLIENTE', margins.left, yPosition);
  
  yPosition += 15;
  
  if (service.feedback) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.text.r, colors.text.g, colors.text.b);
    const feedbackText = typeof service.feedback === 'string' ? service.feedback : service.feedback.comment || '';
    const feedbackLines = doc.splitTextToSize(sanitizeText(feedbackText), pageWidth - margins.left - margins.right);
    doc.text(feedbackLines, margins.left, yPosition);
    yPosition += feedbackLines.length * 6 + 15;
  }
  
  return yPosition;
};

const createPhotosSection = async (doc: jsPDF, service: Service, yPosition: number): Promise<number> => {
  // Check if we need a new page
  if (yPosition > 150) {
    doc.addPage();
    yPosition = 20;
  }

  // Section title
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(colors.primary.r, colors.primary.g, colors.primary.b);
  doc.text(`ANEXOS E FOTOS (${service.photos?.length || 0})`, margins.left, yPosition);
  
  yPosition += 15;
  
  service.photos?.forEach((photo, index) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Foto ${index + 1}:`, margins.left, yPosition);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.text(photo, margins.left, yPosition + 8);
    
    yPosition += 20;
    
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }
  });
  
  return yPosition + 10;
};

const createFooter = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(colors.border.r, colors.border.g, colors.border.b);
    doc.line(margins.left, 280, pageWidth - margins.right, 280);
    
    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(colors.muted.r, colors.muted.g, colors.muted.b);
    
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, margins.left, 290);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - margins.right - 30, 290);
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pendente': return 'Pendente';
    case 'em_andamento': return 'Em Andamento';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return 'Indefinido';
  }
};

const getStatusColor = (status: string): [number, number, number] => {
  switch (status) {
    case 'concluido': return [34, 197, 94]; // green
    case 'cancelado': return [239, 68, 68]; // red
    case 'em_andamento': return [59, 130, 246]; // blue
    default: return [245, 158, 11]; // yellow
  }
};

const getPriorityColor = (priority: string): [number, number, number] => {
  switch (priority) {
    case 'alta': return [239, 68, 68]; // red
    case 'media': return [245, 158, 11]; // yellow
    case 'baixa': return [34, 197, 94]; // green
    default: return [107, 114, 128]; // gray
  }
};