
import { jsPDF } from "jspdf";
import { PDF_COLORS, PDF_DIMENSIONS } from './pdfConstants';
import { processImage } from './imageProcessor';
import { addSection, addInfoLine } from './pdfFormatters';
import { safeText } from './textUtils';
import { Service } from '@/types/serviceTypes';

export const addSignatureSection = async (
  doc: jsPDF, 
  service: Service, 
  yPosition: number
): Promise<number> => {
  let currentY = yPosition;
  const signatures = service.signatures;

  if (signatures?.client || signatures?.technician) {
    // Assinatura do Cliente
    if (signatures.client) {
      currentY = addSection(doc, "ASSINATURA DO CLIENTE", currentY);
      
      // Use client info from service
      const clientName = service.client || "Cliente não informado";
      currentY = addInfoLine(doc, "Cliente", clientName, currentY);
      currentY = addInfoLine(doc, "Data", new Date().toLocaleDateString('pt-BR'), currentY);
      currentY += 10;
      
      try {
        const processedSignature = await processImage(signatures.client);
        if (processedSignature) {
          const signatureWidth = PDF_DIMENSIONS.signatureWidth;
          const signatureHeight = PDF_DIMENSIONS.signatureHeight;
          const xPosition = 30;
          
          doc.addImage(processedSignature, 'PNG', xPosition, currentY, signatureWidth, signatureHeight);
          console.log("[PDF] Assinatura do cliente adicionada:", clientName);
          
          // Linha para assinatura abaixo da imagem
          doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
          doc.setLineWidth(0.5);
          doc.line(xPosition, currentY + signatureHeight + 5, xPosition + signatureWidth, currentY + signatureHeight + 5);
          
          // Add client name below signature
          doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
          doc.setFontSize(8);
          doc.text(safeText(clientName), xPosition, currentY + signatureHeight + 15);
          
          currentY += signatureHeight + 25;
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("[PDF] Erro ao processar assinatura do cliente:", error);
        // Linha para assinatura manual
        doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
        doc.setLineWidth(0.5);
        doc.line(30, currentY + 10, 110, currentY + 10);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(8);
        doc.text(`Assinatura: ${safeText(clientName)}`, 30, currentY + 20);
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
      
      // Use technician info from service
      const technicianName = service.technician?.name || "Técnico não atribuído";
      currentY = addInfoLine(doc, "Técnico", technicianName, currentY);
      currentY = addInfoLine(doc, "Data", new Date().toLocaleDateString('pt-BR'), currentY);
      currentY += 10;
      
      try {
        const processedSignature = await processImage(signatures.technician);
        if (processedSignature) {
          const signatureWidth = PDF_DIMENSIONS.signatureWidth;
          const signatureHeight = PDF_DIMENSIONS.signatureHeight;
          const xPosition = 30;
          
          doc.addImage(processedSignature, 'PNG', xPosition, currentY, signatureWidth, signatureHeight);
          console.log("[PDF] Assinatura do técnico adicionada:", technicianName);
          
          // Linha para assinatura abaixo da imagem
          doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
          doc.setLineWidth(0.5);
          doc.line(xPosition, currentY + signatureHeight + 5, xPosition + signatureWidth, currentY + signatureHeight + 5);
          
          // Add technician name below signature
          doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
          doc.setFontSize(8);
          doc.text(safeText(technicianName), xPosition, currentY + signatureHeight + 15);
          
          currentY += signatureHeight + 25;
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("[PDF] Erro ao processar assinatura do técnico:", error);
        // Linha para assinatura manual
        doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
        doc.setLineWidth(0.5);
        doc.line(30, currentY + 10, 110, currentY + 10);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(8);
        doc.text(`Assinatura: ${safeText(technicianName)}`, 30, currentY + 20);
        currentY += 30;
      }
    }
  } else {
    // Áreas para assinaturas em branco com informações do serviço
    currentY = addSection(doc, "AREA PARA ASSINATURAS", currentY);

    const clientName = service.client || "Cliente não informado";
    const technicianName = service.technician?.name || "Técnico não atribuído";

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.text(`Cliente: ${safeText(clientName)}`, 20, currentY);
    doc.setDrawColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    doc.setLineWidth(0.5);
    doc.line(45, currentY + 5, 100, currentY + 5);
    doc.text("Data:", 120, currentY);
    doc.line(140, currentY + 5, 180, currentY + 5);
    currentY += 25;

    doc.text(`Técnico: ${safeText(technicianName)}`, 20, currentY);
    doc.line(45, currentY + 5, 100, currentY + 5);
    doc.text("Data:", 120, currentY);
    doc.line(140, currentY + 5, 180, currentY + 5);
    currentY += 25;
  }

  return currentY;
};
