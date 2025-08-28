import jsPDF from 'jspdf';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { modernSectionTitle, drawModernHeader, drawModernFooter, infoPanel, smartPageBreak, modernCover, defaultTableTheme } from './modernPdfLayout';

/**
 * Revo Corporate Design System for PDFs
 * 
 * Color Rules:
 * - Black/White as base colors
 * - Dark gray (#262426) for backgrounds and subtle borders  
 * - Revo Yellow (#F4FF00) for highlights only - max 20% usage
 */

/**
 * Revo-specific critical info box (yellow background, black text)
 */
export const revoCriticalInfoBox = (
  doc: jsPDF, 
  y: number, 
  title: string, 
  content: string[]
): number => {
  let currentY = y;
  
  // Calculate box height based on content
  const contentHeight = content.length * 8 + 20;
  
  // Yellow background for critical info
  doc.setFillColor(...PDF_COLORS.revoYellow);
  doc.rect(PDF_DIMENSIONS.margin, currentY, 170, contentHeight, 'F');
  
  // Title in black
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.normal, 'bold');
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(title.toUpperCase(), PDF_DIMENSIONS.margin + 5, currentY + 8);
  
  currentY += 15;
  
  // Content in black
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, 'normal');
  content.forEach(line => {
    const wrappedText = doc.splitTextToSize(line, 160);
    doc.text(wrappedText, PDF_DIMENSIONS.margin + 5, currentY);
    currentY += 8;
  });
  
  return currentY + 5;
};

/**
 * Revo feedback section with black background
 */
export const revoFeedbackBox = (
  doc: jsPDF,
  y: number,
  feedback: string,
  rating?: number
): number => {
  let currentY = y;
  
  // Calculate height
  const feedbackLines = doc.splitTextToSize(feedback, 160);
  const boxHeight = feedbackLines.length * 5 + 20;
  
  // Black background
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(PDF_DIMENSIONS.margin, currentY, 170, boxHeight, 'F');
  
  // Yellow quote icon (simple decoration)
  doc.setFillColor(...PDF_COLORS.revoYellow);
  doc.rect(PDF_DIMENSIONS.margin + 5, currentY + 5, 3, 8, 'F');
  doc.rect(PDF_DIMENSIONS.margin + 10, currentY + 5, 3, 8, 'F');
  
  // White text for feedback
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, 'normal');
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(feedbackLines, PDF_DIMENSIONS.margin + 20, currentY + 12);
  
  // Rating if available
  if (rating) {
    currentY += feedbackLines.length * 5 + 5;
    doc.setTextColor(...PDF_COLORS.revoYellow);
    doc.text(`Avaliação: ${rating}/5`, PDF_DIMENSIONS.margin + 5, currentY);
  }
  
  return currentY + boxHeight - feedbackLines.length * 5 + 10;
};

/**
 * Revo signature section with proper styling
 */
export const revoSignatureSection = (
  doc: jsPDF,
  y: number,
  signatures: { client?: string; technician?: string }
): number => {
  let currentY = y;
  
  // Section title
  currentY = modernSectionTitle(doc, 'ASSINATURAS', currentY);
  currentY += 10;
  
  const signatureBoxHeight = 35;
  
  if (signatures.client) {
    // Client signature
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 80, signatureBoxHeight, 'F');
    doc.setDrawColor(...PDF_COLORS.darkGray);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 80, signatureBoxHeight, 'S');
    
    doc.setFontSize(9);
    doc.setFont(PDF_FONTS.normal, 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('CLIENTE:', PDF_DIMENSIONS.margin + 2, currentY + 6);
    
    // Yellow highlight for name
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.rect(PDF_DIMENSIONS.margin + 2, currentY + 25, 76, 8, 'F');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('Assinatura Digital', PDF_DIMENSIONS.margin + 4, currentY + 30);
  }
  
  if (signatures.technician) {
    // Technician signature  
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(PDF_DIMENSIONS.margin + 90, currentY, 80, signatureBoxHeight, 'F');
    doc.setDrawColor(...PDF_COLORS.darkGray);
    doc.rect(PDF_DIMENSIONS.margin + 90, currentY, 80, signatureBoxHeight, 'S');
    
    doc.setFontSize(9);
    doc.setFont(PDF_FONTS.normal, 'bold');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('TÉCNICO:', PDF_DIMENSIONS.margin + 92, currentY + 6);
    
    // Yellow highlight for name
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.rect(PDF_DIMENSIONS.margin + 92, currentY + 25, 76, 8, 'F');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('Assinatura Digital', PDF_DIMENSIONS.margin + 94, currentY + 30);
  }
  
  return currentY + signatureBoxHeight + 10;
};

/**
 * Revo photo grid with proper styling
 */
export const revoPhotoGrid = (
  doc: jsPDF,
  y: number,
  photos: Array<{ url: string; title?: string }>
): number => {
  let currentY = y;
  
  // Section title
  currentY = modernSectionTitle(doc, 'ANEXOS FOTOGRÁFICOS', currentY);
  currentY += 10;
  
  const photosPerRow = 2;
  const photoWidth = 70;
  const photoHeight = 50;
  const spacing = 10;
  
  for (let i = 0; i < photos.length; i += photosPerRow) {
    for (let j = 0; j < photosPerRow && (i + j) < photos.length; j++) {
      const photo = photos[i + j];
      const x = PDF_DIMENSIONS.margin + j * (photoWidth + spacing);
      
      // Photo border (dark gray)
      doc.setDrawColor(...PDF_COLORS.darkGray);
      doc.setLineWidth(1);
      doc.rect(x, currentY, photoWidth, photoHeight, 'S');
      
      // Try to add image or placeholder
      try {
        doc.addImage(photo.url, 'JPEG', x + 1, currentY + 1, photoWidth - 2, photoHeight - 2);
      } catch (e) {
        // Placeholder
        doc.setFillColor(...PDF_COLORS.lightGray);
        doc.rect(x + 1, currentY + 1, photoWidth - 2, photoHeight - 2, 'F');
        doc.setTextColor(...PDF_COLORS.darkGray);
        doc.setFontSize(8);
        doc.text('Foto não', x + photoWidth/2, currentY + photoHeight/2 - 2, { align: 'center' });
        doc.text('disponível', x + photoWidth/2, currentY + photoHeight/2 + 2, { align: 'center' });
      }
      
      // Caption with black background
      if (photo.title) {
        doc.setFillColor(...PDF_COLORS.black);
        doc.rect(x, currentY + photoHeight, photoWidth, 8, 'F');
        doc.setTextColor(...PDF_COLORS.white);
        doc.setFontSize(7);
        const truncatedTitle = photo.title.length > 25 ? photo.title.substring(0, 22) + '...' : photo.title;
        doc.text(truncatedTitle, x + 2, currentY + photoHeight + 5);
      }
    }
    currentY += photoHeight + (photos[i]?.title ? 8 : 0) + spacing;
  }
  
  return currentY + 5;
};