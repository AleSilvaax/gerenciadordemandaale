
import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
import { formatDate } from "./formatters";

export const generateDetailedServiceReport = async (service: Service): Promise<void> => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Configurar fonte para evitar problemas de codificação
  doc.setFont("helvetica");
  
  // Cores profissionais
  const colors = {
    primary: [41, 98, 184],      // Azul profissional
    secondary: [74, 85, 104],    // Cinza escuro
    accent: [16, 185, 129],      // Verde moderno
    text: [31, 41, 55],          // Texto principal
    lightGray: [243, 244, 246],  // Fundo claro
    white: [255, 255, 255],      // Branco
    border: [209, 213, 219]      // Borda
  };

  // Função melhorada para texto seguro
  const safeText = (text: string): string => {
    if (!text) return '';
    return text
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
      .replace(/[^\w\s\-.,()\/]/g, '') // Remove caracteres especiais
      .trim();
  };

  // Função para adicionar cabeçalho
  const addHeader = (title: string, y: number): number => {
    // Fundo do cabeçalho
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, y, 210, 20, 'F');
    
    // Título
    doc.setTextColor(colors.white[0], colors.white[1], colors.white[2]);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(safeText(title), 105, y + 12, { align: "center" });
    
    return y + 30;
  };

  // Função para adicionar seção
  const addSection = (title: string, y: number): number => {
    doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
    doc.rect(15, y, 180, 12, 'F');
    
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(safeText(title), 20, y + 8);
    
    return y + 20;
  };

  // Função para adicionar linha de informação
  const addInfoLine = (label: string, value: string, x: number, y: number): void => {
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(safeText(label + ":"), x, y);
    
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    const maxWidth = 80;
    const lines = doc.splitTextToSize(safeText(value), maxWidth);
    doc.text(lines, x + 35, y);
  };

  // Função para processar imagem base64
  const processImageForPDF = (base64Url: string): string | null => {
    try {
      // Verificar se é uma string válida de base64
      if (!base64Url || !base64Url.startsWith('data:image')) {
        console.warn('URL de imagem inválida:', base64Url?.substring(0, 50));
        return null;
      }

      // Extrair apenas a parte base64
      const base64Data = base64Url.split(',')[1];
      if (!base64Data) {
        console.warn('Dados base64 não encontrados');
        return null;
      }

      // Verificar o tipo de imagem
      const imageType = base64Url.substring(5, base64Url.indexOf(';'));
      console.log('Processando imagem tipo:', imageType, 'tamanho:', base64Data.length);

      return base64Url;
    } catch (error) {
      console.error('Erro ao processar imagem:', error);
      return null;
    }
  };

  // PÁGINA 1 - CAPA
  yPosition = addHeader("RELATORIO DE DEMANDA", 30);
  
  // Card principal da capa
  doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
  doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
  doc.setLineWidth(0.5);
  doc.rect(25, yPosition, 160, 100, 'FD');

  let cardY = yPosition + 20;
  
  // Título do serviço
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  const titleText = safeText(service.title || "Demanda");
  doc.text(titleText, 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(safeText("Numero: " + (service.number || service.id.substring(0, 8))), 105, cardY, { align: "center" });
  
  cardY += 12;
  doc.text(safeText("Cliente: " + (service.client || "Nao informado")), 105, cardY, { align: "center" });
  
  cardY += 12;
  doc.text(safeText("Tecnico: " + (service.technician?.name || "Nao atribuido")), 105, cardY, { align: "center" });
  
  cardY += 12;
  const statusText = service.status === "concluido" ? "Concluido" : 
                    service.status === "cancelado" ? "Cancelado" : "Pendente";
  doc.setTextColor(colors.accent[0], colors.accent[1], colors.accent[2]);
  doc.setFont("helvetica", "bold");
  doc.text(safeText("Status: " + statusText), 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(safeText("Criacao: " + (service.creationDate ? formatDate(service.creationDate) : "N/A")), 105, cardY, { align: "center" });

  // Rodapé da capa
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setFontSize(8);
  doc.text(safeText("Gerado em: " + formatDate(new Date().toISOString())), 105, 270, { align: "center" });
  doc.text("Sistema de Gestao de Demandas", 105, 280, { align: "center" });

  // PÁGINA 2 - INFORMAÇÕES DETALHADAS
  doc.addPage();
  yPosition = addHeader("INFORMACOES DETALHADAS", 20);

  // Dados Gerais
  yPosition = addSection("DADOS GERAIS", yPosition);
  
  addInfoLine("Numero", service.number || "N/A", 20, yPosition);
  addInfoLine("Prioridade", service.priority || "Media", 110, yPosition);
  yPosition += 12;
  
  addInfoLine("Localizacao", service.location || "N/A", 20, yPosition);
  addInfoLine("Tipo", service.serviceType || "N/A", 110, yPosition);
  yPosition += 12;
  
  addInfoLine("Criacao", service.creationDate ? formatDate(service.creationDate) : "N/A", 20, yPosition);
  addInfoLine("Vencimento", service.dueDate ? formatDate(service.dueDate) : "N/A", 110, yPosition);
  yPosition += 20;

  // Descrição
  if (service.description) {
    if (yPosition > 230) {
      doc.addPage();
      yPosition = 30;
    }
    
    yPosition = addSection("DESCRICAO", yPosition);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    
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

    yPosition = addSection("CAMPOS PERSONALIZADOS", yPosition);
    
    service.customFields.forEach((field: CustomField) => {
      if (yPosition > 250) {
        doc.addPage();
        yPosition = 30;
      }

      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.text(safeText(field.label + ":"), 20, yPosition);
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      
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

  // PÁGINA DE FOTOS - MELHORADA
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = addHeader("ANEXOS FOTOGRAFICOS", 20);

    for (let photoIndex = 0; photoIndex < service.photos.length; photoIndex++) {
      if (yPosition > 180) {
        doc.addPage();
        yPosition = 30;
      }

      const photoUrl = service.photos[photoIndex];
      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      
      // Título da foto
      yPosition = addSection(safeText("FOTO: " + photoTitle), yPosition);

      try {
        console.log(`Processando foto ${photoIndex + 1} para PDF:`, photoUrl?.substring(0, 50) + "...");
        
        const processedImage = processImageForPDF(photoUrl);
        if (processedImage) {
          // Adicionar imagem com dimensões controladas
          const imgWidth = 160;
          const imgHeight = 80;
          doc.addImage(processedImage, 'JPEG', 25, yPosition, imgWidth, imgHeight);
          console.log(`Foto ${photoIndex + 1} adicionada ao PDF com sucesso`);
        } else {
          throw new Error('Imagem não pôde ser processada');
        }
      } catch (error) {
        console.error(`Erro ao processar foto ${photoIndex + 1}:`, error);
        // Placeholder para foto com erro
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.rect(25, yPosition, 160, 80);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(10);
        doc.text("Erro ao carregar foto", 105, yPosition + 40, { align: "center" });
      }

      yPosition += 90;
    }
  }

  // PÁGINA DE MENSAGENS
  if (service.messages && service.messages.length > 0) {
    doc.addPage();
    yPosition = addHeader("COMUNICACAO E MENSAGENS", 20);

    service.messages.forEach((message, index) => {
      if (yPosition > 240) {
        doc.addPage();
        yPosition = 30;
      }

      // Header da mensagem
      doc.setFillColor(colors.lightGray[0], colors.lightGray[1], colors.lightGray[2]);
      doc.rect(15, yPosition, 180, 8, 'F');
      
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      const messageDate = message.timestamp ? formatDate(message.timestamp) : "N/A";
      doc.text(safeText(message.senderName + " - " + messageDate), 20, yPosition + 5);
      
      yPosition += 15;
      
      // Conteúdo da mensagem
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      
      const messageText = safeText(message.message);
      const splitMessage = doc.splitTextToSize(messageText, 170);
      doc.text(splitMessage, 20, yPosition);
      yPosition += splitMessage.length * 5 + 10;
    });
  }

  // PÁGINA DE FEEDBACK
  if (service.feedback) {
    doc.addPage();
    yPosition = addHeader("FEEDBACK E AVALIACAO", 20);

    yPosition = addSection("AVALIACAO DO CLIENTE", yPosition);
    
    if (service.feedback.clientRating) {
      addInfoLine("Avaliacao", service.feedback.clientRating + "/5 estrelas", 20, yPosition);
      yPosition += 15;
    }

    if (service.feedback.clientComment) {
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
      doc.text("Comentario do Cliente:", 20, yPosition);
      yPosition += 8;
      
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      const commentText = safeText(service.feedback.clientComment);
      const splitComment = doc.splitTextToSize(commentText, 170);
      doc.text(splitComment, 20, yPosition);
      yPosition += splitComment.length * 5 + 15;
    }

    if (service.feedback.technicianFeedback) {
      yPosition = addSection("FEEDBACK DO TECNICO", yPosition);
      
      doc.setFontSize(9);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
      const techFeedback = safeText(service.feedback.technicianFeedback);
      const splitTechFeedback = doc.splitTextToSize(techFeedback, 170);
      doc.text(splitTechFeedback, 20, yPosition);
      yPosition += splitTechFeedback.length * 5 + 15;
    }
  }

  // PÁGINA DE ASSINATURAS - MELHORADA
  doc.addPage();
  yPosition = addHeader("ASSINATURAS E APROVACOES", 20);

  if (service.signatures?.client || service.signatures?.technician) {
    // Assinatura do Cliente
    if (service.signatures.client) {
      yPosition = addSection("ASSINATURA DO CLIENTE", yPosition);
      
      addInfoLine("Cliente", service.client || "N/A", 20, yPosition);
      addInfoLine("Data", formatDate(new Date().toISOString()), 20, yPosition + 10);
      yPosition += 25;
      
      // Área da assinatura
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.rect(20, yPosition, 170, 40, 'FD');
      
      try {
        const processedSignature = processImageForPDF(service.signatures.client);
        if (processedSignature) {
          doc.addImage(processedSignature, 'PNG', 30, yPosition + 5, 150, 30);
          console.log("Assinatura do cliente adicionada ao PDF");
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("Erro ao processar assinatura do cliente:", error);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(10);
        doc.text("Erro ao carregar assinatura", 105, yPosition + 20, { align: "center" });
      }
      
      yPosition += 50;
    }

    // Assinatura do Técnico
    if (service.signatures.technician) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 30;
      }
      
      yPosition = addSection("ASSINATURA DO TECNICO", yPosition);
      
      addInfoLine("Tecnico", service.technician?.name || "N/A", 20, yPosition);
      addInfoLine("Data", formatDate(new Date().toISOString()), 20, yPosition + 10);
      yPosition += 25;
      
      // Área da assinatura
      doc.setFillColor(colors.white[0], colors.white[1], colors.white[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.rect(20, yPosition, 170, 40, 'FD');
      
      try {
        const processedSignature = processImageForPDF(service.signatures.technician);
        if (processedSignature) {
          doc.addImage(processedSignature, 'PNG', 30, yPosition + 5, 150, 30);
          console.log("Assinatura do técnico adicionada ao PDF");
        } else {
          throw new Error('Assinatura não pôde ser processada');
        }
      } catch (error) {
        console.error("Erro ao processar assinatura do técnico:", error);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(10);
        doc.text("Erro ao carregar assinatura", 105, yPosition + 20, { align: "center" });
      }
      
      yPosition += 50;
    }
  } else {
    // Áreas para assinaturas em branco
    yPosition = addSection("AREA PARA ASSINATURAS", yPosition);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text("Cliente:", 20, yPosition);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.line(45, yPosition, 100, yPosition);
    doc.text("Data:", 120, yPosition);
    doc.line(140, yPosition, 180, yPosition);
    yPosition += 25;

    doc.text("Tecnico:", 20, yPosition);
    doc.line(45, yPosition, 100, yPosition);
    doc.text("Data:", 120, yPosition);
    doc.line(140, yPosition, 180, yPosition);
  }

  // Adicionar numeração das páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha no rodapé
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.3);
    doc.line(20, 285, 190, 285);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(safeText("Gerado em: " + formatDate(new Date().toISOString())), 20, 290);
    doc.text(`Pagina ${i} de ${pageCount}`, 170, 290);
  }

  // Salvar o PDF
  const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
  doc.save(fileName);
  console.log("PDF gerado com sucesso:", fileName);
};
