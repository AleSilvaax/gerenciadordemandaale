import jsPDF from 'jspdf';
import { UserOptions } from 'jspdf-autotable';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { processImage } from './imageProcessor';

/**
 * Revo Corporate PDF Layout System
 * Paleta: Preto #000000, Branco #FFFFFF, Cinza escuro #262426, Amarelo Revo #F4FF00
 * Regra: amarelo usado apenas como destaque (máximo 20% do layout)
 */

// Apply dark gray background to all pages
export const applyDarkBackground = (doc: jsPDF, pageNumber?: number) => {
  const currentPage = pageNumber || doc.getCurrentPageInfo().pageNumber;
  doc.setPage(currentPage);
  doc.setFillColor(...PDF_COLORS.darkGray);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.pageHeight, 'F');
};

// Revo cover page with black background and yellow logo
export const drawRevoCover = async (doc: jsPDF, title: string, subtitle?: string, serviceNumber?: string) => {
  // Fundo preto sólido
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.pageHeight, 'F');

  // Logo Revo amarela centralizada
  try {
    const logo = await processImage('/assets/logo-revo-amarela.png');
    if (logo) {
      doc.addImage(logo, 'PNG', PDF_DIMENSIONS.pageWidth / 2 - 30, 60, 60, 30);
    } else {
      // Fallback: retângulo amarelo com texto "REVO"
      doc.setFillColor(...PDF_COLORS.revoYellow);
      doc.roundedRect(PDF_DIMENSIONS.pageWidth / 2 - 30, 60, 60, 30, 5, 5, 'F');
      doc.setFontSize(24);
      doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
      doc.setTextColor(...PDF_COLORS.black);
      doc.text('REVO', PDF_DIMENSIONS.pageWidth / 2, 80, { align: 'center' });
    }
  } catch (e) {
    // Fallback em caso de erro
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.roundedRect(PDF_DIMENSIONS.pageWidth / 2 - 30, 60, 60, 30, 5, 5, 'F');
    doc.setFontSize(24);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('REVO', PDF_DIMENSIONS.pageWidth / 2, 80, { align: 'center' });
  }

  // Título principal em branco (caixa alta)
  doc.setFontSize(32);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(title.toUpperCase(), PDF_DIMENSIONS.pageWidth / 2, 130, { align: 'center' });

  // Subtítulo em cinza escuro
  if (subtitle) {
    doc.setFontSize(16);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(150, 150, 150);
    doc.text(subtitle, PDF_DIMENSIONS.pageWidth / 2, 150, { align: 'center' });
  }

  // Badge da OS em amarelo
  if (serviceNumber) {
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.roundedRect(PDF_DIMENSIONS.pageWidth / 2 - 40, 170, 80, 16, 8, 8, 'F');
    doc.setFontSize(14);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(`OS #${serviceNumber}`, PDF_DIMENSIONS.pageWidth / 2, 182, { align: 'center' });
  }

  // Raio Revo como marca d'água sutil
  try {
    const lightning = await processImage('/assets/raio-revo-preto.png');
    if (lightning) {
      doc.setGState(doc.GState({ opacity: 0.1 }));
      doc.addImage(lightning, 'PNG', PDF_DIMENSIONS.pageWidth - 60, PDF_DIMENSIONS.pageHeight - 80, 40, 60);
      doc.setGState(doc.GState({ opacity: 1 }));
    }
  } catch (e) {
    // Silently fail for watermark
  }

  // Data de geração
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 
           PDF_DIMENSIONS.pageWidth / 2, PDF_DIMENSIONS.pageHeight - 20, { align: 'center' });
};

