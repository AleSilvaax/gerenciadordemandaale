import { jsPDF } from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { Service, Photo, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// reaproveito constantes originais
const { THEME_COLOR_DARK, THEME_COLOR_LIGHT, HEADING_COLOR, BODY_TEXT_COLOR, BORDER_COLOR, PAGE_MARGIN } = {
  THEME_COLOR_DARK: [30, 80, 160],
  THEME_COLOR_LIGHT: [75, 125, 200],
  HEADING_COLOR: [45, 52, 54],
  BODY_TEXT_COLOR: [99, 110, 114],
  BORDER_COLOR: [223, 230, 233],
  PAGE_MARGIN: 50
};

async function generateBeautifulServiceReport(
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> {
  logger.info(`Gerando Relatório Bonito para: ${service.id}`, 'PDF');
  const doc = new jsPDF('p', 'pt', 'a4');
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();

  // 1) Capa
  doc.setFillColor(...THEME_COLOR_LIGHT);
  doc.rect(0, 0, pw, ph, 'F');
  // supondo que você tenha o logo em base64 em user.logoBase64
  if (user.logoBase64) {
    doc.addImage(user.logoBase64, 'PNG', pw / 2 - 50, 80, 100, 100, undefined, 'FAST');
  }
  doc.setFontSize(32);
  doc.setTextColor(...THEME_COLOR_DARK);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de Serviço', pw / 2, ph / 2, { align: 'center' });
  doc.addPage();

  // 2) Marca d’água em todas as páginas
  const watermark = async () => {
    doc.setGState(new (doc as any).GState({ opacity: 0.05 }));
    if (user.logoBase64) {
      doc.addImage(user.logoBase64, 'PNG', pw / 2 - 150, ph / 2 - 150, 300, 300);
    }
    doc.setGState(new (doc as any).GState({ opacity: 1 }));
  };

  // 3) Conteúdo principal
  await watermark();
  let cursorY = 70;

  // Função para criar bloco de título com retângulo colorido atrás
  const addSection = (title: string) => {
    doc.setFillColor(...THEME_COLOR_LIGHT);
    doc.rect(PAGE_MARGIN, cursorY - 5, pw - PAGE_MARGIN * 2, 30, 'F');
    doc.setFontSize(16);
    doc.setTextColor(...HEADING_COLOR);
    doc.setFont('helvetica', 'bold');
    doc.text(title, PAGE_MARGIN + 10, cursorY + 15);
    cursorY += 50;
  };

  // Exemplo de seção
  addSection('Dados do Serviço');
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...BODY_TEXT_COLOR);
  doc.text(`ID: ${service.id}`, PAGE_MARGIN, cursorY);
  doc.text(`Cliente: ${service.clientName}`, PAGE_MARGIN, cursorY + 20);
  cursorY += 50;

  // 4) Tabela de custom fields
  addSection('Campos Personalizados');
  const tableOptions: UserOptions = {
    startY: cursorY,
    margin: { left: PAGE_MARGIN, right: PAGE_MARGIN },
    styles: {
      cellPadding: 8,
      fontSize: 11,
      textColor: BODY_TEXT_COLOR,
      lineColor: BORDER_COLOR,
      lineWidth: 0.5,
    },
    headStyles: {
      fillColor: THEME_COLOR_DARK,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    alternateRowStyles: { fillColor: [245, 245, 245] }
  };
  autoTable(doc, {
    ...tableOptions,
    head: [['Chave', 'Valor']],
    body: service.customFields.map((cf) => [
      cf.name,
      cf.value || 'N/A'
    ])
  });
  cursorY = (doc as any).lastAutoTable.finalY + 30;

  // 5) Fotos (exemplo simplificado)
  addSection('Fotos');
  photos.forEach((p, idx) => {
    if (idx > 0 && idx % 3 === 0) {
      doc.addPage();
      watermark();
      cursorY = 70;
    }
    const imgSize = 100;
    doc.addImage(p.base64, 'JPEG', PAGE_MARGIN + (idx % 3) * (imgSize + 10), cursorY, imgSize, imgSize);
  });

  // 6) Cabeçalho e rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    // Cabeçalho
    doc.setDrawColor(...BORDER_COLOR);
    doc.line(PAGE_MARGIN, 50, pw - PAGE_MARGIN, 50);
    doc.setFontSize(10);
    doc.text(user.companyName, PAGE_MARGIN, 40);
    // Rodapé
    doc.setDrawColor(...BORDER_COLOR);
    doc.line(PAGE_MARGIN, ph - 40, pw - PAGE_MARGIN, ph - 40);
    doc.setFontSize(8);
    doc.text(`Página ${i}/${pageCount}`, pw - PAGE_MARGIN, ph - 25, { align: 'right' });
    doc.text(`Contatos: ${user.email} | ${user.phone}`, PAGE_MARGIN, ph - 25);
  }

  // Geração final
  doc.save(`Relatorio_Servico_${service.id}.pdf`);
}

export { generateBeautifulServiceReport };
