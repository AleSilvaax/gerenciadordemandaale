
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
  
  // Configurar fonte para evitar problemas de codificação
  doc.setFont("helvetica");

  // PÁGINA 1 - CAPA
  yPosition = addHeader(doc, "RELATORIO DE DEMANDA", 30);
  
  // Card principal da capa
  doc.setFillColor(PDF_COLORS.white[0], PDF_COLORS.white[1], PDF_COLORS.white[2]);
  doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
  doc.setLineWidth(0.5);
  doc.rect(25, yPosition, 160, 100, 'FD');

  let cardY = yPosition + 20;
  
  // Título do serviço
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
  const titleText = safeText(service.title || "Demanda");
  doc.text(titleText, 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
  doc.text(safeText("Numero: " + (service.number || service.id.substring(0, 8))), 105, cardY, { align: "center" });
  
  cardY += 12;
  doc.text(safeText("Cliente: " + (service.client || "Nao informado")), 105, cardY, { align: "center" });
  
  cardY += 12;
  doc.text(safeText("Tecnico: " + (service.technician?.name || "Nao atribuido")), 105, cardY, { align: "center" });
  
  cardY += 12;
  const statusText = service.status === "concluido" ? "Concluido" : 
                    service.status === "cancelado" ? "Cancelado" : "Pendente";
  doc.setTextColor(PDF_COLORS.accent[0], PDF_COLORS.accent[1], PDF_COLORS.accent[2]);
  doc.setFont("helvetica", "bold");
  doc.text(safeText("Status: " + statusText), 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(safeText("Criacao: " + (service.creationDate ? formatDate(service.creationDate) : "N/A")), 105, cardY, { align: "center" });

  // Rodapé da capa
  doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
  doc.setFontSize(8);
  doc.text(safeText("Gerado em: " + formatDate(new Date().toISOString())), 105, 270, { align: "center" });
  doc.text("Sistema de Gestao de Demandas", 105, 280, { align: "center" });

  // PÁGINA 2 - INFORMAÇÕES DETALHADAS
  doc.addPage();
  yPosition = addHeader(doc, "INFORMACOES DETALHADAS", 20);

  // Dados Gerais
  yPosition = addSection(doc, "DADOS GERAIS", yPosition);
  
  addInfoLine(doc, "Numero", service.number || "N/A", 20, yPosition);
  addInfoLine(doc, "Prioridade", service.priority || "Media", 110, yPosition);
  yPosition += 12;
  
  addInfoLine(doc, "Localizacao", service.location || "N/A", 20, yPosition);
  addInfoLine(doc, "Tipo", service.serviceType || "N/A", 110, yPosition);
  yPosition += 12;
  
  addInfoLine(doc, "Criacao", service.creationDate ? formatDate(service.creationDate) : "N/A", 20, yPosition);
  addInfoLine(doc, "Vencimento", service.dueDate ? formatDate(service.dueDate) : "N/A", 110, yPosition);
  yPosition += 20;

  // Descrição
  if (service.description) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 30;
    }
    
    yPosition = addSection(doc, "DESCRICAO", yPosition);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
    
    const descriptionText = safeText(service.description);
    const splitDescription = doc.splitTextToSize(descriptionText, 170);
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 15;
  }

  // Campos Personalizados
  if (service.customFields && service.customFields.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = 30;
    }

    yPosition = addSection(doc, "CAMPOS PERSONALIZADOS", yPosition);
    
    service.customFields.forEach((field: CustomField) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      doc.text(safeText(field.label + ":"), 20, yPosition);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      
      let valueText = "";
      if (field.type === 'boolean') {
        valueText = field.value ? "Sim" : "Nao";
      } else {
        valueText = String(field.value || "N/A");
      }

      const safeValue = safeText(valueText);
      if (field.type === 'textarea' && safeValue.length > 50) {
        const splitText = doc.splitTextToSize(safeValue, 150);
        doc.text(splitText, 70, yPosition);
        yPosition += splitText.length * 5 + 5;
      } else {
        doc.text(safeValue, 70, yPosition);
        yPosition += 10;
      }
    });
    yPosition += 10;
  }

  // PÁGINA DE FOTOS
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = addHeader(doc, "ANEXOS FOTOGRAFICOS", 20);

    for (let photoIndex = 0; photoIndex < service.photos.length; photoIndex++) {
      if (yPosition > 150) {
        doc.addPage();
        yPosition = 30;
      }

      const photoUrl = service.photos[photoIndex];
      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      
      // Título da foto
      yPosition = addSection(doc, safeText("FOTO: " + photoTitle), yPosition);

      try {
        console.log(`Processando foto ${photoIndex + 1} para PDF:`, photoUrl?.substring(0, 50) + "...");
        
        const processedImage = processImageForPDF(photoUrl);
        if (processedImage) {
          // Calcular dimensões proporcionais
          const { width, height } = calculateImageDimensions(processedImage);
          
          // Centralizar a imagem na página
          const xPosition = (PDF_DIMENSIONS.pageWidth - width) / 2;
          
          doc.addImage(processedImage, 'JPEG', xPosition, yPosition, width, height);
          console.log(`Foto ${photoIndex + 1} adicionada ao PDF (${width}x${height})`);
          yPosition += height + 10;
        } else {
          throw new Error('Imagem não pôde ser processada');
        }
      } catch (error) {
        console.error(`Erro ao processar foto ${photoIndex + 1}:`, error);
        // Placeholder para foto com erro
        doc.setDrawColor(PDF_COLORS.border[0], PDF_COLORS.border[1], PDF_COLORS.border[2]);
        doc.rect(55, yPosition, 100, 60);
        doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
        doc.setFontSize(10);
        doc.text("Erro ao carregar foto", 105, yPosition + 30, { align: "center" });
        yPosition += 70;
      }
    }
  }

  // PÁGINA DE MENSAGENS
  if (service.messages && service.messages.length > 0) {
    doc.addPage();
    yPosition = addHeader(doc, "COMUNICACAO E MENSAGENS", 20);

    service.messages.forEach((message) => {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }

      // Header da mensagem
      doc.setFillColor(PDF_COLORS.lightGray[0], PDF_COLORS.lightGray[1], PDF_COLORS.lightGray[2]);
      doc.rect(15, yPosition, 180, 8, 'F');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PDF_COLORS.primary[0], PDF_COLORS.primary[1], PDF_COLORS.primary[2]);
      const messageDate = message.timestamp ? formatDate(message.timestamp) : "N/A";
      doc.text(safeText(message.senderName + " - " + messageDate), 20, yPosition + 5);
      
      yPosition += 15;
      
      // Conteúdo da mensagem
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      
      const messageText = safeText(message.message);
      const splitMessage = doc.splitTextToSize(messageText, 170);
      doc.text(splitMessage, 20, yPosition);
      yPosition += splitMessage.length * 5 + 10;
    });
  }

  // PÁGINA DE FEEDBACK
  if (service.feedback) {
    doc.addPage();
    yPosition = addHeader(doc, "FEEDBACK E AVALIACAO", 20);

    yPosition = addSection(doc, "AVALIACAO DO CLIENTE", yPosition);
    
    if (service.feedback.clientRating) {
      addInfoLine(doc, "Avaliacao", service.feedback.clientRating + "/5 estrelas", 20, yPosition);
      yPosition += 15;
    }

    if (service.feedback.clientComment) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(PDF_COLORS.secondary[0], PDF_COLORS.secondary[1], PDF_COLORS.secondary[2]);
      doc.text("Comentario do Cliente:", 20, yPosition);
      yPosition += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      const commentText = safeText(service.feedback.clientComment);
      const splitComment = doc.splitTextToSize(commentText, 170);
      doc.text(splitComment, 20, yPosition);
      yPosition += splitComment.length * 5 + 15;
    }

    if (service.feedback.technicianFeedback) {
      yPosition = addSection(doc, "FEEDBACK DO TECNICO", yPosition);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(PDF_COLORS.text[0], PDF_COLORS.text[1], PDF_COLORS.text[2]);
      const techFeedback = safeText(service.feedback.technicianFeedback);
      const splitTechFeedback = doc.splitTextToSize(techFeedback, 170);
      doc.text(splitTechFeedback, 20, yPosition);
      yPosition += splitTechFeedback.length * 5 + 15;
    }
  }

  // PÁGINA DE ASSINATURAS
  doc.addPage();
  yPosition = addHeader(doc, "ASSINATURAS E APROVACOES", 20);
  addSignatureSection(doc, service, yPosition);

  // Adicionar numeração das páginas
  addPageNumbers(doc);

  // Salvar o PDF
  const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
  doc.save(fileName);
  console.log("PDF gerado com sucesso:", fileName);
};
