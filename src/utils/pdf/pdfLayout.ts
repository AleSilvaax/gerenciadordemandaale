import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';

// Central table theme helpers
export type TablePalette = 'primary' | 'accent' | 'secondary';

export const defaultTableTheme = (palette: TablePalette = 'primary'): Partial<UserOptions> => {
  const headFill =
    palette === 'accent' ? PDF_COLORS.accent : palette === 'secondary' ? PDF_COLORS.secondary : PDF_COLORS.primary;
  return {
    theme: 'grid',
    styles: { fontSize: 10, textColor: PDF_COLORS.text as unknown as [number, number, number] },
    headStyles: { fillColor: headFill as unknown as [number, number, number], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { fontSize: 9, textColor: PDF_COLORS.text as unknown as [number, number, number] },
    alternateRowStyles: { fillColor: PDF_COLORS.lightGray as unknown as [number, number, number] },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin },
  } as Partial<UserOptions>;
};

// Page chrome: header/footer (skip page 1 if it is a cover)
export const drawHeader = (doc: jsPDF, title: string) => {
  const page = doc.getCurrentPageInfo().pageNumber;
  if (page === 1) return; // assume cover
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 15, 'F');
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.margin, 10);
};

export const drawFooter = (doc: jsPDF, pageOffset: number = 1) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    if (i <= pageOffset) continue; // skip cover
    doc.setPage(i);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(PDF_DIMENSIONS.margin, 280, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 280);
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(new Date().toLocaleDateString('pt-BR'), PDF_DIMENSIONS.margin, 290);
    doc.text(`Página ${i - pageOffset} de ${pageCount - pageOffset}`, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin - 30, 290);
  }
};

// Section title helper
export const sectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(text, PDF_DIMENSIONS.margin, y);
  return y + 6;
};

// Ensure we have space for a block, else add a page
export const ensurePageBreak = (doc: jsPDF, currentY: number, requiredHeight: number): number => {
  if (currentY + requiredHeight > PDF_DIMENSIONS.pageHeight - PDF_DIMENSIONS.margin) {
    doc.addPage();
    return 30; // safe top margin after header
  }
  return currentY;
};

// Simple cover generator
export const drawCover = (doc: jsPDF, title: string, subtitle?: string) => {
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 100, 'F');
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 95, PDF_DIMENSIONS.pageWidth, 10, 'F');
  doc.setFontSize(24);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.pageWidth / 2, 50, { align: 'center' });
  if (subtitle) {
    doc.setFontSize(12);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 70, { align: 'center' });
  }
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, PDF_DIMENSIONS.pageWidth / 2, 270, { align: 'center' });
};
