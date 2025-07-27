// ARQUIVO COMPLETO E FINAL: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- PALETA DE DESIGN MODERNO ---
const THEME_COLOR = [30, 80, 160];      // Azul primário
const HEADING_COLOR = [45, 52, 54];     // Cinza escuro para títulos
const BODY_TEXT_COLOR = [99, 110, 114];  // Cinza médio para textos
const BORDER_COLOR = [223, 230, 233];  // Cinza claro para bordas e linhas
const CARD_BG_COLOR = [248, 249, 250]; // Fundo de "card" muito sutil
const PAGE_MARGIN = 50;

// --- FUNÇÕES AUXILIARES DE DESIGN ---

// Desenha um "card" com borda arredondada para cada seção
const drawCard = (doc: jsPDF, startY: number, height: number) => {
  doc.setFillColor(CARD_BG_COLOR[0], CARD_BG_COLOR[1], CARD_BG_COLOR[2]);
  doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
  doc.roundedRect(PAGE_MARGIN - 15, startY - 10, doc.internal.pageSize.getWidth() - (PAGE_MARGIN - 15) * 2, height + 20, 5, 5, 'FD');
};

const addPageHeader = (doc: jsPDF, service: Service) => {
    const pageWidth = doc.internal.pageSize.getWidth();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.text("Relatório de Serviço", PAGE_MARGIN, 30);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(`OS: ${service.number || 'N/A'}`, pageWidth - PAGE_MARGIN, 30, { align: 'right' });
    doc.setDrawColor(BORDER_COLOR[0], BORDER_COLOR[1], BORDER_COLOR[2]);
    doc.line(PAGE_MARGIN, 40, pageWidth - PAGE_MARGIN, 40);
};

const addPageFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(`Página ${pageNum} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, pageHeight - 20, { align: 'center' });
};

// --- FUNÇÃO PRINCIPAL ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V6 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PÁGINA 1: CAPA MINIMALISTA ---
    doc.setFillColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(40);
    doc.setTextColor(255, 255, 255);
    doc.text("Relatório de Serviço", pageWidth / 2, pageHeight / 2 - 60, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    doc.text(service.title || "Detalhes da Demanda", pageWidth / 2, pageHeight / 2 - 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} por ${user.name || 'N/A'}`, pageWidth / 2, pageHeight - 60, { align: 'center' });
    doc.text(`Cliente: ${service.client || 'N/A'} | OS: ${service.number || 'N/A'}`, pageWidth / 2, pageHeight - 45, { align: 'center' });

    // --- PÁGINAS DE CONTEÚDO ---
    doc.addPage();
    let currentY = 70;

    // CARD 1: Informações Gerais
    const summaryBody = [
        ['CLIENTE', service.client || 'N/A'],
        ['LOCAL', service.location || 'N/A'],
        ['ENDEREÇO', service.address || 'N/A'],
        ['TÉCNICOS', service.technicians?.map(t => t.name).join(', ') || 'N/A'],
    ];
    autoTable(doc, {
        startY: currentY + 20,
        body: summaryBody,
        theme: 'plain',
        styles: { fontSize: 10, cellPadding: 4, textColor: BODY_TEXT_COLOR },
        columnStyles: { 0: { fontStyle: 'bold', textColor: HEADING_COLOR, cellWidth: 100 } }
    });
    const summaryHeight = (doc as any).lastAutoTable.finalY - currentY;
    drawCard(doc, currentY - 20, summaryHeight + 20);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text("Informações Gerais", PAGE_MARGIN, currentY);
    currentY = (doc as any).lastAutoTable.finalY + 40;

    // CARD 2: Checklist Técnico
    if (service.customFields && service.customFields.length > 0) {
        if (currentY > pageHeight - 200) { doc.addPage(); currentY = 70; }
        
        autoTable(doc, {
            startY: currentY + 20,
            head: [['ITEM', 'VALOR / STATUS']],
            body: service.customFields.map(f => [f.label, typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : f.value?.toString() || 'N/A']),
            theme: 'grid',
            headStyles: { fillColor: THEME_COLOR, fontSize: 10 },
            styles: { fontSize: 10, textColor: BODY_TEXT_COLOR }
        });
        const checklistHeight = (doc as any).lastAutoTable.finalY - currentY;
        drawCard(doc, currentY - 20, checklistHeight + 20);
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
        doc.text("Checklist Técnico", PAGE_MARGIN, currentY);
        currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // CARD 3: Registro Fotográfico
    if (photos && photos.length > 0) {
        if (currentY > pageHeight - 300) { doc.addPage(); currentY = 70; }
        const photoCardStartY = currentY;

        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
        doc.text("Registro Fotográfico", PAGE_MARGIN, currentY);
        currentY += 20;
        
        const photoSize = 150;
        const gap = 20;
        let x = PAGE_MARGIN;
        for (const photo of photos) {
            if (x + photoSize > pageWidth - PAGE_MARGIN) {
                x = PAGE_MARGIN;
                currentY += photoSize + 30;
            }
            if (currentY + photoSize > pageHeight - 60) {
                drawCard(doc, photoCardStartY - 20, currentY - photoCardStartY + 10);
                doc.addPage();
                currentY = 70;
            }
            try {
                doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
                doc.setFontSize(9);
                doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
                doc.text(photo.title || 'Sem título', x + photoSize / 2, currentY + photoSize + 12, { align: 'center' });
            } catch (e) { /* Erro de imagem */ }
            x += photoSize + gap;
        }
        const photoCardHeight = currentY + photoSize - photoCardStartY;
        drawCard(doc, photoCardStartY - 20, photoCardHeight + 20);
        currentY += photoSize + 40;
    }
    
    // CARD 4: Assinaturas
    if (service.signatures?.client || service.signatures?.technician) {
        if (currentY > pageHeight - 150) { doc.addPage(); currentY = 70; }
        const sigCardY = currentY;
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
        doc.text("Assinaturas", PAGE_MARGIN, currentY);
        currentY += 40;

        const sigWidth = 180, sigHeight = 90;
        if (service.signatures.client) {
            const clientX = PAGE_MARGIN + 10;
            doc.addImage(service.signatures.client, 'PNG', clientX, currentY, sigWidth, sigHeight);
            doc.line(clientX, currentY + sigHeight + 5, clientX + sigWidth, currentY + sigHeight + 5);
            doc.text(service.client || 'Cliente', clientX + (sigWidth / 2), currentY + sigHeight + 20, { align: 'center' });
        }
        if (service.signatures.technician) {
            const techX = pageWidth - PAGE_MARGIN - sigWidth - 10;
            doc.addImage(service.signatures.technician, 'PNG', techX, currentY, sigWidth, sigHeight);
            doc.line(techX, currentY + sigHeight + 5, techX + sigWidth, currentY + sigHeight + 5);
            doc.text(service.technicians?.[0]?.name || 'Técnico', techX + (sigWidth / 2), currentY + sigHeight + 20, { align: 'center' });
        }
        
        drawCard(doc, sigCardY - 20, 150);
    }

    // --- Finalização ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i);
      addPageHeader(doc, service);
      addPageFooter(doc, i, pageCount);
    }
    
    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório de Design V6 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório de Design V6: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
