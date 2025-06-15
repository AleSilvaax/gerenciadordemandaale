
import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
import { formatDate } from "./formatters";

export const generateDetailedServiceReport = async (service: Service): Promise<void> => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Configurar fonte padrão para evitar problemas de codificação
  doc.setFont("helvetica");
  
  // Cores modernas
  const colors = {
    primary: [51, 65, 85],     // slate-700
    secondary: [100, 116, 139], // slate-500
    accent: [59, 130, 246],    // blue-500
    success: [34, 197, 94],    // green-500
    warning: [245, 158, 11],   // amber-500
    error: [239, 68, 68],      // red-500
    light: [248, 250, 252],    // slate-50
    border: [203, 213, 225],   // slate-300
    text: [15, 23, 42]         // slate-900
  };

  // Função para adicionar cabeçalho elegante
  const addHeader = (title: string, y: number) => {
    // Fundo do cabeçalho
    doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.rect(0, y, 210, 25, 'F');
    
    // Linha decorativa
    doc.setFillColor(colors.accent[0], colors.accent[1], colors.accent[2]);
    doc.rect(0, y + 22, 210, 3, 'F');
    
    // Título
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(title, 105, y + 15, { align: "center" });
    
    return y + 35;
  };

  // Função para adicionar seção com card
  const addCard = (title: string, y: number, content: () => number, icon = "") => {
    // Card background
    doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
    doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
    doc.setLineWidth(0.5);
    doc.roundedRect(15, y, 180, 20, 2, 2, 'FD');
    
    // Título da seção
    doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text(`${icon} ${title}`, 20, y + 12);
    
    // Conteúdo
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.setFont("helvetica", "normal");
    return content();
  };

  // Função para adicionar linha de informação
  const addInfoLine = (label: string, value: string, x: number, y: number, bold = false) => {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
    doc.text(`${label}:`, x, y);
    
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
    doc.text(value, x + 35, y);
  };

  // Função para converter imagem para base64
  const loadImageAsBase64 = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (ctx) {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataURL);
          } else {
            reject(new Error('Canvas context not available'));
          }
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = url;
    });
  };

  // PÁGINA 1 - CAPA
  yPosition = addHeader("RELATORIO DE DEMANDA", 30);
  
  // Card principal
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setLineWidth(1);
  doc.roundedRect(25, yPosition, 160, 120, 5, 5, 'FD');

  // Informações da capa
  let cardY = yPosition + 20;
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.text(service.title || "Demanda", 105, cardY, { align: "center" });
  
  cardY += 20;
  doc.setFontSize(12);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
  doc.text(`Numero: ${service.number || service.id.substring(0, 8)}`, 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setFontSize(11);
  doc.text(`Cliente: ${service.client || "Nao informado"}`, 105, cardY, { align: "center" });
  
  cardY += 12;
  doc.text(`Tecnico: ${service.technician?.name || "Nao atribuido"}`, 105, cardY, { align: "center" });
  
  cardY += 12;
  const statusText = service.status === "concluido" ? "Concluido" : 
                    service.status === "cancelado" ? "Cancelado" : "Pendente";
  const statusColor = service.status === "concluido" ? colors.success :
                     service.status === "cancelado" ? colors.error : colors.warning;
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${statusText}`, 105, cardY, { align: "center" });
  
  cardY += 15;
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Criacao: ${service.creationDate ? formatDate(service.creationDate) : "N/A"}`, 105, cardY, { align: "center" });

  // Rodapé da capa
  doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
  doc.setFontSize(9);
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 105, 260, { align: "center" });
  doc.text("Sistema de Gestao de Demandas", 105, 270, { align: "center" });

  // PÁGINA 2 - DETALHES
  doc.addPage();
  yPosition = addHeader("INFORMACOES DETALHADAS", 20);

  // Dados Gerais
  yPosition = addCard("DADOS GERAIS", yPosition, () => {
    let currentY = yPosition + 30;
    
    addInfoLine("Numero", service.number || "N/A", 20, currentY);
    addInfoLine("Prioridade", service.priority || "Media", 110, currentY);
    currentY += 10;
    
    addInfoLine("Localizacao", service.location || "N/A", 20, currentY);
    addInfoLine("Tipo", service.serviceType || "N/A", 110, currentY);
    currentY += 10;
    
    addInfoLine("Criacao", service.creationDate ? formatDate(service.creationDate) : "N/A", 20, currentY);
    addInfoLine("Vencimento", service.dueDate ? formatDate(service.dueDate) : "N/A", 110, currentY);
    
    return currentY + 20;
  }, "📋");

  // Descrição
  if (service.description) {
    yPosition = addCard("DESCRICAO", yPosition, () => {
      let currentY = yPosition + 30;
      doc.setFontSize(10);
      const splitDescription = doc.splitTextToSize(service.description, 170);
      doc.text(splitDescription, 20, currentY);
      return currentY + splitDescription.length * 5 + 15;
    }, "📝");
  }

  // Campos Personalizados
  if (service.customFields && service.customFields.length > 0) {
    if (yPosition > 200) {
      doc.addPage();
      yPosition = addHeader("CAMPOS PERSONALIZADOS", 20);
    }

    yPosition = addCard("CAMPOS PERSONALIZADOS", yPosition, () => {
      let currentY = yPosition + 30;
      
      service.customFields!.forEach((field: CustomField) => {
        if (currentY > 260) {
          doc.addPage();
          currentY = 30;
        }

        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.text(`${field.label}:`, 20, currentY);
        
        doc.setFont("helvetica", "normal");
        doc.setTextColor(colors.text[0], colors.text[1], colors.text[2]);
        
        let valueText = "";
        if (field.type === 'boolean') {
          valueText = field.value ? "Sim" : "Nao";
        } else {
          valueText = String(field.value || "N/A");
        }

        if (field.type === 'textarea' && valueText.length > 50) {
          const splitText = doc.splitTextToSize(valueText, 150);
          doc.text(splitText, 70, currentY);
          currentY += splitText.length * 5 + 5;
        } else {
          doc.text(valueText, 70, currentY);
          currentY += 8;
        }
      });

      return currentY + 10;
    }, "⚙️");
  }

  // PÁGINA DE FOTOS
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
      
      // Card da foto
      doc.setFillColor(colors.light[0], colors.light[1], colors.light[2]);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.roundedRect(15, yPosition, 180, 100, 3, 3, 'FD');
      
      // Título da foto
      doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`📸 ${photoTitle}`, 20, yPosition + 15);

      try {
        console.log(`Carregando foto ${photoIndex + 1}:`, photoUrl);
        const imageData = await loadImageAsBase64(photoUrl);
        doc.addImage(imageData, 'JPEG', 25, yPosition + 25, 160, 60);
        console.log(`Foto ${photoIndex + 1} adicionada com sucesso`);
      } catch (error) {
        console.error(`Erro ao carregar foto ${photoIndex + 1}:`, error);
        // Placeholder para foto não carregada
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.rect(25, yPosition + 25, 160, 60);
        doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
        doc.setFontSize(10);
        doc.text("Foto nao disponivel", 105, yPosition + 55, { align: "center" });
      }

      yPosition += 110;
    }
  }

  // PÁGINA DE ASSINATURAS
  doc.addPage();
  yPosition = addHeader("ASSINATURAS E APROVACOES", 20);

  if (service.signatures?.client || service.signatures?.technician) {
    // Assinatura do Cliente
    if (service.signatures.client) {
      yPosition = addCard("ASSINATURA DO CLIENTE", yPosition, () => {
        let currentY = yPosition + 30;
        
        addInfoLine("Cliente", service.client || "N/A", 20, currentY);
        addInfoLine("Data", formatDate(new Date().toISOString()), 20, currentY + 10);
        currentY += 25;
        
        // Área da assinatura
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(20, currentY, 170, 50, 3, 3, 'FD');
        
        try {
          if (service.signatures!.client!.startsWith('data:image')) {
            doc.addImage(service.signatures!.client!, 'PNG', 30, currentY + 5, 150, 40);
            console.log("Assinatura do cliente adicionada ao PDF");
          }
        } catch (error) {
          console.error("Erro ao processar assinatura do cliente:", error);
          doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
          doc.setFontSize(10);
          doc.text("Erro ao carregar assinatura", 105, currentY + 25, { align: "center" });
        }
        
        return currentY + 60;
      }, "✍️");
    }

    // Assinatura do Técnico
    if (service.signatures.technician) {
      yPosition = addCard("ASSINATURA DO TECNICO", yPosition, () => {
        let currentY = yPosition + 30;
        
        addInfoLine("Tecnico", service.technician?.name || "N/A", 20, currentY);
        addInfoLine("Data", formatDate(new Date().toISOString()), 20, currentY + 10);
        currentY += 25;
        
        // Área da assinatura
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
        doc.roundedRect(20, currentY, 170, 50, 3, 3, 'FD');
        
        try {
          if (service.signatures!.technician!.startsWith('data:image')) {
            doc.addImage(service.signatures!.technician!, 'PNG', 30, currentY + 5, 150, 40);
            console.log("Assinatura do técnico adicionada ao PDF");
          }
        } catch (error) {
          console.error("Erro ao processar assinatura do técnico:", error);
          doc.setTextColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
          doc.setFontSize(10);
          doc.text("Erro ao carregar assinatura", 105, currentY + 25, { align: "center" });
        }
        
        return currentY + 60;
      }, "🔧");
    }
  } else {
    // Áreas para assinaturas em branco
    yPosition = addCard("AREA PARA ASSINATURAS", yPosition, () => {
      let currentY = yPosition + 35;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.text("Cliente:", 20, currentY);
      doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
      doc.line(45, currentY, 100, currentY);
      doc.text("Data:", 120, currentY);
      doc.line(140, currentY, 180, currentY);
      currentY += 30;

      doc.text("Tecnico:", 20, currentY);
      doc.line(45, currentY, 100, currentY);
      doc.text("Data:", 120, currentY);
      doc.line(140, currentY, 180, currentY);
      
      return currentY + 25;
    }, "📝");
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
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 20, 290);
    doc.text(`Pagina ${i} de ${pageCount}`, 170, 290);
  }

  // Salvar o PDF
  const fileName = `relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`;
  doc.save(fileName);
  console.log("PDF gerado com sucesso:", fileName);
};
