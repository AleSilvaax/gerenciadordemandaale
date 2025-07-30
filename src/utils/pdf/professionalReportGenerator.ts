import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// Paleta revisada
const THEME_COLOR_DARK = [25, 70, 150];
const THEME_COLOR_LIGHT = [80, 130, 210];
const HEADING_COLOR = [35, 45, 55];
const BODY_TEXT_COLOR = [80, 80, 80];
const BORDER_COLOR = [200, 210, 220];
const PAGE_MARGIN = 50;
const LOGO_SIZE = 60;

// Função para limpar texto e evitar erros no PDF
const sanitizeText = (text: string | null | undefined): string => {
  if (!text) return 'N/A';
  return text.replace(/[^\p{L}\p{N}\s.,:;!?@#$%*()_+\-=[\]{}\/\\|"'`~]/gu, '');
};

// Cabeçalho e rodapé para todas páginas
const addPageHeaderAndFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Linha no topo
  doc.setDrawColor(...BORDER_COLOR);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGIN, 40, pageWidth - PAGE_MARGIN, 40);

  // Logo no cabeçalho (troque a imagem pelo seu logo base64)
  // Exemplo fictício: doc.addImage(base64Logo, 'PNG', PAGE_MARGIN, 10, LOGO_SIZE, LOGO_SIZE);

  // Texto header (ex: nome da empresa)
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...HEADING_COLOR);
  doc.text('Gerenciador de Demandas - Relatório', PAGE_MARGIN + LOGO_SIZE + 10, 35);

  // Rodapé com paginação
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BODY_TEXT_COLOR);
  doc.text(`Página ${pageNum} de ${totalPages}`, pageWidth / 2, pageHeight - 20, { align: 'center' });
};

// Título de seção com ícone unicode simples
const addSectionTitle = (doc: jsPDF, title: string, y: number, icon = '▶') => {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...HEADING_COLOR);
  doc.text(`${icon} ${title}`, PAGE_MARGIN, y);

  // Linha decorativa abaixo do título
  doc.setDrawColor(...THEME_COLOR_DARK);
  doc.setLineWidth(1.7);
  doc.line(PAGE_MARGIN, y + 8, PAGE_MARGIN + 50, y + 8);

  return y + 30;
};

