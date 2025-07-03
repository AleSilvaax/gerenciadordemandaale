import { jsPDF } from "jspdf";
import { Service, CustomField } from "@/types/serviceTypes";
import { formatDate } from "../formatters";
import { processImageForPDF, calculateImageDimensions } from './imageProcessor';
import { safeText } from './textUtils';

// Cores modernas e elegantes
const COLORS = {
  primary: [41, 98, 184], // Azul profissional
  secondary: [99, 102, 241], // Índigo moderno  
  accent: [16, 185, 129], // Verde elegante
  text: [31, 41, 55], // Cinza escuro
  textLight: [107, 114, 128], // Cinza médio
  background: [248, 250, 252], // Cinza muito claro
  white: [255, 255, 255],
  border: [229, 231, 235]
} as const;

class ModernPdfReportGenerator {
  private doc: jsPDF;
  private pageWidth: number = 210;
  private pageHeight: number = 297;
  private margin: number = 20;
  private currentY: number = 0;

  constructor() {
    this.doc = new jsPDF();
    this.setupDocument();
  }

  private setupDocument() {
    this.doc.setFont("helvetica");
    this.currentY = this.margin;
  }

  private addPageHeader() {
    // Cabeçalho moderno com gradiente visual
    this.doc.setFillColor(...COLORS.primary);
    this.doc.rect(0, 0, this.pageWidth, 25, 'F');
    
    // Logo/Marca (placeholder)
    this.doc.setFillColor(...COLORS.white);
    this.doc.circle(15, 12.5, 8, 'F');
    this.doc.setTextColor(...COLORS.primary);
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("S", 15, 15, { align: "center" });
    
    // Título do sistema
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFontSize(16);
    this.doc.text("Sistema de Demandas", 30, 15);
    
    // Data atual
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, this.pageWidth - this.margin, 15, { align: "right" });
    
