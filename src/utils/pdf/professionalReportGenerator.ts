// ARQUIVO COMPLETO E FINAL (VERSÃO ESTÁVEL V7.3): src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- PALETA DE DESIGN ---
const THEME_COLOR = [30, 80, 160];
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

const addSectionTitleWithIcon = (doc: jsPDF, title: string, icon: string, y: number) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.text(icon, PAGE_MARGIN, y);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(title, PAGE_MARGIN + 20, y);
    doc.setDrawColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.setLineWidth(1.5);
    doc.line(PAGE_MARGIN + 20, y + 5, PAGE_MARGIN + 60, y + 5);
    return y + 40;
};

// CORREÇÃO 3: Função para limpar caracteres inválidos
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  // Remove caracteres que o jsPDF não consegue renderizar por padrão
  return text.replace(/[^a-zA-Z0-9áéíóúâêîôûàèìòùäëïöüçÁÉÍÓÚÂÊÎÔÛÀÈÌÒÙÄËÏÖÜÇ\s.,:;!?@#$%*()_+-=\[\]{}/\\|"'`~]/g, '');
};


// --- FUNÇÃO PRINCIPAL ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V7.3 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PÁGINA 1: CAPA ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("RELATÓRIO DE SERVIÇO", PAGE_MARGIN, 80);
    doc.setFontSize(48);
    doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    const titleLines = doc.splitTextToSize(sanitizeText(service.title), pageWidth - (PAGE_MARGIN * 2));
    doc.text(titleLines, PAGE_MARGIN, 140);
    
    // CORREÇÃO 1: Removida a linha que causava o "risco" no título.

    const infoY = pageHeight - 120;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.text('Cliente:', PAGE_MARGIN, infoY);
    doc.text('Ordem de Serviço:', PAGE_MARGIN, infoY + 20);
    doc.text('Data de Geração:', PAGE_MARGIN, infoY + 40);
    doc.setFont('helvetica', 'normal');
    doc.text(sanitizeText(service.client), PAGE_MARGIN + 120, infoY);
    doc.text(sanitizeText(service.number), PAGE_MARGIN + 120, infoY + 20);
    doc.text(new Date().toLocaleDateString('pt-BR'), PAGE_MARGIN + 120, infoY + 40);

    // --- PÁGINAS DE CONTEÚDO ---
    doc.addPage();
    let currentY = 70;

    currentY = addSectionTitleWithIcon(doc, "Resumo da Demanda", "i", currentY);
    const rightColumnX = pageWidth / 2 + 30;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("CLIENTE E LOCAL", PAGE_MARGIN, currentY);
    doc.text("DETALHES DO SERVIÇO", rightColumnX, currentY);
    currentY += 15;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Cliente: ${sanitizeText(service.client)}`, PAGE_MARGIN, currentY);
    doc.text(`Status: ${sanitizeText(service.status)}`, rightColumnX, currentY);
    currentY += 15;
    doc.text(`Local: ${sanitizeText(service.location)}`, PAGE_MARGIN, currentY);
    doc.text(`Tipo: ${sanitizeText(service.serviceType)}`, rightColumnX, currentY);
    currentY += 15;
    const addressLines = doc.splitTextToSize(`Endereço: ${sanitizeText(service.address)}`, (pageWidth / 2) - PAGE_MARGIN - 10);
    doc.text(addressLines, PAGE_MARGIN, currentY);
    const techniciansText = (service.technicians && service.technicians.length > 0) 
      ? service.technicians.map(t => sanitizeText(t.name)).join(', ') 
      : 'Nenhum técnico atribuído';
    doc.text(`Técnicos: ${techniciansText}`, rightColumnX, currentY);
    currentY += addressLines.length * 12 + 40;

    if (service.customFields && service.customFields.length > 0) {
        if (currentY > pageHeight - 200) { doc.addPage(); currentY = 70; }
        currentY = addSectionTitleWithIcon(doc, "Checklist Técnico", "✓", currentY);
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

    // CORREÇÃO 2: Layout de fotos centralizado com 2 por linha
    if (photos && photos.length > 0) {
        if (currentY > pageHeight - 300) { doc.addPage(); currentY = 70; }
        currentY = addSectionTitleWithIcon(doc, "Registro Fotográfico", "📷", currentY);
        
        const photoSize = (pageWidth - (PAGE_MARGIN * 2) - 40) / 2; // Tamanho para 2 fotos com espaço
        const initialX = PAGE_MARGIN;
        let x = initialX;
        let photoCountInRow = 0;

        for (const photo of photos) {
            if (photoCountInRow >= 2) {
                x = initialX;
                currentY += photoSize + 40; // Espaço para a legenda
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
            x += photoSize + 40; // Mover para a próxima posição
            photoCountInRow++;
        }
        currentY += photoSize + 50;
    }
    
    if (service.signatures?.client || service.signatures?.technician) {
        if (currentY > pageHeight - 150) { doc.addPage(); currentY = 70; }
        currentY = addSectionTitleWithIcon(doc, "Assinaturas", "✍️", currentY);
        const sigY = currentY;
        const sigWidth = 200;
        const sigHeight = 100;
        if (service.signatures.client) {
            const clientX = PAGE_MARGIN;
            doc.addImage(service.signatures.client, 'PNG', clientX, sigY, sigWidth, sigHeight);
            doc.line(clientX, sigY + sigHeight + 5, clientX + sigWidth, sigY + sigHeight + 5);
            doc.text(sanitizeText(service.client), clientX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }
        if (service.signatures.technician) {
            const techX = pageWidth - PAGE_MARGIN - sigWidth;
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
    logger.info(`Relatório Estável V7.3 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório Estável V7.3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
