import jsPDF from 'jspdf';
import { UserOptions } from 'jspdf-autotable';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';

// Enhanced table themes with the new color palette
export type TablePalette = 'primary' | 'accent' | 'secondary' | 'success' | 'warning';

export const defaultTableTheme = (palette: TablePalette = 'primary'): Partial<UserOptions> => {
  let headFill: number[];
  
  switch (palette) {
    case 'accent':
      headFill = [...PDF_COLORS.accent];
      break;
    case 'secondary':
      headFill = [...PDF_COLORS.secondary];
      break;
    case 'success':
      headFill = [...PDF_COLORS.success];
      break;
    case 'warning':
      headFill = [...PDF_COLORS.warning];
      break;
    default:
      headFill = [...PDF_COLORS.primary];
  }

  return {
    theme: 'grid',
    styles: {
      fontSize: 10,
      textColor: PDF_COLORS.text as unknown as [number, number, number],
      cellPadding: 4,
      lineColor: PDF_COLORS.border as unknown as [number, number, number],
      lineWidth: 0.3,
    },
    headStyles: {
      fillColor: headFill as unknown as [number, number, number],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 5,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: PDF_COLORS.text as unknown as [number, number, number],
      cellPadding: 4,
    },
    alternateRowStyles: {
      fillColor: PDF_COLORS.lightGray as unknown as [number, number, number],
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin },
  } as Partial<UserOptions>;
};

// Revo Corporate Header
export const drawModernHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const page = doc.getCurrentPageInfo().pageNumber;
  if (page === 1) return; // Skip cover page
  
  // Black header bar
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 15, 'F');
  
  // Logo Revo space (left corner)
  try {
    // Try to add Revo logo
    doc.addImage('/assets/logo-revo-amarela.png', 'PNG', PDF_DIMENSIONS.margin, 3, 8, 8);
  } catch (e) {
    // Fallback: Yellow circle for logo
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.circle(PDF_DIMENSIONS.margin + 4, 7, 3, 'F');
  }
  
  // Section title in center
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(title.toUpperCase(), PDF_DIMENSIONS.pageWidth / 2, 9, { align: 'center' });
};

// Revo Corporate Footer
export const drawModernFooter = (doc: jsPDF, pageOffset: number = 1) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    if (i <= pageOffset) continue; // Skip cover pages
    doc.setPage(i);
    
    // Dark gray footer bar
    doc.setFillColor(...PDF_COLORS.darkGray);
    doc.rect(0, 287, PDF_DIMENSIONS.pageWidth, 10, 'F');
    
    // Footer content
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.white);
    
    // Page number on right
    doc.text(`${i - pageOffset}`, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 293, { align: 'right' });
  }
};

// Revo Corporate Section Title
export const modernSectionTitle = (doc: jsPDF, text: string, y: number): number => {
  // Black background for title
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(PDF_DIMENSIONS.margin, y - 5, 170, 12, 'F');
  
  // White text in uppercase
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(text.toUpperCase(), PDF_DIMENSIONS.margin + 5, y + 2);
  
  return y + 12;
};

// Smart page break with header consideration
export const smartPageBreak = (doc: jsPDF, currentY: number, requiredHeight: number): number => {
  if (currentY + requiredHeight > PDF_DIMENSIONS.pageHeight - 25) {
    doc.addPage();
    return 35; // Space for header
  }
  return currentY;
};

// Revo Corporate Info Panel
export const infoPanel = (doc: jsPDF, y: number, data: Array<[string, string]>, title?: string): number => {
  let currentY = y;
  
  if (title) {
    currentY = modernSectionTitle(doc, title, currentY);
    currentY += 5;
  }
  
  // White panel background with dark border
  doc.setFillColor(...PDF_COLORS.white);
  const panelHeight = (data.length * 10) + 8;
  doc.rect(PDF_DIMENSIONS.margin, currentY, 170, panelHeight, 'F');
  
  // Dark gray border
  doc.setDrawColor(...PDF_COLORS.darkGray);
  doc.setLineWidth(0.5);
  doc.rect(PDF_DIMENSIONS.margin, currentY, 170, panelHeight, 'S');
  
  currentY += 6;
  
  // Data rows
  data.forEach(([label, value]) => {
    doc.setFontSize(9);
    doc.setFont(PDF_FONTS.normal, 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(`${label}`, PDF_DIMENSIONS.margin + 3, currentY);
    
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    const wrappedValue = doc.splitTextToSize(value, 100);
    doc.text(wrappedValue, PDF_DIMENSIONS.margin + 60, currentY);
    currentY += 10;
  });
  
  return currentY + 3;
};

// Revo Corporate Cover Generator
export const modernCover = (doc: jsPDF, title: string, subtitle?: string, additionalInfo?: string[]) => {
  // Black solid background
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.pageHeight, 'F');
  
  // Logo Revo amarela centralizada
  try {
    doc.addImage('/assets/logo-revo-amarela.png', 'PNG', 
                 (PDF_DIMENSIONS.pageWidth - 40) / 2, 60, 40, 40);
  } catch (e) {
    // Fallback: Yellow circle
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.circle(PDF_DIMENSIONS.pageWidth / 2, 80, 20, 'F');
  }
  
  // Título principal em branco
  doc.setFontSize(24);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.white);
  doc.text('RELATÓRIO TÉCNICO', PDF_DIMENSIONS.pageWidth / 2, 130, { align: 'center' });
  
  // Subtítulo em cinza escuro
  if (subtitle) {
    doc.setFontSize(14);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.darkGray);
    doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 145, { align: 'center' });
  }
  
  // Raio Revo como detalhe gráfico sutil
  try {
    doc.addImage('/assets/raio-revo-amarelo.png', 'PNG', 20, 200, 15, 15);
    doc.addImage('/assets/raio-revo-amarelo.png', 'PNG', 175, 50, 10, 10);
  } catch (e) {
    // Fallback: Small yellow accents
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.circle(25, 210, 3, 'F');
    doc.circle(180, 55, 2, 'F');
  }
  
  // Additional info if provided
  if (additionalInfo && additionalInfo.length > 0) {
    let infoY = 180;
    additionalInfo.forEach(info => {
      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.darkGray);
      doc.text(info, PDF_DIMENSIONS.pageWidth / 2, infoY, { align: 'center' });
      infoY += 12;
    });
  }
  
  // Footer date
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 
           PDF_DIMENSIONS.pageWidth / 2, 270, { align: 'center' });
};