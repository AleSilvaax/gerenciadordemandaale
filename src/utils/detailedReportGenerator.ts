
import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
import { formatDate } from "./formatters";

export const generateDetailedServiceReport = (service: Service): void => {
  const doc = new jsPDF();
  let yPosition = 20;

  // Configurar fonte
  doc.setFontSize(12);

  // CAPA DO RELATÓRIO
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text("RELATÓRIO DE SERVIÇO", 105, 60, { align: "center" });
  
  doc.setFontSize(16);
  doc.setFont("helvetica", "normal");
  doc.text(`Demanda #${service.number || service.id}`, 105, 80, { align: "center" });
  
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(service.title, 105, 100, { align: "center" });

  // Logo/Header da empresa (placeholder)
  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("SISTEMA DE GESTÃO DE DEMANDAS", 105, 140, { align: "center" });
  
  // Informações da capa
  doc.setFontSize(12);
  doc.text(`Data de Geração: ${formatDate(new Date().toISOString())}`, 105, 200, { align: "center" });
  doc.text(`Cliente: ${service.client || "N/A"}`, 105, 215, { align: "center" });
  doc.text(`Técnico: ${service.technician?.name || "Não atribuído"}`, 105, 230, { align: "center" });
  doc.text(`Status: ${getStatusText(service.status)}`, 105, 245, { align: "center" });

  // Rodapé da capa
  doc.setFontSize(10);
  doc.text("Documento gerado automaticamente pelo sistema", 105, 270, { align: "center" });

  // NOVA PÁGINA - DETALHES DO SERVIÇO
  doc.addPage();
  yPosition = 20;

  // Título principal
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text("DETALHES DA DEMANDA", 105, yPosition, { align: "center" });
  yPosition += 15;

  // Linha separadora
  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 10;

  // Informações básicas do serviço
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("INFORMAÇÕES GERAIS", 20, yPosition);
  yPosition += 8;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");

  const basicInfo = [
    { label: "Número da Demanda:", value: service.number || "N/A" },
    { label: "Título:", value: service.title },
    { label: "Localização:", value: service.location },
    { label: "Cliente:", value: service.client || "N/A" },
    { label: "Status:", value: getStatusText(service.status) },
    { label: "Prioridade:", value: getPriorityText(service.priority) },
    { label: "Data de Criação:", value: service.creationDate ? formatDate(service.creationDate) : "N/A" },
    { label: "Data de Vencimento:", value: service.dueDate ? formatDate(service.dueDate) : "N/A" },
    { label: "Técnico Responsável:", value: service.technician?.name || "Não atribuído" },
    { label: "Tipo de Serviço:", value: service.serviceType || "N/A" },
  ];

  basicInfo.forEach(info => {
    doc.setFont("helvetica", "bold");
    doc.text(info.label, 20, yPosition);
    doc.setFont("helvetica", "normal");
    doc.text(info.value, 80, yPosition);
    yPosition += 6;
  });

  // Descrição
  if (service.description) {
    yPosition += 5;
    doc.setFont("helvetica", "bold");
    doc.text("DESCRIÇÃO:", 20, yPosition);
    yPosition += 6;
    doc.setFont("helvetica", "normal");
    
    const splitDescription = doc.splitTextToSize(service.description, 170);
    doc.text(splitDescription, 20, yPosition);
    yPosition += splitDescription.length * 5 + 5;
  }

  // Campos Personalizados
  if (service.customFields && service.customFields.length > 0) {
    // Verificar se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("CAMPOS PERSONALIZADOS", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    service.customFields.forEach((field: CustomField) => {
      if (yPosition > 270) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFont("helvetica", "bold");
      doc.text(`${field.label}:`, 20, yPosition);
      doc.setFont("helvetica", "normal");
      
      let valueText = "";
      if (field.type === 'boolean') {
        valueText = field.value ? "Sim" : "Não";
      } else {
        valueText = String(field.value || "N/A");
      }

      // Para campos de texto longo, dividir em múltiplas linhas
      if (field.type === 'textarea' && valueText.length > 50) {
        const splitText = doc.splitTextToSize(valueText, 120);
        doc.text(splitText, 80, yPosition);
        yPosition += splitText.length * 5;
      } else {
        doc.text(valueText, 80, yPosition);
        yPosition += 6;
      }
    });
  }

  // Seção de Fotos
  if (service.photos && service.photos.length > 0) {
    doc.addPage();
    yPosition = 20;

    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("ANEXOS FOTOGRÁFICOS", 105, yPosition, { align: "center" });
    yPosition += 15;

    doc.setLineWidth(0.5);
    doc.line(20, yPosition, 190, yPosition);
    yPosition += 15;

    service.photos.forEach((photoUrl, index) => {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      // Título da foto
      const photoTitle = service.photoTitles?.[index] || `Foto ${index + 1}`;
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(photoTitle, 20, yPosition);
      yPosition += 10;

      // Placeholder para a imagem (em uma implementação real, você carregaria a imagem)
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.rect(20, yPosition, 170, 80);
      doc.text("Imagem anexada ao relatório", 105, yPosition + 40, { align: "center" });
      doc.text(`URL: ${photoUrl}`, 25, yPosition + 50);
      
      yPosition += 90;
    });
  }

  // Notas adicionais
  if (service.notes) {
    // Verificar se precisa de nova página
    if (yPosition > 250) {
      doc.addPage();
      yPosition = 20;
    }

    yPosition += 5;
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("OBSERVAÇÕES", 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const splitNotes = doc.splitTextToSize(service.notes, 170);
    doc.text(splitNotes, 20, yPosition);
    yPosition += splitNotes.length * 5 + 10;
  }

  // NOVA PÁGINA - ASSINATURAS
  doc.addPage();
  yPosition = 20;

  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("ASSINATURAS E APROVAÇÕES", 105, yPosition, { align: "center" });
  yPosition += 15;

  doc.setLineWidth(0.5);
  doc.line(20, yPosition, 190, yPosition);
  yPosition += 20;

  // Seção de Assinaturas
  if (service.signatures?.client || service.signatures?.technician) {
    // Assinatura do Cliente
    if (service.signatures.client) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ASSINATURA DO CLIENTE", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Cliente: ${service.client || "N/A"}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Data: ${formatDate(new Date().toISOString())}`, 20, yPosition);
      yPosition += 15;
      
      // Área para assinatura
      doc.rect(20, yPosition, 80, 30);
      doc.setFontSize(8);
      doc.text("Assinatura registrada digitalmente", 25, yPosition + 20);
      yPosition += 45;
    }

    // Assinatura do Técnico
    if (service.signatures.technician) {
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text("ASSINATURA DO TÉCNICO", 20, yPosition);
      yPosition += 10;
      
      doc.setFont("helvetica", "normal");
      doc.text(`Técnico: ${service.technician?.name || "N/A"}`, 20, yPosition);
      yPosition += 8;
      doc.text(`Data: ${formatDate(new Date().toISOString())}`, 20, yPosition);
      yPosition += 15;
      
      // Área para assinatura
      doc.rect(20, yPosition, 80, 30);
      doc.setFontSize(8);
      doc.text("Assinatura registrada digitalmente", 25, yPosition + 20);
      yPosition += 45;
    }
  } else {
    // Áreas em branco para assinaturas manuais
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("ÁREA PARA ASSINATURAS", 20, yPosition);
    yPosition += 20;

    doc.setFont("helvetica", "normal");
    doc.text("Cliente:", 20, yPosition);
    doc.line(40, yPosition, 100, yPosition);
    doc.text("Data:", 120, yPosition);
    doc.line(135, yPosition, 180, yPosition);
    yPosition += 25;

    doc.text("Técnico:", 20, yPosition);
    doc.line(40, yPosition, 100, yPosition);
    doc.text("Data:", 120, yPosition);
    doc.line(135, yPosition, 180, yPosition);
  }

  // Rodapé em todas as páginas
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.text(
      `Relatório gerado em: ${formatDate(new Date().toISOString())}`,
      20,
      285
    );
    doc.text(`Página ${i} de ${pageCount}`, 150, 285);
  }

  // Salvar o PDF
  const fileName = `relatorio-servico-${service.number || service.id}.pdf`;
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
