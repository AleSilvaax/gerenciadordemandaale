import jsPDF from 'jspdf';
import { Service } from '@/types/serviceTypes';
import { PDF_DIMENSIONS, PDF_COLORS } from './pdfConstants';
import { addText, sanitizeText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';

export const createPhotosSection = async (doc: jsPDF, service: Service, startY: number): Promise<number> => {
  if (!service.photos || service.photos.length === 0) {
    let currentY = startY;
    currentY = addText(doc, '9. ANEXOS FOTOGRÁFICOS', PDF_DIMENSIONS.margin, currentY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [...PDF_COLORS.primary] as [number, number, number]
    });
    currentY = addText(doc, 'Nenhuma foto anexada.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 20;
  }

  let currentY = startY;
  
  currentY = addText(doc, `9. ANEXOS FOTOGRÁFICOS (${service.photos.length} fotos)`, PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  doc.setDrawColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  doc.setLineWidth(1);
  doc.line(PDF_DIMENSIONS.margin, currentY + 2, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, currentY + 2);
  currentY += 10;
  
  const photoWidth = 120; // Largura fixa para a foto
  const photoHeight = 80; // Altura fixa
  const xPosition = (PDF_DIMENSIONS.pageWidth - photoWidth) / 2; // Centraliza a foto
  
  for (let i = 0; i < service.photos.length; i++) {
    currentY = checkPageBreak(doc, currentY, photoHeight + 30);
    
    // Adiciona o título da foto
    currentY = addText(doc, `Foto ${i + 1}:`, PDF_DIMENSIONS.margin, currentY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    currentY += 5;

    try {
      const processedImage = await processImage(service.photos[i]);
      
      if (processedImage) {
        // Verifica o formato da imagem
        const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
        
        // Adiciona a borda antes da imagem
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setLineWidth(0.5);
        doc.rect(xPosition - 2, currentY - 2, photoWidth + 4, photoHeight + 4); 
        
        doc.addImage(processedImage, imageFormat, xPosition, currentY, photoWidth, photoHeight);
      } else {
        // Placeholder em caso de falha no carregamento
        doc.setDrawColor(...PDF_COLORS.border);
        doc.setFillColor(...PDF_COLORS.lightGray);
        doc.roundedRect(xPosition, currentY, photoWidth, photoHeight, 5, 5, 'FD');
        
        addText(doc, 'IMAGEM NÃO DISPONÍVEL', xPosition + photoWidth / 2, currentY + photoHeight / 2, {
          fontSize: 11,
          color: [...PDF_COLORS.secondary] as [number, number, number],
          align: 'center'
        });
      }
    } catch (error) {
      console.error(`[PDF] Erro ao processar foto ${i + 1}:`, error);
      // Placeholder em caso de erro
      doc.setDrawColor(...PDF_COLORS.border);
      doc.setFillColor(...PDF_COLORS.lightGray);
      doc.roundedRect(xPosition, currentY, photoWidth, photoHeight, 5, 5, 'FD');
      
      addText(doc, 'ERRO AO CARREGAR IMAGEM', xPosition + photoWidth / 2, currentY + photoHeight / 2, {
        fontSize: 11,
        color: [...PDF_COLORS.secondary] as [number, number, number],
        align: 'center'
      });
    }

    currentY += photoHeight + 15; // Adiciona espaço após a foto
  }
  
  return currentY;
};
