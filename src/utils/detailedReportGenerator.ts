
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

  // PÁGINA 1 - CAPA
  yPosition = addHeader(doc, "RELATÓRIO DE DEMANDA", 30);
  
  // Card de informações principais
  doc.setFillColor(240, 240, 240);
  doc.rect(25, yPosition, 160, 100, 'FD');
  
  let cardY = yPosition + 20;
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(safeText(service.title), 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Número: ${service.number || 'N/A'}`, 105, cardY, { align: "center" });
  
  cardY += 10;
  doc.text(`Cliente: ${service.client || 'N/A'}`, 105, cardY, { align: "center" });
  
  cardY += 10;
  doc.text(`Local: ${safeText(service.location)}`, 105, cardY, { align: "center" });
  
  cardY += 10;
  doc.text(`Status: ${service.status === 'concluido' ? 'Concluído' : service.status === 'pendente' ? 'Pendente' : 'Cancelado'}`, 105, cardY, { align: "center" });
  
  cardY += 10;
  doc.text(`Data: ${service.creationDate ? formatDate(service.creationDate) : 'N/A'}`, 105, cardY, { align: "center" });

  // PÁGINA 2 - DETALHES DO SERVIÇO
  doc.addPage();
  yPosition = addHeader(doc, "DETALHES DO SERVIÇO", 20);
  
  yPosition = addSection(doc, "INFORMAÇÕES GERAIS", yPosition);
  yPosition = addInfoLine(doc, "Título:", safeText(service.title), yPosition);
  yPosition = addInfoLine(doc, "Descrição:", safeText(service.description || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Localização:", safeText(service.location), yPosition);
  yPosition = addInfoLine(doc, "Cliente:", safeText(service.client || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Endereço:", safeText(service.address || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Cidade:", safeText(service.city || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Tipo de Serviço:", safeText(service.serviceType || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Prioridade:", safeText(service.priority || 'N/A'), yPosition);
  yPosition = addInfoLine(doc, "Técnico:", safeText(service.technician?.name || 'N/A'), yPosition);

  // CAMPOS TÉCNICOS
  if (service.customFields && service.customFields.length > 0) {
    yPosition += 10;
    yPosition = addSection(doc, "CHECKLIST TÉCNICO", yPosition);
    
    service.customFields.forEach((field: CustomField) => {
      let value = '';
      if (field.type === 'boolean') {
        value = field.value ? 'Sim' : 'Não';
      } else if (field.type === 'select') {
        value = String(field.value);
      } else {
        value = String(field.value || 'N/A');
      }
      yPosition = addInfoLine(doc, `${field.label}:`, safeText(value), yPosition);
    });
  }

  // PÁGINA DE FOTOS
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = addHeader(doc, "ANEXOS FOTOGRÁFICOS", 20);

    console.log('[PDF] Processando', service.photos.length, 'fotos para o relatório');

    for (const [photoIndex, photoUrl] of service.photos.entries()) {
      if (yPosition > 150) { 
        doc.addPage(); 
        yPosition = 30; 
      }
      
      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      yPosition = addSection(doc, `FOTO: ${safeText(photoTitle)}`, yPosition);

      try {
        console.log('[PDF] Processando foto:', photoUrl);
        const processedImage = await processImageForPDF(photoUrl);
        
        if (processedImage) {
          const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
          const { width, height } = calculateImageDimensions(processedImage);
          const xPosition = (PDF_DIMENSIONS.pageWidth - width) / 2;
          
          doc.addImage(processedImage, imageFormat, xPosition, yPosition, width, height);
          yPosition += height + 15;
          console.log('[PDF] Foto processada com sucesso:', photoTitle);
        } else { 
          console.warn('[PDF] Falha ao processar foto:', photoUrl);
          doc.setFontSize(10);
          doc.text("Erro ao carregar foto", 105, yPosition + 30, { align: "center" });
          yPosition += 70;
        }
      } catch (error) {
        console.error('[PDF] Erro ao processar foto:', error);
        doc.setFontSize(10);
        doc.text("Erro ao carregar foto", 105, yPosition + 30, { align: "center" });
        yPosition += 70;
      }
    }
  }

  // MENSAGENS
  if (service.messages && service.messages.length > 0) {
    doc.addPage();
    yPosition = addHeader(doc, "HISTÓRICO DE MENSAGENS", 20);
    
    service.messages.forEach((message) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }
      
      yPosition = addSection(doc, `${message.senderName} (${message.senderRole})`, yPosition);
      yPosition = addInfoLine(doc, "Data:", formatDate(message.timestamp || new Date().toISOString()), yPosition);
      yPosition = addInfoLine(doc, "Mensagem:", safeText(message.message), yPosition);
      yPosition += 5;
    });
  }

  // ASSINATURAS
  if (service.signatures) {
    doc.addPage();
    yPosition = addSignatureSection(doc, service.signatures, 20);
  }

  // FEEDBACK
  if (service.feedback) {
    if (!service.signatures) {
      doc.addPage();
      yPosition = 20;
    }
    
    yPosition = addSection(doc, "AVALIAÇÃO DO CLIENTE", yPosition + 20);
    yPosition = addInfoLine(doc, "Nota:", `${service.feedback.clientRating}/5`, yPosition);
    if (service.feedback.clientComment) {
      yPosition = addInfoLine(doc, "Comentário:", safeText(service.feedback.clientComment), yPosition);
    }
    if (service.feedback.technicianFeedback) {
      yPosition = addInfoLine(doc, "Feedback do Técnico:", safeText(service.feedback.technicianFeedback), yPosition);
    }
  }

  addPageNumbers(doc);
  const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
  doc.save(fileName);
  
  console.log('[PDF] Relatório gerado com sucesso:', fileName);
};
