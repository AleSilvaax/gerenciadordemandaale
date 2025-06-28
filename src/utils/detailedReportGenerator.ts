// Arquivo: src/utils/detailedReportGenerator.ts

import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
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

  // PÁGINA 1 - CAPA (Esta parte não muda)
  yPosition = addHeader(doc, "RELATORIO DE DEMANDA", 30);
  doc.rect(25, yPosition, 160, 100, 'FD');
  let cardY = yPosition + 20;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(service.title), 105, cardY, { align: "center" });
  cardY += 15;
  // ... (Resto do código da capa)


// ... (início da função generateDetailedServiceReport)

  // PÁGINA DE FOTOS (a parte corrigida)
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    let yPosition = addHeader(doc, "ANEXOS FOTOGRAFICOS", 20);

    for (const [photoIndex, photoUrl] of service.photos.entries()) {
      if (yPosition > 150) { doc.addPage(); yPosition = 30; }
      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      yPosition = addSection(doc, safeText("FOTO: " + photoTitle), yPosition);

      try {
        const processedImage = await processImageForPDF(photoUrl);
        if (processedImage) {
          const imageFormat = processedImage.includes('png') ? 'PNG' : 'JPEG';
          const { width, height } = calculateImageDimensions(processedImage);
          const xPosition = (PDF_DIMENSIONS.pageWidth - width) / 2;
          doc.addImage(processedImage, imageFormat, xPosition, yPosition, width, height);
          yPosition += height + 10;
        } else { throw new Error('Imagem nula ou URL inválida'); }
      } catch (error) {
        doc.text("Erro ao carregar foto", 105, yPosition + 30, { align: "center" });
        yPosition += 70;
      }
    }
  }

// ... (resto do ficheiro)

  // --- O resto do código para gerar o PDF continua igual ---
  // ... (código para mensagens, assinaturas, etc.)

  addPageNumbers(doc);
  const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
  doc.save(fileName);
};
