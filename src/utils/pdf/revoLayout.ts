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

// Título de seção: faixa amarela Revo, texto preto em caixa alta
export const revoSectionTitle = (doc: jsPDF, text: string, y: number): number => {
  // Faixa amarela Revo
  doc.setFillColor(...PDF_COLORS.revoYellow);
  doc.rect(PDF_DIMENSIONS.margin - 5, y - 8, 180, 12, 'F');
  
  // Texto em preto, caixa alta
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(text.toUpperCase(), PDF_DIMENSIONS.margin, y);
  
  return y + 15;
};

// Subtítulo: texto preto com linha divisória amarela abaixo
export const revoSubTitle = (doc: jsPDF, text: string, y: number): number => {
  // Texto em preto
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text(text, PDF_DIMENSIONS.margin, y);
  
  // Linha divisória amarela
  doc.setDrawColor(...PDF_COLORS.revoYellow);
  doc.setLineWidth(1);
  doc.line(PDF_DIMENSIONS.margin, y + 2, PDF_DIMENSIONS.margin + 60, y + 2);
  
  return y + 10;
};

// Box de informações com variantes e quebra automática de página
export const revoInfoBox = (doc: jsPDF, y: number, data: Array<[string, string]>, variant: 'critical' | 'dark' | 'light' = 'light'): number => {
  const boxHeight = data.length * 8 + 16; // Padding ligeiramente maior
  
  // Verificar se precisa quebrar página (deixando margem para rodapé)
  if (y + boxHeight > PDF_DIMENSIONS.pageHeight - 30) {
    doc.addPage();
    y = 25; // Posição inicial na nova página
  }
  
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
      // Box com borda cinza clara e fundo branco com mais espaçamento
      doc.setDrawColor(210, 210, 210);
      doc.setFillColor(255, 255, 255); // Fundo branco puro
      doc.setLineWidth(0.3);
      doc.roundedRect(PDF_DIMENSIONS.margin, y, 170, boxHeight, 2, 2, 'FD');
      
      data.forEach(([label, value], idx) => {
        const lineY = y + 10 + (idx * 8); // Mais espaçamento no topo
        doc.setFontSize(9);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
        doc.setTextColor(80, 80, 80); // Cinza mais suave para labels
        doc.text(`${label}`, PDF_DIMENSIONS.margin + 8, lineY);
        
        doc.setFont(PDF_FONTS.normal, 'normal');
        doc.setTextColor(...PDF_COLORS.black);
        // Quebrar texto longo se necessário
        const maxWidth = 90;
        const wrappedValue = doc.splitTextToSize(value, maxWidth);
        doc.text(wrappedValue, PDF_DIMENSIONS.margin + 75, lineY);
        
        // Ajustar altura se texto quebrado
        if (Array.isArray(wrappedValue) && wrappedValue.length > 1) {
          // Para textos quebrados, ajustar o próximo item
          // (Isso é uma simplificação; idealmente calcularíamos corretamente)
        }
      });
  }
  
  return y + boxHeight + 12; // Mais espaçamento após o box
};

// Tema de tabela Revo - design claro
export const revoTableTheme = (): Partial<UserOptions> => {
  return {
    theme: 'grid',
    styles: {
      fontSize: 9,
      textColor: [0, 0, 0] as [number, number, number], // Texto preto
      cellPadding: 3,
      lineColor: [200, 200, 200] as [number, number, number], // Bordas cinza claro
      lineWidth: 0.3,
      fillColor: [255, 255, 255] as [number, number, number], // Fundo branco
    },
    headStyles: {
      fillColor: [244, 255, 0] as [number, number, number], // Cabeçalho amarelo Revo
      textColor: [0, 0, 0] as [number, number, number], // Texto preto
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 4,
    },
    bodyStyles: {
      fontSize: 9,
      textColor: [0, 0, 0] as [number, number, number], // Texto preto no corpo
      cellPadding: 3,
      fillColor: [255, 255, 255] as [number, number, number], // Fundo branco
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248] as [number, number, number], // Linhas alternadas cinza muito claro
    },
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin },
  } as Partial<UserOptions>;
};

