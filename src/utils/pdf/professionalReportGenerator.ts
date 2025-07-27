// ARQUIVO COMPLETO E FINAL (VERSÃO ESTÁVEL V7.4): src/utils/pdf/professionalReportGenerator.ts

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

// CORREÇÃO 1: Removidos os ícones que causavam erro de caractere.
const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text(title, PAGE_MARGIN, y);
    doc.setDrawColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
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
    logger.info(`Gerando Relatório Estável V7.4 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();

    // --- PÁGINA 1: CAPA (CORREÇÃO 2 - Novo Design Gráfico) ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    // Elemento gráfico de fundo
    doc.setFillColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.rect(0, 0, pageWidth / 2.5, pageHeight, 'F');

    // Títulos na capa
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(255, 255, 255);
    doc.text("RELATÓRIO DE SERVIÇO", 40, 80);

    doc.setFontSize(36);
    const titleLines = doc.splitTextToSize(sanitizeText(service.title), (pageWidth / 2.5) - 60);
    doc.text(titleLines, 40, 140);
    
    // Informações no lado direito
    const rightColumnX = pageWidth / 2.5 + 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(HEADING_COLOR[0], HEADING_COLOR[1], HEADING_COLOR[2]);
    doc.text('Cliente:', rightColumnX, pageHeight - 120);
    doc.text('Ordem de Serviço:', rightColumnX, pageHeight - 100);
    doc.text('Data de Geração:', rightColumnX, pageHeight - 80);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(BODY_TEXT_COLOR[0], BODY_TEXT_COLOR[1], BODY_TEXT_COLOR[2]);
    doc.text(sanitizeText(service.client), rightColumnX + 120, pageHeight - 120);
    doc.text(sanitizeText(service.number), rightColumnX + 120, pageHeight - 100);
    doc.text(new Date().toLocaleDateString('pt-BR'), rightColumnX + 120, pageHeight - 80);


    // --- PÁGINAS DE CONTEÚDO ---
    doc.addPage();
    let currentY = 70;

    currentY = addSectionTitle(doc, "Resumo da Demanda", currentY);
    // ... (resto do código igual) ...
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
    
    // CORREÇÃO 3: Assinaturas sempre em uma nova página
    if (service.signatures?.client || service.signatures?.technician) {
        doc.addPage(); // Força uma nova página
        currentY = 70; // Reseta a posição Y
        currentY = addSectionTitle(doc, "Assinaturas", currentY);
        const sigY = currentY;
        const sigWidth = 200;
        const sigHeight = 100;
        if (service.signatures.client) {
            const clientX = PAGE_MARGIN + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2; // Centraliza na primeira metade
            doc.addImage(service.signatures.client, 'PNG', clientX, sigY, sigWidth, sigHeight);
            doc.line(clientX, sigY + sigHeight + 5, clientX + sigWidth, sigY + sigHeight + 5);
            doc.text(sanitizeText(service.client), clientX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }
        if (service.signatures.technician) {
            const techX = (pageWidth / 2) + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2; // Centraliza na segunda metade
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
    logger.info(`Relatório Estável V7.4 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório Estável V7.4: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
