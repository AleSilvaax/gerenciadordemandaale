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

// Modern page header with gradient effect
export const drawModernHeader = (doc: jsPDF, title: string, subtitle?: string) => {
  const page = doc.getCurrentPageInfo().pageNumber;
  if (page === 1) return; // Skip cover page
  
  // Main header bar
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 18, 'F');
  
  // Accent stripe
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 15, PDF_DIMENSIONS.pageWidth, 3, 'F');
  
  // Title
  doc.setFontSize(11);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.margin, 12);
  
  // Subtitle if provided
  if (subtitle) {
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.text(subtitle, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin - 40, 12, { align: 'right' });
  }
};

// Enhanced footer with page numbers and branding
export const drawModernFooter = (doc: jsPDF, pageOffset: number = 1) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    if (i <= pageOffset) continue; // Skip cover pages
    doc.setPage(i);
    
    // Footer line
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.5);
    doc.line(PDF_DIMENSIONS.margin, 282, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 282);
    
    // Footer content
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.textLight);
    
    // Date on left
    doc.text(new Date().toLocaleDateString('pt-BR'), PDF_DIMENSIONS.margin, 290);
    
    // Page number in center
    doc.text(`Página ${i - pageOffset} de ${pageCount - pageOffset}`, 
             PDF_DIMENSIONS.pageWidth / 2, 290, { align: 'center' });
    
    // Brand on right
    doc.text('ServiceFlow Report', PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 290, { align: 'right' });
  }
};

// Section title with accent underline
export const modernSectionTitle = (doc: jsPDF, text: string, y: number): number => {
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.primary);
  doc.text(text, PDF_DIMENSIONS.margin, y);
  
  // Accent underline
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(2);
  doc.line(PDF_DIMENSIONS.margin, y + 2, PDF_DIMENSIONS.margin + 60, y + 2);
  
  return y + 8;
};

// Smart page break with header consideration
export const smartPageBreak = (doc: jsPDF, currentY: number, requiredHeight: number): number => {
  if (currentY + requiredHeight > PDF_DIMENSIONS.pageHeight - 25) {
    doc.addPage();
    return 35; // Space for header
  }
  return currentY;
};

// Modern info panel for key-value pairs
export const infoPanel = (doc: jsPDF, y: number, data: Array<[string, string]>, title?: string): number => {
  let currentY = y;
  
  if (title) {
    currentY = modernSectionTitle(doc, title, currentY);
    currentY += 5;
  }
  
  // Panel background
  doc.setFillColor(...PDF_COLORS.lightGray);
  const panelHeight = (data.length * 12) + 10;
  doc.roundedRect(PDF_DIMENSIONS.margin, currentY, 170, panelHeight, 3, 3, 'F');
  
  // Panel border
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.3);
  doc.roundedRect(PDF_DIMENSIONS.margin, currentY, 170, panelHeight, 3, 3, 'S');
  
  currentY += 8;
  
  // Data rows
  data.forEach(([label, value]) => {
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(label, PDF_DIMENSIONS.margin + 5, currentY);
    
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.text);
    const wrappedValue = doc.splitTextToSize(value, 100);
    doc.text(wrappedValue, PDF_DIMENSIONS.margin + 70, currentY);
    currentY += 12;
  });
  
  return currentY + 5;
};

// Enhanced cover generator
export const modernCover = (doc: jsPDF, title: string, subtitle?: string, additionalInfo?: string[]) => {
  // Modern gradient background
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 120, 'F');
  
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(0, 100, PDF_DIMENSIONS.pageWidth, 20, 'F');
  
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 115, PDF_DIMENSIONS.pageWidth, 8, 'F');
  
  // Decorative elements
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.circle(180, 25, 15, 'F');
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(170, 35, 30, 3, 'F');
  
  // Title
  doc.setFontSize(28);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(title, PDF_DIMENSIONS.pageWidth / 2, 50, { align: 'center' });
  
  if (subtitle) {
    doc.setFontSize(14);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 70, { align: 'center' });
  }
  
  // Additional info if provided
  if (additionalInfo && additionalInfo.length > 0) {
    let infoY = 200;
    additionalInfo.forEach(info => {
      doc.setFontSize(10);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.text(info, PDF_DIMENSIONS.pageWidth / 2, infoY, { align: 'center' });
      infoY += 15;
    });
  }
  
  // Footer
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textLight);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 
           PDF_DIMENSIONS.pageWidth / 2, 280, { align: 'center' });
};