// Cabeçalho Revo: faixa preta fina, logo amarela à esquerda, título da seção ao centro
export const drawRevoHeader = async (doc: jsPDF, sectionTitle: string) => {
  const pageNumber = doc.getCurrentPageInfo().pageNumber;
  if (pageNumber === 1) return; // Pular capa

  // Faixa preta fina
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 15, 'F');

  // Logo Revo amarela pequena no canto esquerdo
  try {
    const logo = await processImage('/assets/logo-revo-amarela.png');
    if (logo) {
      doc.addImage(logo, 'PNG', 5, 2, 20, 11);
    } else {
      // Fallback: texto "REVO" em amarelo
      doc.setFontSize(8);
      doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
      doc.setTextColor(...PDF_COLORS.revoYellow);
      doc.text('REVO', 8, 10);
    }
  } catch (e) {
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.revoYellow);
    doc.text('REVO', 8, 10);
  }

  // Título da seção centralizado em branco
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(sectionTitle, PDF_DIMENSIONS.pageWidth / 2, 10, { align: 'center' });
};

// Rodapé Revo: faixa cinza escuro com numeração em branco à direita
export const drawRevoFooter = (doc: jsPDF, pageOffset: number = 1) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    if (i <= pageOffset) continue; // Pular capa
    doc.setPage(i);
    
    // Faixa cinza escuro
    doc.setFillColor(...PDF_COLORS.darkGray);
    doc.rect(0, PDF_DIMENSIONS.pageHeight - 12, PDF_DIMENSIONS.pageWidth, 12, 'F');
    
    // Numeração em branco no canto direito
    doc.setFontSize(9);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.white);
    doc.text(`${i - pageOffset}`, PDF_DIMENSIONS.pageWidth - 15, PDF_DIMENSIONS.pageHeight - 4);
  }
};

// Título de seção: faixa preta, texto branco em caixa alta
export const revoSectionTitle = (doc: jsPDF, text: string, y: number): number => {
  // Faixa preta
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(PDF_DIMENSIONS.margin - 5, y - 8, 180, 12, 'F');
  
  // Texto em branco, caixa alta
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text(text.toUpperCase(), PDF_DIMENSIONS.margin, y);
  
  return y + 15;
};

// Subtítulo: texto cinza claro com linha divisória amarela abaixo
export const revoSubTitle = (doc: jsPDF, text: string, y: number): number => {
  // Texto em cinza claro
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(180, 180, 180);
  doc.text(text, PDF_DIMENSIONS.margin, y);
  
  // Linha divisória amarela
  doc.setDrawColor(...PDF_COLORS.revoYellow);
  doc.setLineWidth(1);
  doc.line(PDF_DIMENSIONS.margin, y + 2, PDF_DIMENSIONS.margin + 60, y + 2);
  
  return y + 10;
};

// Box de informações com variantes
export const revoInfoBox = (doc: jsPDF, y: number, data: Array<[string, string]>, variant: 'critical' | 'dark' | 'light' = 'light'): number => {
  const boxHeight = data.length * 8 + 12;
  
  switch (variant) {
    case 'critical':
      // Box amarelo com texto preto (informações críticas)
      doc.setFillColor(...PDF_COLORS.revoYellow);
      doc.roundedRect(PDF_DIMENSIONS.margin, y, 170, boxHeight, 3, 3, 'F');
      
      data.forEach(([label, value], idx) => {
        const lineY = y + 8 + (idx * 8);
        doc.setFontSize(9);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
        doc.setTextColor(...PDF_COLORS.black);
        doc.text(`${label}`, PDF_DIMENSIONS.margin + 5, lineY);
        
        doc.setFont(PDF_FONTS.normal, 'normal');
        doc.text(value, PDF_DIMENSIONS.margin + 70, lineY);
      });
      break;
      
    case 'dark':
      // Box preto com texto branco
      doc.setFillColor(...PDF_COLORS.black);
      doc.roundedRect(PDF_DIMENSIONS.margin, y, 170, boxHeight, 3, 3, 'F');
      
      data.forEach(([label, value], idx) => {
        const lineY = y + 8 + (idx * 8);
        doc.setFontSize(9);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
        doc.setTextColor(...PDF_COLORS.revoYellow);
        doc.text(`${label}`, PDF_DIMENSIONS.margin + 5, lineY);
        
        doc.setFont(PDF_FONTS.normal, 'normal');
        doc.setTextColor(...PDF_COLORS.white);
        doc.text(value, PDF_DIMENSIONS.margin + 70, lineY);
      });
      break;
      
    default:
      // Box transparente com texto branco (sobre fundo cinza escuro)
      doc.setDrawColor(...PDF_COLORS.lightGray);
      doc.setLineWidth(0.5);
      doc.roundedRect(PDF_DIMENSIONS.margin, y, 170, boxHeight, 3, 3, 'S');
      
      data.forEach(([label, value], idx) => {
        const lineY = y + 8 + (idx * 8);
        doc.setFontSize(9);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
        doc.setTextColor(...PDF_COLORS.revoYellow);
        doc.text(`${label}`, PDF_DIMENSIONS.margin + 5, lineY);
        
        doc.setFont(PDF_FONTS.normal, 'normal');
        doc.setTextColor(...PDF_COLORS.white);
        doc.text(value, PDF_DIMENSIONS.margin + 70, lineY);
      });
  }
  
  return y + boxHeight + 10;
};

