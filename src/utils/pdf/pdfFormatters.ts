
import { jsPDF } from "jspdf";
import { PDF_COLORS, PDF_DIMENSIONS } from './pdfConstants';
import { safeText } from './textUtils';

export const addHeader = (doc: jsPDF, title: string, y: number): number => {
  // Fundo do cabeçalho
  doc.setFillColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.rect(0, y, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.headerHeight, 'F');
  
  // Título
  doc.setTextColor(PDF_COLORS.white[0], PDF_COLORS.white[1], PDF_COLORS.white[2]);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(title), 105, y + 12, { align: "center" });
  
  return y + 30;
};

export const addSection = (doc: jsPDF, title: string, y: number): number => {
  doc.setFillColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
  doc.rect(15, y, 180, PDF_DIMENSIONS.sectionHeight, 'F');
  
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(title), 20, y + 8);
  
  return y + 20;
};

export const addInfoLine = (doc: jsPDF, label: string, value: string, y: number): number => {
  const x = 20; // Default x position
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
  doc.text(safeText(label), x, y);
  
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  const maxWidth = 80;
  const lines = doc.splitTextToSize(safeText(value), maxWidth);
  doc.text(lines, x + 35, y);
  
  return y + (lines.length * 5) + 5; // Return updated y position
};

export const addPageNumbers = (doc: jsPDF): void => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha no rodapé
    doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
    doc.setLineWidth(0.3);
    doc.line(20, 285, 190, 285);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
    doc.text(safeText("Gerado em: " + new Date().toLocaleDateString()), 20, 290);
    doc.text(`Pagina ${i} de ${pageCount}`, 170, 290);
  }
};
