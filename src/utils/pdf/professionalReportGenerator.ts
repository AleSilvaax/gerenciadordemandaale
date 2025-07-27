// ARQUIVO COMPLETO E FINAL: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- CONFIGURAÇÕES DE DESIGN ---
const THEME_COLOR = [30, 80, 160];
const TEXT_COLOR_DARK = [45, 52, 54];
const TEXT_COLOR_LIGHT = [127, 140, 141];
const PAGE_MARGIN = 40;

// --- IMAGEM DE FUNDO EM BASE64 ---
// SUBSTITUA A LINHA ABAIXO PELO CÓDIGO BASE64 QUE VOCÊ GEROU NO PASSO 1
const backgroundImageBase64 = 'COLE_AQUI_O_SEU_CODIGO_BASE64_LONGO';

// --- FUNÇÕES AUXILIARES DE DESIGN ---

const addHeaderAndFooter = (doc: jsPDF, pageNum: number, totalPages: number, service: Service) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
  doc.text("Relatório de Serviço", PAGE_MARGIN, 25);
  doc.text(`OS: ${service.number || 'N/A'}`, pageWidth - PAGE_MARGIN, 25, { align: 'right' });
  doc.setDrawColor(230, 230, 230);
  doc.line(PAGE_MARGIN, 35, pageWidth - PAGE_MARGIN, 35);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
  doc.text(`Cliente: ${service.client || 'N/A'}`, PAGE_MARGIN, pageHeight - 20);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth - PAGE_MARGIN, pageHeight - 20, { align: 'right' });
};

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
  doc.text(title, PAGE_MARGIN, y);
  return y + 25; // Aumentado o espaçamento após o título
};

// --- FUNÇÃO PRINCIPAL DE GERAÇÃO ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V5 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 0;

    // --- PÁGINA 1: CAPA ---
    if (backgroundImageBase64.startsWith('data:image')) {
        doc.addImage(backgroundImageBase64, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
        doc.setFillColor(255, 255, 255, 0.85);
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    }
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    doc.text(new Date().toLocaleDateString('pt-BR'), PAGE_MARGIN, 60);
    doc.text(`Exportado por: ${user.name || 'N/A'}`, PAGE_MARGIN, 75);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(48);
    doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
    doc.text("Relatório\nde Serviço", pageWidth / 2, pageHeight / 2 - 50, { align: 'center' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.setTextColor(TEXT_COLOR_DARK[0], TEXT_COLOR_DARK[1], TEXT_COLOR_DARK[2]);
    doc.text(`Cliente: ${service.client || 'N/A'}`, PAGE_MARGIN, pageHeight - 60);
    doc.text(`OS: ${service.number || 'N/A'}`, PAGE_MARGIN, pageHeight - 45);


    // --- PÁGINAS SEGUINTES ---
    doc.addPage();
    currentY = 60;

    currentY = addSectionTitle(doc, "Resumo da Demanda", currentY);
    autoTable(doc, {
        startY: currentY,
        body: [
            ['Status', service.status],
            ['Tipo de Serviço', service.serviceType || 'N/A'],
            ['Técnicos', service.technicians?.map(t => t.name).join(', ') || 'N/A'],
            ['Descrição', service.description || 'N/A'],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: { top: 5, right: 5, bottom: 5, left: 0 } },
        columnStyles: { 0: { fontStyle: 'bold', cellWidth: 120 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 40; // Aumentado espaçamento

    if (service.customFields && service.customFields.length > 0) {
        if (currentY > pageHeight - 200) { doc.addPage(); currentY = 60; }
        currentY = addSectionTitle(doc, "Checklist Técnico", currentY);
        autoTable(doc, {
            startY: currentY,
            head: [['Item', 'Valor/Status']],
            body: service.customFields.map(f => [f.label, typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : f.value?.toString() || 'N/A']),
            theme: 'grid',
            headStyles: { fillColor: THEME_COLOR },
        });
        currentY = (doc as any).lastAutoTable.finalY + 40; // Aumentado espaçamento
    }

    if (photos && photos.length > 0) {
      if (currentY > pageHeight - 250) { doc.addPage(); currentY = 60; }
      currentY = addSectionTitle(doc, `Registro Fotográfico (${photos.length})`, currentY);
      
      const photoSize = 150;
      const gap = 20;
      let x = PAGE_MARGIN;

      for (const photo of photos) {
        if (x + photoSize > pageWidth - PAGE_MARGIN) {
            x = PAGE_MARGIN;
            currentY += photoSize + 40; // Aumentado espaçamento para a legenda
        }
        if (currentY + photoSize > pageHeight - 60) {
            doc.addPage();
            currentY = 60;
        }
        try {
            doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
            doc.setFontSize(9);
            doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
            doc.text(photo.title || 'Sem título', x + photoSize / 2, currentY + photoSize + 15, { align: 'center' });
        } catch(e) {
            doc.setFillColor(240, 240, 240);
            doc.rect(x, currentY, photoSize, photoSize, 'F');
            doc.text('Erro ao carregar foto', x + photoSize / 2, currentY + photoSize / 2, { align: 'center' });
        }
        x += photoSize + gap;
      }
      currentY += photoSize + 50;
    }
    
    if (service.signatures?.client || service.signatures?.technician) {
        if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
        currentY = addSectionTitle(doc, "Assinaturas", currentY);
        const sigY = currentY;
        const sigWidth = 180;
        const sigHeight = 90;

        if (service.signatures.client) {
            const clientX = PAGE_MARGIN;
            doc.addImage(service.signatures.client, 'PNG', clientX, sigY, sigWidth, sigHeight);
            doc.line(clientX, sigY + sigHeight + 5, clientX + sigWidth, sigY + sigHeight + 5);
            doc.text(service.client || 'Cliente', clientX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }

        if (service.signatures.technician) {
            const techX = pageWidth - PAGE_MARGIN - sigWidth;
            doc.addImage(service.signatures.technician, 'PNG', techX, sigY, sigWidth, sigHeight);
            doc.line(techX, sigY + sigHeight + 5, techX + sigWidth, sigY + sigHeight + 5);
            doc.text(service.technicians?.[0]?.name || 'Técnico', techX + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
        }
    }

    const pageCount = doc.getNumberOfPages();
    for (let i = 2; i <= pageCount; i++) {
      doc.setPage(i);
      addHeaderAndFooter(doc, i, pageCount, service);
    }
    
    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório de Design V5 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório de Design V5: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