// Grade de fotos melhorada com quebras de página automáticas e design mais leve
export const revoPhotoGrid = async (doc: jsPDF, photos: Array<{url: string, title?: string}>, startY: number, columns: number = 2): Promise<number> => {
  if (!photos || photos.length === 0) return startY;

  const photoWidth = (170 - (columns - 1) * 5) / columns;
  const photoHeight = photoWidth * 0.75;
  const captionHeight = 12;
  const totalPhotoHeight = photoHeight + captionHeight + 5;
  
  let currentY = startY;
  let currentX = PDF_DIMENSIONS.margin;
  let photoCount = 0;

  for (const photo of photos) {
    // Verificar se precisamos de nova página (incluindo espaço para legenda e margens)
    if (currentY + totalPhotoHeight > PDF_DIMENSIONS.pageHeight - 30) {
      doc.addPage();
      currentY = 25;
      currentX = PDF_DIMENSIONS.margin;
      photoCount = 0; // Reset da contagem para nova página
    }

    try {
      const processedImage = await processImage(photo.url);
      let imageFormat = 'JPEG'; // Default format
      
      if (processedImage) {
        // Detectar formato correto da imagem
        if (processedImage.startsWith('data:image/png')) {
          imageFormat = 'PNG';
        } else if (processedImage.startsWith('data:image/jpeg') || processedImage.startsWith('data:image/jpg')) {
          imageFormat = 'JPEG';
        }
        
        // Borda cinza muito clara
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.rect(currentX, currentY, photoWidth, photoHeight, 'S');
        
        // Imagem com pequena margem interna
        doc.addImage(processedImage, imageFormat, currentX + 2, currentY + 2, photoWidth - 4, photoHeight - 4);
        
        // Legenda em fundo cinza claro com texto preto (mais leve que amarelo)
        if (photo.title) {
          doc.setFillColor(240, 240, 240);
          doc.rect(currentX, currentY + photoHeight - 10, photoWidth, 10, 'F');
          doc.setDrawColor(200, 200, 200);
          doc.rect(currentX, currentY + photoHeight - 10, photoWidth, 10, 'S');
          
          doc.setFontSize(7);
          doc.setFont(PDF_FONTS.normal, 'normal');
          doc.setTextColor(...PDF_COLORS.black);
          // Truncar texto se muito longo
          const maxWidth = photoWidth - 4;
          const truncatedTitle = doc.getTextWidth(photo.title) > maxWidth 
            ? photo.title.substring(0, 25) + '...' 
            : photo.title;
          doc.text(truncatedTitle, currentX + 2, currentY + photoHeight - 3);
        }
      } else {
        // Placeholder mais elegante para imagens com erro
        doc.setFillColor(250, 250, 250);
        doc.rect(currentX, currentY, photoWidth, photoHeight, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.rect(currentX, currentY, photoWidth, photoHeight, 'S');
        
        // Ícone simples de imagem não disponível
        doc.setFontSize(8);
        doc.setTextColor(160, 160, 160);
        doc.text('Imagem não', currentX + photoWidth / 2, currentY + photoHeight / 2 - 3, { align: 'center' });
        doc.text('disponível', currentX + photoWidth / 2, currentY + photoHeight / 2 + 3, { align: 'center' });
      }
    } catch (error) {
      console.error('[PDF] Erro ao processar foto:', error);
      // Mesmo placeholder em caso de erro
      doc.setFillColor(250, 250, 250);
      doc.rect(currentX, currentY, photoWidth, photoHeight, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.rect(currentX, currentY, photoWidth, photoHeight, 'S');
      
      doc.setFontSize(8);
      doc.setTextColor(160, 160, 160);
      doc.text('Erro ao carregar', currentX + photoWidth / 2, currentY + photoHeight / 2 - 3, { align: 'center' });
      doc.text('imagem', currentX + photoWidth / 2, currentY + photoHeight / 2 + 3, { align: 'center' });
    }

    photoCount++;
    currentX += photoWidth + 5;

    // Quebra de linha quando atinge o número de colunas
    if (photoCount % columns === 0) {
      currentY += totalPhotoHeight;
      currentX = PDF_DIMENSIONS.margin;
    }
  }

  // Ajustar posição final se a linha não estiver completa
  if (photoCount % columns !== 0) {
    currentY += totalPhotoHeight;
  }

  return currentY + 5; // Adicionar espaçamento extra após as fotos
};