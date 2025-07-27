import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- CONFIGURAÇÕES DE DESIGN AVANÇADO ---
const FONT_VFS_PATH = '/fonts/Montserrat-Regular.ttf';
const FONT_VFS_KEY = 'Montserrat-Regular.ttf';
const FONT_FAMILY = 'Montserrat';
const THEME_COLOR_START = [30, 80, 160]; // azul escuro
const THEME_COLOR_END = [60, 160, 230]; // azul claro
const TEXT_COLOR = [45, 52, 54];
const BORDER_COLOR = [200, 210, 220];
const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 40;

// Interpolates between two RGB colors
const interpolateColor = (start: number[], end: number[], t: number) =>
  start.map((s, i) => Math.round(s + (end[i] - s) * t));

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório Profissional V8 para: ${service.id}`, 'PDF');
    const doc = new jsPDF('p', 'pt', 'a4');
    const { width: W, height: H } = doc.internal.pageSize;

    // --- EMBED FONT ---
    // suposição: carregou via VFS antes em build
    doc.addFont(FONT_VFS_KEY, FONT_FAMILY, 'normal');
    doc.setFont(FONT_FAMILY);

    // --- CAPA GRADIENTE ---
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const [r, g, b] = interpolateColor(THEME_COLOR_START, THEME_COLOR_END, t);
      doc.setFillColor(r, g, b);
      doc.rect(0, (H - H) * t, W, H / steps, 'F');
    }
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(60);
    doc.setFont(undefined, 'bold');
    doc.text('RELATÓRIO DE SERVIÇO', W / 2, H / 3, { align: 'center' });
    doc.setFontSize(36);
    doc.setFont(undefined, 'normal');
    doc.text(service.title, W / 2, H / 2.5, { align: 'center', maxWidth: W - 2 * PAGE_MARGIN });

    // Info white box
    const boxHeight = 100;
    const boxY = H - PAGE_MARGIN - boxHeight;
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(PAGE_MARGIN, boxY, W - 2 * PAGE_MARGIN, boxHeight, 8, 8, 'F');
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
    doc.setFontSize(12);
    doc.text(`Cliente: ${service.client || 'N/A'}`, PAGE_MARGIN + 20, boxY + 30);
    doc.text(`OS: ${service.number || 'N/A'}`, PAGE_MARGIN + 20, boxY + 55);
    doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, PAGE_MARGIN + 20, boxY + 80);

    // --- PÁGINA DE CONTEÚDO ---
    doc.addPage();

    // Header
    doc.setFillColor(...THEME_COLOR_START);
    doc.rect(0, 0, W, HEADER_HEIGHT, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.text('RELATÓRIO DE SERVIÇO', PAGE_MARGIN, HEADER_HEIGHT / 2 + 6);

    let cursorY = HEADER_HEIGHT + PAGE_MARGIN;
    doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);

    // Seção: Resumo da Demanda
    doc.setFontSize(18);
    doc.setFont(undefined, 'bold');
    doc.text('Resumo da Demanda', PAGE_MARGIN, cursorY);
    cursorY += 24;
    doc.setFontSize(11);
    doc.setFont(undefined, 'normal');
    const colWidth = (W - 2 * PAGE_MARGIN) / 2 - 10;
    // Coluna 1
    doc.text(`Cliente: ${service.client || 'N/A'}`, PAGE_MARGIN, cursorY);
    doc.text(`Local: ${service.location || 'N/A'}`, PAGE_MARGIN, cursorY + 16);
    doc.text(`Endereço: ${service.address || 'N/A'}`, PAGE_MARGIN, cursorY + 32, { maxWidth: colWidth });
    // Coluna 2
    const rightX = PAGE_MARGIN + colWidth + 20;
    doc.text(`Status: ${service.status}`, rightX, cursorY);
    doc.text(`Tipo: ${service.serviceType || 'N/A'}`, rightX, cursorY + 16);
    const techs = service.technicians?.map(t => t.name).join(', ') || 'Nenhum';
    doc.text(`Técnico(s): ${techs}`, rightX, cursorY + 32, { maxWidth: colWidth });
    cursorY += 60;

    // Checklist Técnico
    if (service.customFields?.length) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Checklist Técnico', PAGE_MARGIN, cursorY);
      cursorY += 20;
      autoTable(doc, {
        startY: cursorY,
        head: [['Item', 'Status']],
        body: service.customFields.map(f => [f.label, typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : String(f.value)]),
        theme: 'grid',
        headStyles: { fillColor: THEME_COLOR_END, textColor: '#FFF' },
        styles: { fontSize: 10, cellPadding: 6 }
      });
      cursorY = (doc as any).lastAutoTable.finalY + 30;
    }

    // Registro Fotográfico
    if (photos?.length) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Registro Fotográfico', PAGE_MARGIN, cursorY);
      cursorY += 20;
      const photoSize = 120;
      let x = PAGE_MARGIN;
      for (const p of photos) {
        if (x + photoSize > W - PAGE_MARGIN) { x = PAGE_MARGIN; cursorY += photoSize + 30; }
        doc.addImage(p.url, 'JPEG', x, cursorY, photoSize, photoSize);
        doc.setFontSize(8);
        doc.text(p.title || '', x + photoSize / 2, cursorY + photoSize + 10, { align: 'center' });
        x += photoSize + 20;
      }
      cursorY += photoSize + 40;
    }

    // Assinaturas
    if (service.signatures?.client || service.signatures?.technician) {
      doc.setFontSize(16);
      doc.setFont(undefined, 'bold');
      doc.text('Assinaturas', PAGE_MARGIN, cursorY);
      cursorY += 20;
      const sigY = cursorY;
      const sigW = 180;
      const sigH = 80;
      if (service.signatures.client) {
        doc.addImage(service.signatures.client, 'PNG', PAGE_MARGIN, sigY, sigW, sigH);
        doc.text(service.client || 'Cliente', PAGE_MARGIN + sigW / 2, sigY + sigH + 15, { align: 'center' });
      }
      if (service.signatures.technician) {
        doc.addImage(service.signatures.technician, 'PNG', W - PAGE_MARGIN - sigW, sigY, sigW, sigH);
        doc.text(service.technicians?.[0]?.name || 'Técnico', W - PAGE_MARGIN - sigW / 2, sigY + sigH + 15, { align: 'center' });
      }
    }

    // Footer com paginação
    const pages = doc.getNumberOfPages();
    for (let i = 1; i <= pages; i++) {
      doc.setPage(i);
      doc.setDrawColor(...BORDER_COLOR);
      doc.line(PAGE_MARGIN, H - FOOTER_HEIGHT, W - PAGE_MARGIN, H - FOOTER_HEIGHT);
      doc.setFontSize(8);
      doc.setTextColor(TEXT_COLOR[0], TEXT_COLOR[1], TEXT_COLOR[2]);
      doc.text(`Página ${i} de ${pages}`, W / 2, H - FOOTER_HEIGHT / 2, { align: 'center' });
    }

    // Salva
    const fileName = `Relatorio_OS_${service.number || service.id.slice(0,6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`, 'PDF');
    throw new Error('Falha ao gerar PDF: ' + (error instanceof Error ? error.message : 'Desconhecido'));
  }
};
