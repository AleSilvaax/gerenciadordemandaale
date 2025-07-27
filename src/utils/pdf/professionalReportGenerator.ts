// ARQUIVO COMPLETO E FINAL (VERSÃO DE DESIGN V7.6): src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- PALETA DE DESIGN ---
const THEME_COLOR = [30, 80, 160];
const HEADING_COLOR = [45, 52, 54];
const BODY_TEXT_COLOR = [99, 110, 114];
const BORDER_COLOR = [223, 230, 233];
const CARD_BG_COLOR = [248, 249, 250];
const PAGE_MARGIN = 50;

// --- FUNÇÕES AUXILIARES DE DESIGN ---

const addPageHeader = (doc: jsPDF, service: Service) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(sanitizeText(service.title), PAGE_MARGIN, 40);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`OS: ${sanitizeText(service.number)}`, pageWidth - PAGE_MARGIN, 40, { align: 'right' });
    
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.setLineWidth(1);
    doc.line(PAGE_MARGIN, 55, pageWidth - PAGE_MARGIN, 55);
};

const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Página ${pageNum} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, pageHeight - 20, { align: 'center' });
};

const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  return text.replace(/[^a-zA-Z0-9áéíóúâêîôûàèìòùäëïöüçÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s.,:;!?@#$%*()_+-=\[\]{}/\\|"'`~]/g, '');
};

// --- FUNÇÃO PRINCIPAL ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V7.6 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PÁGINA 1: CAPA (Design V7.5 Mantido) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.rect(0, pageHeight - 200, pageWidth / 2, 200, 'F');
    doc.setFillColor(THEME_COLOR[0]-15, THEME_COLOR[1]-40, THEME_COLOR[2]-60);
    doc.rect(0, pageHeight - 180, pageWidth / 1.5, 180, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("Relatório de Serviço", PAGE_MARGIN, 120);
    doc.setDrawColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.setLineWidth(3);
    doc.line(PAGE_MARGIN, 135, PAGE_MARGIN + 80, 135);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(sanitizeText(service.title), pageWidth - (PAGE_MARGIN * 2));
    doc.text(titleLines, PAGE_MARGIN, 200);
    const rightInfoX = pageWidth - PAGE_MARGIN - 200;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text('CLIENTE', rightInfoX, pageHeight / 2 + 80);
    doc.text('ORDEM DE SERVIÇO', rightInfoX, pageHeight / 2 + 120);
    doc.text('DATA DE GERAÇÃO', rightInfoX, pageHeight / 2 + 160);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(sanitizeText(service.client), rightInfoX, pageHeight / 2 + 95);
    doc.text(sanitizeText(service.number), rightInfoX, pageHeight / 2 + 135);
    doc.text(new Date().toLocaleDateString('pt-BR'), rightInfoX, pageHeight / 2 + 175);
    
    // --- PÁGINAS DE CONTEÚDO ---
    doc.addPage();
    let currentY = 80;

    // CARD DE STATUS
    const statusText = sanitizeText(service.status).toUpperCase();
    const statusColors = { 'pendente': [255, 193, 7], 'concluido': [40, 167, 69], 'cancelado': [220, 53, 69] };
    const statusColor = statusColors[service.status as keyof typeof statusColors] || [108, 117, 125];
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.setTextColor(255, 255, 255);
    doc.roundedRect(pageWidth - PAGE_MARGIN - 100, currentY - 13, 100, 20, 10, 10, 'F');
    doc.text(statusText, pageWidth - PAGE_MARGIN - 50, currentY, { align: 'center' });
    
    // CARDS DE RESUMO
    currentY += 40;
    const cardWidth = (pageWidth - (PAGE_MARGIN * 2) - 20) / 2;
    const cardHeight = 120;
    // Card Cliente
    doc.setFillColor(CARD_BG_COLOR[0], CARD_BG_COLOR[1], CARD_BG_COLOR[2]);
    doc.roundedRect(PAGE_MARGIN, currentY, cardWidth, cardHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("👤 Informações do Cliente", PAGE_MARGIN + 15, currentY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Cliente: ${sanitizeText(service.client)}`, PAGE_MARGIN + 15, currentY + 50);
    doc.text(`Local: ${sanitizeText(service.location)}`, PAGE_MARGIN + 15, currentY + 65);
    doc.text(`Endereço: ${sanitizeText(service.address)}`, PAGE_MARGIN + 15, currentY + 80, { maxWidth: cardWidth - 30 });
    // Card Serviço
    doc.roundedRect(PAGE_MARGIN + cardWidth + 20, currentY, cardWidth, cardHeight, 5, 5, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("🛠️ Detalhes do Serviço", PAGE_MARGIN + cardWidth + 35, currentY + 25);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Tipo: ${sanitizeText(service.serviceType)}`, PAGE_MARGIN + cardWidth + 35, currentY + 50);
    const techniciansText = (service.technicians && service.technicians.length > 0) ? service.technicians.map(t => sanitizeText(t.name)).join(', ') : 'N/A';
    doc.text(`Técnicos: ${techniciansText}`, PAGE_MARGIN + cardWidth + 35, currentY + 65, { maxWidth: cardWidth - 30 });
    currentY += cardHeight + 40;

    // CHECKLIST TÉCNICO
    if (service.customFields && service.customFields.length > 0) {
        if (currentY > pageHeight - 200) { doc.addPage(); currentY = 80; }
        autoTable(doc, {
            startY: currentY,
            head: [['Checklist Técnico', 'Valor / Status']],
            body: service.customFields.map(f => [sanitizeText(f.label), typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : sanitizeText(f.value?.toString())]),
            theme: 'grid',
            headStyles: { fillColor: HEADING_COLOR, fontSize: 11, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 8 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // REGISTRO FOTOGRÁFICO
    if (photos && photos.length > 0) {
        if (currentY > pageHeight - 300) { doc.addPage(); currentY = 80; }
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
        doc.text("Registro Fotográfico", PAGE_MARGIN, currentY);
        currentY += 30;
        const photoSize = (pageWidth - (PAGE_MARGIN * 2) - 20) / 2;
        let x = PAGE_MARGIN;
        for (const photo of photos) {
            if (x > PAGE_MARGIN) { x += 20; } else { currentY += 10; } // Espaçamento
            if (currentY + photoSize > pageHeight - 60) { doc.addPage(); currentY = 80; }
            doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
            doc.setFontSize(9);
            doc.text(sanitizeText(photo.title), x + photoSize / 2, currentY + photoSize + 15, { align: 'center' });
            x += photoSize;
            if (x > pageWidth/2) { x = PAGE_MARGIN; currentY += photoSize + 30; }
        }
    }

    // ASSINATURAS
    if (service.signatures?.client || service.signatures?.technician) {
        doc.addPage();
        currentY = 80;
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
        doc.text("Assinaturas", PAGE_MARGIN, currentY);
        currentY += 60;
        const sigWidth = 200;
        const sigHeight = 100;
        if (service.signatures.client) {
            const clientX = PAGE_MARGIN + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
            doc.addImage(service.signatures.client, 'PNG', clientX, currentY, sigWidth, sigHeight);
            doc.line(clientX, currentY + sigHeight + 5, clientX + sigWidth, currentY + sigHeight + 5);
            doc.text(sanitizeText(service.client), clientX + (sigWidth / 2), currentY + sigHeight + 20, { align: 'center' });
        }
        if (service.signatures.technician) {
            const techX = (pageWidth / 2) + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
            doc.addImage(service.signatures.technician, 'PNG', techX, currentY, sigWidth, sigHeight);
            doc.line(techX, currentY + sigHeight + 5, techX + sigWidth, currentY + sigHeight + 5);
            const technicianName = (service.technicians && service.technicians.length > 0 && service.technicians[0].name) ? sanitizeText(service.technicians[0].name) : 'Técnico';
            doc.text(technicianName, techX + (sigWidth / 2), currentY + sigHeight + 20, { align: 'center' });
        }
    }
    
    // FINALIZAÇÃO
    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i);
      addPageHeader(doc, service);
      addPageFooter(doc, i, pageCount);
    }
    
    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório de Design V7.6 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório de Design V7.6: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