// Tema de tabela Revo
export const revoTableTheme = (): Partial<UserOptions> => {
  return {
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: [255, 255, 255] as [number, number, number], // Texto branco
      cellPadding: 3,
      lineColor: [100, 100, 100] as [number, number, number], // Bordas cinza claro
      lineWidth: 0.3,
      fillColor: [255, 255, 255] as [number, number, number], // Fundo branco
    },
    headStyles: {
      fillColor: [0, 0, 0] as [number, number, number], // Cabeçalho preto
      textColor: [255, 255, 255] as [number, number, number], // Texto branco
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0] as [number, number, number], // Texto preto no corpo
      cellPadding: 3,
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240] as [number, number, number], // Linhas alternadas cinza claro
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin },
  } as Partial<UserOptions>;
};

// Grade de fotos com bordas cinza escuro e legendas brancas
export const revoPhotoGrid = async (doc: jsPDF, photos: Array<{url: string, title?: string}>, startY: number, columns: number = 2): Promise<number> => {
  if (!photos || photos.length === 0) return startY;

  const photoWidth = (170 - (columns - 1) * 5) / columns;
  const photoHeight = photoWidth * 0.75;
  let currentY = startY;
  let currentX = PDF_DIMENSIONS.margin;
  let photoCount = 0;

  for (const photo of photos) {
    try {
      const processedImage = await processImage(photo.url);
      if (processedImage) {
        // Borda cinza escuro
        doc.setDrawColor(...PDF_COLORS.darkGray);
        doc.setLineWidth(1);
        doc.rect(currentX, currentY, photoWidth, photoHeight, 'S');
        
        // Imagem
        doc.addImage(processedImage, 'JPEG', currentX + 1, currentY + 1, photoWidth - 2, photoHeight - 2);
        
        // Legenda em tarja preta
        if (photo.title) {
          doc.setFillColor(...PDF_COLORS.black);
          doc.rect(currentX, currentY + photoHeight - 8, photoWidth, 8, 'F');
          
          doc.setFontSize(7);
          doc.setFont(PDF_FONTS.normal, 'normal');
          doc.setTextColor(...PDF_COLORS.white);
          doc.text(photo.title, currentX + 2, currentY + photoHeight - 3);
        }
      }
    } catch (error) {
      // Placeholder para foto com erro
      doc.setFillColor(60, 60, 60);
      doc.rect(currentX, currentY, photoWidth, photoHeight, 'F');
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.white);
      doc.text('Imagem não disponível', currentX + photoWidth / 2, currentY + photoHeight / 2, { align: 'center' });
    }

    photoCount++;
    currentX += photoWidth + 5;

    if (photoCount % columns === 0) {
      currentY += photoHeight + 10;
      currentX = PDF_DIMENSIONS.margin;
    }
  }

  if (photoCount % columns !== 0) {
    currentY += photoHeight + 10;
  }

  return currentY;
};