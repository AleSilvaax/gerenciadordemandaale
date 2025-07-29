// ARQUIVO COMPLETO E FINAL (VERSÃO DE DESIGN V7.7): src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- PALETA DE DESIGN ---
const THEME_COLOR_DARK = [30, 80, 160];
const THEME_COLOR_LIGHT = [75, 125, 200];
const HEADING_COLOR = [45, 52, 54];
const BODY_TEXT_COLOR = [99, 110, 114];
const BORDER_COLOR = [223, 230, 233];
const PAGE_MARGIN = 50;

// --- FUNÇÕES AUXILIARES ---

const addPageHeaderAndFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.line(PAGE_MARGIN, 40, pageWidth - PAGE_MARGIN, 40);
    doc.setFontSize(8);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
};

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(title, PAGE_MARGIN, y);
    doc.setDrawColor(THEME_COLOR_DARK[0], THEME_COLOR_DARK[1], THEME_COLOR_DARK[2]);
    doc.setLineWidth(1.5);
    doc.line(PAGE_MARGIN, y + 5, PAGE_MARGIN + 40, y + 5);
    return y + 40;
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
    logger.info(`Gerando Relatório de Design V7.7 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PÁGINA 1: CAPA (Design V7.5 Mantido) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFillColor(THEME_COLOR_LIGHT[0], THEME_COLOR_LIGHT[1], THEME_COLOR_LIGHT[2]);
    doc.rect(0, pageHeight - 200, pageWidth / 2, 200, 'F');
    doc.setFillColor(THEME_COLOR_DARK[0], THEME_COLOR_DARK[1], THEME_COLOR_DARK[2]);
    doc.rect(0, pageHeight - 180, pageWidth / 1.5, 180, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("Relatório de Serviço", PAGE_MARGIN, 120);
    doc.setDrawColor(THEME_COLOR_DARK[0], THEME_COLOR_DARK[1], THEME_COLOR_DARK[2]);
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
    
    // --- PÁGINAS DE CONTEÚDO (Layout V7.4 Restaurado, sem Cards) ---
    doc.addPage();
    let currentY = 70;

    currentY = addSectionTitle(doc, "Resumo da Demanda", currentY);
    const techniciansText = (service.technicians && service.technicians.length > 0) 
      ? service.technicians.map(t => sanitizeText(t.name)).join(', ') 
      : 'Nenhum técnico atribuído';
    autoTable(doc, {
        startY: currentY,
        body: [
            ['Cliente', sanitizeText(service.client)],
            ['Local', sanitizeText(service.location)],
            ['Endereço', sanitizeText(service.address)],
            ['Status', sanitizeText(service.status)],
            ['Tipo de Serviço', sanitizeText(service.serviceType)],
            ['Técnicos', techniciansText],
            ['Descrição', sanitizeText(service.description)],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: { top: 6, right: 5, bottom: 6, left: 0 } },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 50;

    if (service.customFields && service.customFields.length > 0) {
        if (currentY > pageHeight - 200) { doc.addPage(); currentY = 70; }
        currentY = addSectionTitle(doc, "Checklist Técnico", currentY);
        autoTable(doc, {
            startY: currentY,
            head: [['ITEM', 'VALOR / STATUS']],
            body: service.customFields.map(f => [sanitizeText(f.label), typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : sanitizeText(f.value?.toString())]),
            theme: 'striped',
            headStyles: { fillColor: HEADING_COLOR },
            styles: { fontSize: 10 }
        });
        currentY = (doc as any).lastAutoTable.finalY + 50;
    }

    if (photos && photos.length > 0) {
        if (currentY > pageHeight - 300) { doc.addPage(); currentY = 70; }
        currentY = addSectionTitle(doc, "Registro Fotográfico", currentY);
        const photoSize = (pageWidth - (PAGE_MARGIN * 2) - 40) / 2;
        const initialX = PAGE_MARGIN;
        let x = initialX;
        let photoCountInRow = 0;
        for (const photo of photos) {
            if (photoCountInRow >= 2) {
                x = initialX;
                currentY += photoSize + 40;
                photoCountInRow = 0;
            }
            if (currentY + photoSize > pageHeight - 60) {
                doc.addPage();
                currentY = 70;
            }
            try {
                doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
                doc.setFontSize(9);
                doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
                doc.text(sanitizeText(photo.title), x + photoSize / 2, currentY + photoSize + 15, { align: 'center' });
            } catch (e) { /* Erro de imagem */ }
            x += photoSize + 40;
            photoCountInRow++;
        }
        currentY += photoSize + 50;
    }
    
    if (service.signatures?.client || service.signatures?.technician) {
        doc.addPage();
        currentY = 70;
        currentY = addSectionTitle(doc, "Assinaturas", currentY);
        const sigY = currentY;
        const sigWidth = 200;
        const sigHeight = 100;
        if (service.signatures.client) {
            const clientX = PAGE_MARGIN + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
            doc.addImage(service.signatures.client, 'PNG', clientX, sigY, sigWidth, sigHeight);
            doc.line(clientX, sigY + sigHeight + 5, clientX + sigWidth, sigY + sigHeight + 5);
            doc.text(sanitizeText(service.client), clientX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }
        if (service.signatures.technician) {
            const techX = (pageWidth / 2) + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
            doc.addImage(service.signatures.technician, 'PNG', techX, sigY, sigWidth, sigHeight);
            doc.line(techX, sigY + sigHeight + 5, techX + sigWidth, sigY + sigHeight + 5);
            const technicianName = (service.technicians && service.technicians.length > 0 && service.technicians[0].name)
                                   ? sanitizeText(service.technicians[0].name)
                                   : 'Técnico';
            doc.text(technicianName, techX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i);
      addPageHeaderAndFooter(doc, i, pageCount);
    }
    
    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório Estável V7.7 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório Estável V7.7: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};

