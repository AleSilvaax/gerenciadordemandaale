// ARQUIVO COMPLETO E RECONSTRUÍDO: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- CONFIGURAÇÕES DE DESIGN ---
const THEME_COLOR = [30, 80, 160]; // Um azul predominante, como você sugeriu
const TEXT_COLOR_DARK = [45, 52, 54];
const TEXT_COLOR_LIGHT = [127, 140, 141];
const PAGE_MARGIN = 40; // Pontos (pt)

// --- FUNÇÕES AUXILIARES DE DESIGN ---

const addHeaderAndFooter = (doc: jsPDF, pageNum: number, totalPages: number, service: Service) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Cabeçalho
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(THEME_COLOR[0], THEME_COLOR[1], THEME_COLOR[2]);
  doc.text("Relatório de Serviço", PAGE_MARGIN, 25);
  doc.text(`OS: ${service.number || 'N/A'}`, pageWidth - PAGE_MARGIN, 25, { align: 'right' });
  doc.setDrawColor(230, 230, 230);
  doc.line(PAGE_MARGIN, 35, pageWidth - PAGE_MARGIN, 35);

  // Rodapé
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
  return y + 20;
};

// --- FUNÇÃO PRINCIPAL DE GERAÇÃO ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V4 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let currentY = 0;

    // --- PÁGINA 1: CAPA ---
    // NOTA: A URL da imagem deve ser acessível publicamente (CORS).
    // O ideal é hospedá-la em um local como o próprio Supabase Storage.
    // Substitua a URL de exemplo abaixo pela URL real da sua imagem.
    const backgroundImageUrl = 'https://images.unsplash.com/photo-1510915228340-29c85a43dcfe?auto=format&fit=crop&w=800&q=60';
    try {
        doc.addImage(backgroundImageUrl, 'JPEG', 0, 0, pageWidth, pageHeight, '', 'FAST');
        doc.setFillColor(255, 255, 255, 0.85); // Retângulo branco com 85% de opacidade por cima
        doc.rect(0, 0, pageWidth, pageHeight, 'F');
    } catch(e) {
        console.warn("Imagem de fundo não encontrada ou erro de CORS. Usando fundo branco.");
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
            ['Técnicos Responsáveis', service.technicians?.map(t => t.name).join(', ') || 'N/A'],
            ['Descrição', service.description || 'N/A'],
        ],
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: { top: 5, right: 5, bottom: 5, left: 0 } },
        columnStyles: { 0: { fontStyle: 'bold' } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 30;

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
        currentY = (doc as any).lastAutoTable.finalY + 30;
    }

    if (photos && photos.length > 0) {
      if (currentY > pageHeight - 250) { doc.addPage(); currentY = 60; }
      currentY = addSectionTitle(doc, `Registro Fotográfico (${photos.length})`, currentY);
      
      const photoSize = (pageWidth - (PAGE_MARGIN * 2) - 20) / 3;
      let x = PAGE_MARGIN;

      for (const photo of photos) {
        if (x + photoSize > pageWidth - PAGE_MARGIN) {
            x = PAGE_MARGIN;
            currentY += photoSize + 30;
        }
        if (currentY + photoSize > pageHeight - 60) {
            doc.addPage();
            currentY = 60;
        }
        try {
            doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
            doc.setFontSize(8);
            doc.setTextColor(TEXT_COLOR_LIGHT[0], TEXT_COLOR_LIGHT[1], TEXT_COLOR_LIGHT[2]);
            doc.text(photo.title || 'Sem título', x + photoSize / 2, currentY + photoSize + 10, { align: 'center' });
        } catch(e) {
            console.error("Erro ao adicionar imagem:", e);
            doc.text('Erro ao carregar foto', x + photoSize / 2, currentY + photoSize / 2, { align: 'center' });
        }
        x += photoSize + 10;
      }
      currentY += photoSize + 40;
    }
    
    if (service.signatures?.client || service.signatures?.technician) {
        if (currentY > pageHeight - 150) { doc.addPage(); currentY = 60; }
        currentY = addSectionTitle(doc, "Assinaturas", currentY);
        const sigY = currentY;
        const sigWidth = 150;
        const sigHeight = 75;

        if (service.signatures.client) {
            doc.addImage(service.signatures.client, 'PNG', PAGE_MARGIN, sigY, sigWidth, sigHeight);
            doc.line(PAGE_MARGIN, sigY + sigHeight + 5, PAGE_MARGIN + sigWidth, sigY + sigHeight + 5);
            doc.text(service.client || 'Cliente', PAGE_MARGIN + (sigWidth / 2), sigY + sigHeight + 20, { align: 'center' });
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
    logger.info(`Relatório de Design V4 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar Relatório de Design V4: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
