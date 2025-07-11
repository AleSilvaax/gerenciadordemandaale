
import { jsPDF } from 'jspdf';

// Função para sanitizar texto
export const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text.toString()
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[\u00A0\u2000-\u200B\u2028-\u2029\u202F\u205F\u3000]/g, ' ')
    .replace(/[^\x20-\x7E\u00C0-\u017F]/g, '')
    .trim();
};

// Função para quebrar texto
export const wrapText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text) return [''];
  const sanitized = sanitizeText(text);
  return doc.splitTextToSize(sanitized, maxWidth);
};

// Função para adicionar texto com controle de posição
export const addText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): number => {
  const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth = 170, align = 'left' } = options;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = wrapText(doc, text, maxWidth);
  const lineHeight = fontSize * 0.35;

  lines.forEach((line, index) => {
    const lineY = y + (index * lineHeight);
    
    if (align === 'center') {
      doc.text(line, x + (maxWidth / 2), lineY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(line, x + maxWidth, lineY, { align: 'right' });
    } else {
      doc.text(line, x, lineY);
    }
  });

  return y + (lines.length * lineHeight) + 5;
};

// Função para verificar se precisa de nova página
export const checkPageBreak = (doc: jsPDF, currentY: number, requiredHeight: number = 30): number => {
  if (currentY + requiredHeight > 265) {
    doc.addPage();
    return 30;
  }
  return currentY;
};
