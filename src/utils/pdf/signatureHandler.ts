
import { jsPDF } from "jspdf";
import { PDF_COLORS, PDF_DIMENSIONS } from './pdfConstants';
import { processImage } from './imageProcessor';
import { addSection, addInfoLine } from './pdfFormatters';
import { safeText } from './textUtils';

export const addSignatureSection = async (doc: jsPDF, signatures: { client?: string; technician?: string }, yPosition: number): Promise<number> => {
  let currentY = yPosition;

  if (signatures?.client || signatures?.technician) {
    // Assinatura do Cliente
    if (signatures.client) {
      currentY = addSection(doc, "ASSINATURA DO CLIENTE", currentY);
      
      currentY = addInfoLine(doc, "Cliente", "N/A", currentY);
      currentY = addInfoLine(doc, "Data", new Date().toLocaleDateString(), currentY);
      currentY += 10;
      
      try {
        const processedSignature = await processImage(signatures.client);
        if (processedSignature) {
          const signatureWidth = PDF_DIMENSIONS.signatureWidth;
          const signatureHeight = PDF_DIMENSIONS.signatureHeight;
          const xPosition = 30;
          
          doc.addImage(processedSignature, 'PNG', xPosition, currentY, signatureWidth, signatureHeight);
          console.log("Assinatura do cliente adicionada ao PDF");
          
          // Linha para assinatura abaixo da imagem
          doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
          doc.setLineWidth(0.5);
          doc.line(xPosition, currentY + signatureHeight + 5, xPosition + signatureWidth, currentY + signatureHeight + 5);
          
          currentY += signatureHeight + 15;
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("Erro ao processar assinatura do cliente:", error);
        // Linha para assinatura manual
        doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
        doc.setLineWidth(0.5);
        doc.line(30, currentY + 10, 110, currentY + 10);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(8);
        doc.text("Assinatura do Cliente", 30, currentY + 20);
        currentY += 30;
      }
    }

    // Assinatura do Técnico
    if (signatures.technician) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 30;
      }
      
      currentY = addSection(doc, "ASSINATURA DO TECNICO", currentY);
      
      currentY = addInfoLine(doc, "Tecnico", "N/A", currentY);
      currentY = addInfoLine(doc, "Data", new Date().toLocaleDateString(), currentY);
      currentY += 10;
      
      try {
        const processedSignature = await processImage(signatures.technician);
        if (processedSignature) {
          const signatureWidth = PDF_DIMENSIONS.signatureWidth;
          const signatureHeight = PDF_DIMENSIONS.signatureHeight;
          const xPosition = 30;
          
          doc.addImage(processedSignature, 'PNG', xPosition, currentY, signatureWidth, signatureHeight);
          console.log("Assinatura do técnico adicionada ao PDF");
          
          // Linha para assinatura abaixo da imagem
          doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
          doc.setLineWidth(0.5);
          doc.line(xPosition, currentY + signatureHeight + 5, xPosition + signatureWidth, currentY + signatureHeight + 5);
          
          currentY += signatureHeight + 15;
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("Erro ao processar assinatura do técnico:", error);
        // Linha para assinatura manual
        doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
        doc.setLineWidth(0.5);
        doc.line(30, currentY + 10, 110, currentY + 10);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(8);
        doc.text("Assinatura do Técnico", 30, currentY + 20);
        currentY += 30;
      }
    }
  } else {
    // Áreas para assinaturas em branco com estilo mais profissional
    currentY = addSection(doc, "AREA PARA ASSINATURAS", currentY);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text("Cliente:", 20, currentY);
    doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.setLineWidth(0.5);
    doc.line(45, currentY, 100, currentY);
    doc.text("Data:", 120, currentY);
    doc.line(140, currentY, 180, currentY);
    currentY += 25;

    doc.text("Tecnico:", 20, currentY);
    doc.line(45, currentY, 100, currentY);
    doc.text("Data:", 120, currentY);
    doc.line(140, currentY, 180, currentY);
    currentY += 25;
  }

  return currentY;
};
