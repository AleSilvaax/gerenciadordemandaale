
import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
import { formatDate } from "./formatters";

export const generateDetailedServiceReport = (service: Service): void => {
  const doc = new jsPDF();
  let yPosition = 20;
  
  // Cores do tema
  const primaryColor = [75, 58, 172]; // #4B3AAC
  const secondaryColor = [99, 102, 241]; // #6366F1
  const accentColor = [168, 85, 247]; // #A855F7
  const textColor = [31, 41, 55]; // #1F2937
  const lightGray = [243, 244, 246]; // #F3F4F6
  const darkGray = [107, 114, 128]; // #6B7280

  // Função para adicionar header gradiente
  const addGradientHeader = (title: string, y: number, height: number = 15) => {
    // Simulação de gradiente com retângulos
    for (let i = 0; i < height; i++) {
      const alpha = 1 - (i / height) * 0.3;
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setGlobalAlpha(alpha);
      doc.rect(0, y + i, 210, 1, 'F');
    }
    doc.setGlobalAlpha(1);
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text(title, 105, y + 10, { align: "center" });
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  };

  // Função para adicionar seção com bordas arredondadas
  const addSection = (title: string, y: number, content: () => number) => {
    doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
    doc.roundedRect(15, y, 180, 20, 3, 3, 'F');
    
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(title, 20, y + 12);
    
    doc.setTextColor(textColor[0], textColor[1], textColor[2]);
    return content();
  };

  // Função para placeholder de foto (movida para antes do uso)
  const addPhotoPlaceholder = (x: number, y: number, w: number, h: number, url: string) => {
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(1);
    doc.rect(x, y, w, h);
    
    doc.setFontSize(10);
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text("📷 Imagem anexada", x + w/2, y + h/2 - 5, { align: "center" });
    doc.setFontSize(8);
    doc.text(url.substring(0, 50) + "...", x + 5, y + h/2 + 5);
  };

  // CAPA MODERNA
  // Cabeçalho com gradiente
  addGradientHeader("RELATÓRIO DE DEMANDA", 30, 20);
  
  // Card principal da capa
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(2);
  doc.roundedRect(30, 70, 150, 100, 5, 5, 'FD');

  // Informações principais da capa
  yPosition = 85;
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.text(service.title, 105, yPosition, { align: "center" });
  
  yPosition += 15;
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(`Demanda #${service.number || service.id.slice(0, 8)}`, 105, yPosition, { align: "center" });
  
  yPosition += 12;
  doc.setFontSize(11);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.text(`Cliente: ${service.client || "N/A"}`, 105, yPosition, { align: "center" });
  
  yPosition += 10;
  doc.text(`Técnico: ${service.technician?.name || "Não atribuído"}`, 105, yPosition, { align: "center" });
  
  yPosition += 10;
  const statusText = getStatusText(service.status);
  const statusColor = getStatusColorRGB(service.status);
  doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.setFont("helvetica", "bold");
  doc.text(`Status: ${statusText}`, 105, yPosition, { align: "center" });

  // Rodapé da capa
  doc.setFontSize(10);
  doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
  doc.setFont("helvetica", "normal");
  doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, 105, 260, { align: "center" });
  doc.text("Sistema de Gestão de Demandas", 105, 270, { align: "center" });

  // PÁGINA 2 - DETALHES
  doc.addPage();
  yPosition = 20;

  addGradientHeader("INFORMAÇÕES DETALHADAS", yPosition, 12);
  yPosition += 25;

  // Seção de informações básicas
  yPosition = addSection("📋 DADOS GERAIS", yPosition, () => {
    let currentY = yPosition + 25;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");

    const basicInfo = [
      { label: "Número:", value: service.number || "N/A", icon: "🔢" },
      { label: "Localização:", value: service.location, icon: "📍" },
      { label: "Prioridade:", value: getPriorityText(service.priority), icon: "⚡" },
      { label: "Criação:", value: service.creationDate ? formatDate(service.creationDate) : "N/A", icon: "📅" },
      { label: "Vencimento:", value: service.dueDate ? formatDate(service.dueDate) : "N/A", icon: "⏰" },
      { label: "Tipo:", value: service.serviceType || "N/A", icon: "🔧" },
    ];

    basicInfo.forEach((info, index) => {
      const x = index % 2 === 0 ? 20 : 110;
      const y = currentY + Math.floor(index / 2) * 8;
      
      doc.setFont("helvetica", "bold");
      doc.text(`${info.icon} ${info.label}`, x, y);
      doc.setFont("helvetica", "normal");
      doc.text(info.value, x + 35, y);
    });

    return currentY + Math.ceil(basicInfo.length / 2) * 8 + 10;
  });

  // Descrição
  if (service.description) {
    yPosition = addSection("📝 DESCRIÇÃO", yPosition, () => {
      let currentY = yPosition + 25;
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      
      const splitDescription = doc.splitTextToSize(service.description, 170);
      doc.text(splitDescription, 20, currentY);
      return currentY + splitDescription.length * 5 + 10;
    });
  }

  // Campos Personalizados
  if (service.customFields && service.customFields.length > 0) {
    if (yPosition > 220) {
      doc.addPage();
      yPosition = 20;
      addGradientHeader("CAMPOS PERSONALIZADOS", yPosition, 12);
      yPosition += 25;
    }

    yPosition = addSection("⚙️ CAMPOS PERSONALIZADOS", yPosition, () => {
      let currentY = yPosition + 25;
      doc.setFontSize(10);

      service.customFields!.forEach((field: CustomField) => {
        if (currentY > 270) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFont("helvetica", "bold");
        doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.text(`🔹 ${field.label}:`, 20, currentY);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
        
        let valueText = "";
        if (field.type === 'boolean') {
          valueText = field.value ? "✅ Sim" : "❌ Não";
        } else {
          valueText = String(field.value || "N/A");
        }

        if (field.type === 'textarea' && valueText.length > 60) {
          const splitText = doc.splitTextToSize(valueText, 150);
          doc.text(splitText, 20, currentY + 6);
          currentY += splitText.length * 5 + 8;
        } else {
          doc.text(valueText, 70, currentY);
          currentY += 8;
        }
      });

      return currentY + 10;
    });
  }

  // PÁGINA DE FOTOS
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = 20;

    addGradientHeader("ANEXOS FOTOGRÁFICOS", yPosition, 12);
    yPosition += 25;

    let photoIndex = 0;
    for (const photoUrl of service.photos) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
      
      // Card para a foto
      doc.setFillColor(lightGray[0], lightGray[1], lightGray[2]);
      doc.roundedRect(15, yPosition, 180, 80, 3, 3, 'F');
      
      // Título da foto
      doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`📸 ${photoTitle}`, 20, yPosition + 12);

      try {
        // Tentar carregar e inserir a imagem real
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          try {
            // Criar canvas para converter a imagem
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (ctx) {
              canvas.width = img.width;
              canvas.height = img.height;
              ctx.drawImage(img, 0, 0);
              
              const imgData = canvas.toDataURL('image/jpeg', 0.8);
              doc.addImage(imgData, 'JPEG', 20, yPosition + 20, 170, 50);
            }
          } catch (error) {
            console.error("Erro ao processar imagem:", error);
            // Fallback para placeholder
            addPhotoPlaceholder(20, yPosition + 20, 170, 50, photoUrl);
          }
        };
        img.onerror = () => {
          addPhotoPlaceholder(20, yPosition + 20, 170, 50, photoUrl);
        };
        img.src = photoUrl;
        
        // Placeholder imediato enquanto carrega
        addPhotoPlaceholder(20, yPosition + 20, 170, 50, photoUrl);
        
      } catch (error) {
        addPhotoPlaceholder(20, yPosition + 20, 170, 50, photoUrl);
      }

      yPosition += 90;
      photoIndex++;
    }
  }

  // PÁGINA DE ASSINATURAS
  doc.addPage();
  yPosition = 20;

  addGradientHeader("ASSINATURAS E APROVAÇÕES", yPosition, 12);
  yPosition += 25;

  if (service.signatures?.client || service.signatures?.technician) {
    // Assinatura do Cliente
    if (service.signatures.client) {
      yPosition = addSection("✍️ ASSINATURA DO CLIENTE", yPosition, () => {
        let currentY = yPosition + 25;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Cliente: ${service.client || "N/A"}`, 20, currentY);
        currentY += 8;
        doc.text(`Data: ${formatDate(new Date().toISOString())}`, 20, currentY);
        currentY += 15;
        
        // Área da assinatura
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, currentY, 170, 40, 3, 3, 'FD');
        
        try {
          if (service.signatures!.client!.startsWith('data:image')) {
            doc.addImage(service.signatures!.client!, 'PNG', 25, currentY + 5, 160, 30);
          } else {
            doc.setFontSize(9);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.text("✅ Assinatura registrada digitalmente", 25, currentY + 20);
          }
        } catch (error) {
          doc.setFontSize(9);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text("✅ Assinatura registrada digitalmente", 25, currentY + 20);
        }
        
        return currentY + 50;
      });
    }

    // Assinatura do Técnico
    if (service.signatures.technician) {
      yPosition = addSection("🔧 ASSINATURA DO TÉCNICO", yPosition, () => {
        let currentY = yPosition + 25;
        
        doc.setFontSize(11);
        doc.setFont("helvetica", "normal");
        doc.text(`Técnico: ${service.technician?.name || "N/A"}`, 20, currentY);
        currentY += 8;
        doc.text(`Data: ${formatDate(new Date().toISOString())}`, 20, currentY);
        currentY += 15;
        
        // Área da assinatura
        doc.setFillColor(255, 255, 255);
        doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.roundedRect(20, currentY, 170, 40, 3, 3, 'FD');
        
        try {
          if (service.signatures!.technician!.startsWith('data:image')) {
            doc.addImage(service.signatures!.technician!, 'PNG', 25, currentY + 5, 160, 30);
          } else {
            doc.setFontSize(9);
            doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
            doc.text("✅ Assinatura registrada digitalmente", 25, currentY + 20);
          }
        } catch (error) {
          doc.setFontSize(9);
          doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
          doc.text("✅ Assinatura registrada digitalmente", 25, currentY + 20);
        }
        
        return currentY + 50;
      });
    }
  } else {
    // Áreas em branco para assinaturas
    yPosition = addSection("📝 ÁREA PARA ASSINATURAS", yPosition, () => {
      let currentY = yPosition + 30;

      doc.setFont("helvetica", "bold");
      doc.text("Cliente:", 20, currentY);
      doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.line(40, currentY, 100, currentY);
      doc.text("Data:", 120, currentY);
      doc.line(135, currentY, 180, currentY);
      currentY += 25;

      doc.text("Técnico:", 20, currentY);
      doc.line(40, currentY, 100, currentY);
      doc.text("Data:", 120, currentY);
      doc.line(135, currentY, 180, currentY);
      
      return currentY + 20;
    });
  }

  // Rodapé moderno em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    
    // Linha decorativa no rodapé
    doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setLineWidth(0.5);
    doc.line(20, 280, 190, 280);
    
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(darkGray[0], darkGray[1], darkGray[2]);
    doc.text(
      `📄 Relatório gerado em: ${formatDate(new Date().toISOString())}`,
      20,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 150, 285);
  }

  // Salvar o PDF
  const fileName = `relatorio-demanda-${service.number || service.id.slice(0, 8)}.pdf`;
  doc.save(fileName);
};

const getStatusText = (status: string): string => {
  switch (status) {
    case "pendente":
      return "Pendente";
    case "concluido":
      return "Concluído";
    case "cancelado":
      return "Cancelado";
    default:
      return status;
  }
};

const getStatusColorRGB = (status: string): [number, number, number] => {
  switch (status) {
    case "concluido":
      return [34, 197, 94]; // green-500
    case "cancelado":
      return [239, 68, 68]; // red-500
    default:
      return [249, 115, 22]; // orange-500
  }
};

const getPriorityText = (priority?: string): string => {
  switch (priority) {
    case "baixa":
      return "Baixa";
    case "media":
      return "Média";
    case "alta":
      return "Alta";
    case "urgente":
      return "Urgente";
    default:
      return "Média";
  }
};