    this.currentY = 40;
  }

  private addSectionHeader(title: string, icon?: string) {
    // Espaçamento antes da seção
    this.currentY += 10;
    
    // Linha decorativa
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.5);
    this.doc.line(this.margin, this.currentY, this.pageWidth - this.margin, this.currentY);
    
    this.currentY += 8;
    
    // Título da seção
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(14);
    this.doc.setTextColor(...COLORS.primary);
    
    if (icon) {
      // Ícone placeholder
      this.doc.setFillColor(...COLORS.secondary);
      this.doc.circle(this.margin + 5, this.currentY + 2, 3, 'F');
      this.doc.setTextColor(...COLORS.white);
      this.doc.setFontSize(8);
      this.doc.text(icon, this.margin + 5, this.currentY + 3, { align: "center" });
      
      this.doc.setTextColor(...COLORS.primary);
      this.doc.setFontSize(14);
      this.doc.text(title, this.margin + 15, this.currentY + 4);
    } else {
      this.doc.text(title, this.margin, this.currentY + 4);
    }
    
    this.currentY += 15;
  }

  private addInfoBox(label: string, value: string, fullWidth: boolean = true) {
    const boxHeight = 12;
    const labelWidth = fullWidth ? 60 : 40;
    const valueWidth = fullWidth ? (this.pageWidth - 2 * this.margin - 10) : 80;
    
    // Background do box
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(this.margin, this.currentY, fullWidth ? (this.pageWidth - 2 * this.margin) : 140, boxHeight, 'F');
    
    // Borda sutil
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, this.currentY, fullWidth ? (this.pageWidth - 2 * this.margin) : 140, boxHeight);
    
    // Label
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(label.toUpperCase(), this.margin + 5, this.currentY + 4);
    
    // Valor
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.text);
    const wrappedText = this.doc.splitTextToSize(value, valueWidth);
    this.doc.text(wrappedText, this.margin + 5, this.currentY + 8);
    
    this.currentY += Math.max(boxHeight, wrappedText.length * 4 + 8) + 3;
  }

  private addTwoColumnInfo(label1: string, value1: string, label2: string, value2: string) {
    const boxHeight = 12;
    const columnWidth = (this.pageWidth - 2 * this.margin - 5) / 2;
    
    // Primeira coluna
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(this.margin, this.currentY, columnWidth, boxHeight, 'F');
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.rect(this.margin, this.currentY, columnWidth, boxHeight);
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(label1.toUpperCase(), this.margin + 3, this.currentY + 4);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(value1, this.margin + 3, this.currentY + 8);
    
    // Segunda coluna
    const secondColumnX = this.margin + columnWidth + 5;
    this.doc.setFillColor(...COLORS.background);
    this.doc.rect(secondColumnX, this.currentY, columnWidth, boxHeight, 'F');
    this.doc.rect(secondColumnX, this.currentY, columnWidth, boxHeight);
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(9);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(label2.toUpperCase(), secondColumnX + 3, this.currentY + 4);
    
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(10);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(value2, secondColumnX + 3, this.currentY + 8);
    
    this.currentY += boxHeight + 5;
  }

  private addStatusBadge(status: string) {
    let badgeColor: readonly [number, number, number] = COLORS.textLight;
    let statusText = status.toUpperCase();
    
    switch (status) {
      case 'concluido':
        badgeColor = COLORS.accent;
        statusText = 'CONCLUÍDO';
        break;
      case 'pendente':
        badgeColor = COLORS.secondary;
        statusText = 'PENDENTE';
        break;
      case 'cancelado':
        badgeColor = [239, 68, 68] as const; // Vermelho
        statusText = 'CANCELADO';
        break;
    }
    
    this.doc.setFillColor(...badgeColor);
    this.doc.roundedRect(this.margin, this.currentY, 40, 8, 2, 2, 'F');
    
    this.doc.setTextColor(...COLORS.white);
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(8);
    this.doc.text(statusText, this.margin + 20, this.currentY + 5, { align: "center" });
    
    this.currentY += 15;
  }

  private async addPhoto(photoUrl: string, title: string) {
    // Verifica se precisa de nova página
    if (this.currentY > 200) {
      this.doc.addPage();
      this.addPageHeader();
    }

    try {
      console.log('[PDF] Processando foto:', photoUrl);
      
      // Header da foto
      this.doc.setFont("helvetica", "bold");
      this.doc.setFontSize(12);
      this.doc.setTextColor(...COLORS.text);
      this.doc.text(title, this.margin, this.currentY);
      this.currentY += 8;
      
      // Processar imagem
      const processedImage = await processImageForPDF(photoUrl);
      
      if (processedImage) {
        const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
        const { width, height } = calculateImageDimensions(processedImage);
        
        // Ajustar tamanho para o layout moderno
        const maxWidth = this.pageWidth - 2 * this.margin;
        const maxHeight = 80;
        
        let finalWidth = Math.min(width, maxWidth);
        let finalHeight = (finalWidth / width) * height;
        
        if (finalHeight > maxHeight) {
          finalHeight = maxHeight;
          finalWidth = (finalHeight / height) * width;
        }
        
        // Centralizar imagem
        const xPosition = this.margin + (maxWidth - finalWidth) / 2;
        
        // Background branco para a imagem
        this.doc.setFillColor(...COLORS.white);
        this.doc.rect(xPosition - 2, this.currentY - 2, finalWidth + 4, finalHeight + 4, 'F');
        
        // Borda elegante
        this.doc.setDrawColor(...COLORS.border);
        this.doc.setLineWidth(0.5);
        this.doc.rect(xPosition - 2, this.currentY - 2, finalWidth + 4, finalHeight + 4);
        
        // Adicionar imagem
        this.doc.addImage(processedImage, imageFormat, xPosition, this.currentY, finalWidth, finalHeight);
        
        this.currentY += finalHeight + 15;
        
        console.log('[PDF] Foto adicionada com sucesso:', title);
      } else {
        // Placeholder para erro
        this.doc.setFillColor(245, 245, 245);
        this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40, 'F');
        
        this.doc.setTextColor(...COLORS.textLight);
        this.doc.setFontSize(10);
        this.doc.text("Erro ao carregar imagem", this.pageWidth / 2, this.currentY + 25, { align: "center" });
        
        this.currentY += 50;
      }
    } catch (error) {
      console.error('[PDF] Erro ao processar foto:', error);
      
      // Placeholder para erro
      this.doc.setFillColor(245, 245, 245);
      this.doc.rect(this.margin, this.currentY, this.pageWidth - 2 * this.margin, 40, 'F');
      
      this.doc.setTextColor(...COLORS.textLight);
      this.doc.setFontSize(10);
      this.doc.text("Erro ao carregar imagem", this.pageWidth / 2, this.currentY + 25, { align: "center" });
      
      this.currentY += 50;
    }
  }

  private addPageFooter() {
    // Linha decorativa
    this.doc.setDrawColor(...COLORS.border);
    this.doc.setLineWidth(0.3);
    this.doc.line(this.margin, this.pageHeight - 15, this.pageWidth - this.margin, this.pageHeight - 15);
    
    // Número da página
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Página ${this.doc.getNumberOfPages()}`, this.pageWidth / 2, this.pageHeight - 8, { align: "center" });
  }

  private checkPageBreak(neededSpace: number = 20) {
    if (this.currentY + neededSpace > this.pageHeight - 30) {
      this.addPageFooter();
      this.doc.addPage();
      this.addPageHeader();
    }
  }

  async generateReport(service: Service): Promise<void> {
    // PÁGINA 1 - CAPA MODERNA
    this.addPageHeader();
    
    // Título principal elegante
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(24);
    this.doc.setTextColor(...COLORS.primary);
    this.doc.text("RELATÓRIO DE DEMANDA", this.pageWidth / 2, this.currentY + 20, { align: "center" });
    
    this.currentY += 40;
    
    // Card principal com informações essenciais
    this.doc.setFillColor(...COLORS.white);
    this.doc.setDrawColor(...COLORS.primary);
    this.doc.setLineWidth(1);
    const cardHeight = 80;
    this.doc.rect(this.margin + 10, this.currentY, this.pageWidth - 2 * this.margin - 20, cardHeight, 'FD');
    
    // Conteúdo do card
    let cardY = this.currentY + 15;
    
    this.doc.setFont("helvetica", "bold");
    this.doc.setFontSize(16);
    this.doc.setTextColor(...COLORS.text);
    this.doc.text(safeText(service.title), this.pageWidth / 2, cardY, { align: "center" });
    
    cardY += 12;
    this.doc.setFont("helvetica", "normal");
    this.doc.setFontSize(11);
    this.doc.setTextColor(...COLORS.textLight);
    this.doc.text(`Demanda Nº ${service.number || 'N/A'}`, this.pageWidth / 2, cardY, { align: "center" });
    
    cardY += 8;
    this.doc.text(`Cliente: ${service.client || 'N/A'}`, this.pageWidth / 2, cardY, { align: "center" });
    
    cardY += 8;
    this.doc.text(`Local: ${safeText(service.location)}`, this.pageWidth / 2, cardY, { align: "center" });
    
    cardY += 8;
    this.doc.text(`Data: ${service.creationDate ? formatDate(service.creationDate) : 'N/A'}`, this.pageWidth / 2, cardY, { align: "center" });
    
    this.currentY += cardHeight + 20;
    
    // Badge de status
    this.addStatusBadge(service.status);
    
    // PÁGINA 2 - DETALHES
    this.doc.addPage();
    this.addPageHeader();
    
    this.addSectionHeader("INFORMAÇÕES GERAIS", "ℹ");
    
    this.addTwoColumnInfo("Título", safeText(service.title), "Tipo", safeText(service.serviceType || 'N/A'));
    this.addTwoColumnInfo("Cliente", safeText(service.client || 'N/A'), "Prioridade", safeText(service.priority || 'N/A'));
    this.addTwoColumnInfo("Local", safeText(service.location), "Cidade", safeText(service.city || 'N/A'));
    this.addInfoBox("Endereço", safeText(service.address || 'N/A'));
    this.addInfoBox("Descrição", safeText(service.description || 'N/A'));
    
    if (service.technician?.name) {
      this.addInfoBox("Técnico Responsável", safeText(service.technician.name));
    }
    
    // CAMPOS TÉCNICOS
    if (service.customFields && service.customFields.length > 0) {
      this.checkPageBreak(50);
      this.addSectionHeader("CHECKLIST TÉCNICO", "✓");
      
      service.customFields.forEach((field: CustomField) => {
        let value = '';
        if (field.type === 'boolean') {
          value = field.value ? '✓ Sim' : '✗ Não';
        } else if (field.type === 'select') {
          value = String(field.value);
        } else {
          value = String(field.value || 'N/A');
        }
        this.addInfoBox(field.label, safeText(value), false);
      });
    }
    
    // FOTOS
    if (service.photos && service.photos.length > 0) {
      this.doc.addPage();
      this.addPageHeader();
      this.addSectionHeader("ANEXOS FOTOGRÁFICOS", "📷");
      
      console.log('[PDF] Processando', service.photos.length, 'fotos para o relatório');
      
      for (const [photoIndex, photoUrl] of service.photos.entries()) {
        const photoTitle = service.photoTitles?.[photoIndex] || `Foto ${photoIndex + 1}`;
        await this.addPhoto(photoUrl, photoTitle);
      }
    }
    
    // MENSAGENS
    if (service.messages && service.messages.length > 0) {
      this.checkPageBreak(50);
      this.addSectionHeader("HISTÓRICO DE MENSAGENS", "💬");
      
      service.messages.forEach((message) => {
        this.checkPageBreak(25);
        
        // Header da mensagem
        this.doc.setFont("helvetica", "bold");
        this.doc.setFontSize(10);
        this.doc.setTextColor(...COLORS.primary);
        this.doc.text(`${message.senderName} (${message.senderRole})`, this.margin, this.currentY);
        
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(8);
        this.doc.setTextColor(...COLORS.textLight);
        this.doc.text(formatDate(message.timestamp || new Date().toISOString()), this.pageWidth - this.margin, this.currentY, { align: "right" });
        
        this.currentY += 8;
        
        // Conteúdo da mensagem
        this.doc.setFont("helvetica", "normal");
        this.doc.setFontSize(9);
        this.doc.setTextColor(...COLORS.text);
        const messageText = this.doc.splitTextToSize(safeText(message.message), this.pageWidth - 2 * this.margin);
        this.doc.text(messageText, this.margin, this.currentY);
        this.currentY += messageText.length * 4 + 8;
      });
    }
    
    // FEEDBACK
    if (service.feedback) {
      this.checkPageBreak(30);
      this.addSectionHeader("AVALIAÇÃO DO CLIENTE", "⭐");
      
      this.addTwoColumnInfo("Nota", `${service.feedback.clientRating}/5`, "Data", formatDate(new Date().toISOString()));
      
      if (service.feedback.clientComment) {
        this.addInfoBox("Comentário do Cliente", safeText(service.feedback.clientComment));
      }
      
      if (service.feedback.technicianFeedback) {
        this.addInfoBox("Feedback do Técnico", safeText(service.feedback.technicianFeedback));
      }
    }
    
    // Adicionar footer na última página
    this.addPageFooter();
    
    // Numerar todas as páginas
    const totalPages = this.doc.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      this.doc.setPage(i);
      this.addPageFooter();
    }
    
    // Salvar arquivo
    const fileName = safeText(`relatorio-demanda-${service.number || service.id.substring(0, 8)}.pdf`);
    this.doc.save(fileName);
    
    console.log('[PDF] Relatório moderno gerado com sucesso:', fileName);
  }
}

export const generateModernServiceReport = async (service: Service): Promise<void> => {
  const generator = new ModernPdfReportGenerator();
  await generator.generateReport(service);
};