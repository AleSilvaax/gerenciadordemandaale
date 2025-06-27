// Arquivo: src/utils/detailedReportGenerator.ts

import { jsPDF } from "jspdf";
import { Service } from "@/types/serviceTypes";
import { formatDate } from "./formatters";
import { PDF_COLORS, PDF_DIMENSIONS } from './pdf/pdfConstants';
import { calculateImageDimensions, processImageForPDF } from './pdf/imageProcessor';
import { safeText } from './pdf/textUtils';
import { addHeader, addSection, addInfoLine, addPageNumbers } from './pdf/pdfFormatters';
import { addSignatureSection } from './pdf/signatureHandler';

export const generateDetailedServiceReport = async (service: Service): Promise<void> => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  doc.setFont("helvetica");

  // [O CÓDIGO DA CAPA E DAS SEÇÕES DE INFORMAÇÕES PERMANECE O MESMO]
  // ... (todo o código que gera a primeira página e a de detalhes)


  // --- AQUI COMEÇA A CORREÇÃO IMPORTANTE ---

  // PÁGINA DE FOTOS
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = addHeader(doc, "ANEXOS FOTOGRAFICOS", 20);

    // Usamos um loop 'for...of' que funciona com 'await'
    for (const [photoIndex, photoUrl] of service.photos.entries()) {
      if (yPosition > 150) { // Garante espaço para a imagem
        doc.addPage();
        yPosition = 30;
      }

      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      yPosition = addSection(doc, safeText("FOTO: " + photoTitle), yPosition);

      try {
        // A função agora é assíncrona, então usamos 'await'
        const processedImage = await processImageForPDF(photoUrl);
        
        if (processedImage) {
          const imageFormat = processedImage.includes('png') ? 'PNG' : 'JPEG';
          const { width, height } = calculateImageDimensions(processedImage);
          const xPosition = (PDF_DIMENSIONS.pageWidth - width) / 2;
          
          doc.addImage(processedImage, imageFormat, xPosition, yPosition, width, height);
          yPosition += height + 10;
        } else {
          throw new Error('A imagem não pôde ser processada ou a URL é inválida');
        }
      } catch (error) {
        console.error(`Erro ao processar a foto ${photoIndex + 1}:`, error);
        doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
        doc.rect(55, yPosition, 100, 60);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(10);
        doc.text("Erro ao carregar foto", 105, yPosition + 30, { align: "center" });
        yPosition += 70;
      }
    }
  }

  // ... (o resto do código para gerar mensagens, assinaturas, etc., continua igual)
  // [O código das seções de mensagens e assinaturas permanece o mesmo]

  addPageNumbers(doc);
  const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
  doc.save(fileName);
};