const checkPageSpace = (doc: jsPDF, currentY: number, spaceNeeded: number): number => {
  const pageHeight = doc.internal.pageSize.getHeight();
  if (currentY + spaceNeeded > pageHeight - 60) {
    doc.addPage();
    return 70;
  }
  return currentY;
};

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório para: ${service.id}`, 'PDF');
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();

    // === PÁGINA 1 - CAPA MAIS MODERNA E EQUILIBRADA ===
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

    // Retângulo colorido lateral direito
    doc.setFillColor(...THEME_COLOR_LIGHT);
    const rectWidth = 140;
    doc.rect(pageWidth - rectWidth, 0, rectWidth, 250, 'F');

    // Logo fictício na capa - substitua com seu logo base64
    // doc.addImage(base64Logo, 'PNG', pageWidth - rectWidth + 20, 30, 100, 100);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(36);
    doc.setTextColor(...HEADING_COLOR);
    doc.text('Relatório de Serviço', PAGE_MARGIN, 90);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(22);
    const titleLines = doc.splitTextToSize(sanitizeText(service.title), pageWidth - PAGE_MARGIN * 2 - rectWidth);
    doc.text(titleLines, PAGE_MARGIN, 130);

    // Info principal alinhada no retângulo colorido lateral
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    const infoX = pageWidth - rectWidth + 20;
    const baseY = 150;
    const lineHeight = 22;
    doc.text('CLIENTE:', infoX, baseY);
    doc.text('ORDEM DE SERVIÇO:', infoX, baseY + lineHeight);
    doc.text('DATA DE GERAÇÃO:', infoX, baseY + 2 * lineHeight);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(sanitizeText(service.client), infoX, baseY + 15);
    doc.text(sanitizeText(service.number), infoX, baseY + lineHeight + 15);
    doc.text(new Date().toLocaleDateString('pt-BR'), infoX, baseY + 2 * lineHeight + 15);

    // === PÁGINA 2 - SUMÁRIO SIMPLES ===
    doc.addPage();
    let currentY = 70;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    doc.setTextColor(...HEADING_COLOR);
    doc.text('Sumário', PAGE_MARGIN, currentY);
    currentY += 40;

    const summaryItems = [
      'Resumo da Demanda',
      'Checklist Técnico',
      'Registro Fotográfico',
      'Assinaturas',
    ];

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(14);
    summaryItems.forEach((item, i) => {
      doc.text(`${i + 1}. ${item}`, PAGE_MARGIN + 10, currentY);
      currentY += 30;
    });

    // === PÁGINA 3 - RESUMO DA DEMANDA ===
    doc.addPage();
    currentY = 70;
    currentY = addSectionTitle(doc, 'Resumo da Demanda', currentY, '📋');

    // Corpo da tabela resumo
    autoTable(doc, {
      startY: currentY,
      body: [
        ['Cliente', sanitizeText(service.client)],
        ['Local', sanitizeText(service.location)],
        ['Endereço', sanitizeText(service.address)],
        ['Status', sanitizeText(service.status)],
        ['Tipo de Serviço', sanitizeText(service.serviceType)],
        ['Técnico Responsável', service.technician?.name && service.technician.name !== 'Não atribuído'
          ? sanitizeText(service.technician.name) : 'Nenhum técnico atribuído'],
        ['Descrição', sanitizeText(service.description)],
      ],
      theme: 'striped',
      styles: { fontSize: 11, cellPadding: { top: 6, right: 6, bottom: 6, left: 6 } },
      columnStyles: { 0: { fontStyle: 'bold', cellWidth: 130 } }
    });
    currentY = (doc as any).lastAutoTable.finalY + 40;

    // === CHECKLIST TÉCNICO ===
    if (service.customFields && service.customFields.length > 0) {
      currentY = checkPageSpace(doc, currentY, 120);
      currentY = addSectionTitle(doc, 'Checklist Técnico', currentY, '✔');

      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Valor / Status']],
        body: service.customFields.map(f => [
          sanitizeText(f.label),
          typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : sanitizeText(f.value?.toString())
        ]),
        theme: 'grid',
        headStyles: { fillColor: HEADING_COLOR, textColor: 255 },
        styles: { fontSize: 11 }
      });
      currentY = (doc as any).lastAutoTable.finalY + 40;
    }

    // === REGISTRO FOTOGRÁFICO ===
    if (photos && photos.length > 0) {
      currentY = checkPageSpace(doc, currentY, 250);
      currentY = addSectionTitle(doc, 'Registro Fotográfico', currentY, '📸');

      const photoSize = (pageWidth - PAGE_MARGIN * 2 - 40) / 2;
      let x = PAGE_MARGIN;
      let photoCountInRow = 0;

      for (const photo of photos) {
        if (photoCountInRow >= 2) {
          x = PAGE_MARGIN;
          currentY += photoSize + 60;
          photoCountInRow = 0;
        }
        if (currentY + photoSize > doc.internal.pageSize.getHeight() - 60) {
          doc.addPage();
          currentY = 70;
        }
        try {
          doc.addImage(photo.url, 'JPEG', x, currentY, photoSize, photoSize);
          doc.setFontSize(10);
          doc.setTextColor(...BODY_TEXT_COLOR);
          doc.text(sanitizeText(photo.title), x + photoSize / 2, currentY + photoSize + 18, { align: 'center' });
        } catch {
          // log se quiser
        }
        x += photoSize + 40;
        photoCountInRow++;
      }
      currentY += photoSize + 70;
    }

    // === ASSINATURAS ===
    if (service.signatures?.client || service.signatures?.technician) {
      currentY = checkPageSpace(doc, currentY, 160);
      doc.addPage();
      currentY = 70;
      currentY = addSectionTitle(doc, 'Assinaturas', currentY, '✍️');

      const sigWidth = 220;
      const sigHeight = 110;

      if (service.signatures.client) {
        const clientX = PAGE_MARGIN + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
        doc.addImage(service.signatures.client, 'PNG', clientX, currentY, sigWidth, sigHeight);
        doc.line(clientX, currentY + sigHeight + 5, clientX + sigWidth, currentY + sigHeight + 5);
        doc.text(sanitizeText(service.client), clientX + sigWidth / 2, currentY + sigHeight + 25, { align: 'center' });
      }

      if (service.signatures.technician) {
        const techX = (pageWidth / 2) + ((pageWidth / 2) - PAGE_MARGIN - sigWidth) / 2;
        doc.addImage(service.signatures.technician, 'PNG', techX, currentY, sigWidth, sigHeight);
        doc.line(techX, currentY + sigHeight + 5, techX + sigWidth, currentY + sigHeight + 5);
        const techName = service.technician?.name && service.technician.name !== 'Não atribuído'
          ? sanitizeText(service.technician.name)
          : 'Técnico Responsável';
        doc.text(techName, techX + sigWidth / 2, currentY + sigHeight + 25, { align: 'center' });
      }
    }

    // === Aplicar header e footer em todas as páginas ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addPageHeaderAndFooter(doc, i, pageCount);
    }

    // Salvar arquivo com nome limpo
    const safeNumber = (service.number || service.id.substring(0, 6)).replace(/[^a-zA-Z0-9_-]/g, '');
    const fileName = `Relatorio_OS_${safeNumber}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório gerado: ${fileName}`, 'PDF');
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    logger.error(`Erro ao gerar Relatório: ${errorMessage}`, 'PDF');
    throw new Error('Erro ao gerar PDF: ' + errorMessage);
  }
};
