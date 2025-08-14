import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';

// Função para sanitizar texto para PDF
export const sanitizeTextForPdf = (input: any): string => {
  if (input === null || input === undefined) return '';
  
  let text = String(input);
  
  // Remove caracteres null que podem corromper o PDF
  text = text.replace(/\u0000/g, '');
  
  // Remove BOM (Byte Order Mark)
  text = text.replace(/^\uFEFF/, '');
  
  // Normaliza Unicode para evitar problemas de encoding
  try {
    text = text.normalize('NFC');
  } catch (e) {
    // Se a normalização falhar, continua com o texto original
  }
  
  // Remove caracteres especiais que podem causar problemas no PDF
  text = text.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  return text.trim();
};

// Função para quebrar texto em linhas que cabem na largura especificada
export const wrapTextForPdf = (doc: any, text: string, maxWidth: number): string[] => {
  if (!text) return [''];
  
  const cleanText = sanitizeTextForPdf(text);
  return doc.splitTextToSize(cleanText, maxWidth);
};

// Função segura para adicionar texto ao PDF
export const addSafeText = (doc: any, text: any, x: number, y: number, options?: any): number => {
  const cleanText = sanitizeTextForPdf(text);
  
  if (options?.fontSize) {
    doc.setFontSize(options.fontSize);
  }
  
  if (options?.fontStyle) {
    doc.setFont(PDF_FONTS.normal, options.fontStyle);
  }
  
  if (options?.color) {
    doc.setTextColor(...options.color);
  }
  
  if (options?.maxWidth) {
    const wrappedText = wrapTextForPdf(doc, cleanText, options.maxWidth);
    wrappedText.forEach((line, index) => {
      doc.text(line, x, y + (index * (options.lineHeight || 6)));
    });
    return y + (wrappedText.length * (options.lineHeight || 6));
  } else {
    doc.text(cleanText, x, y, options?.align ? { align: options.align } : undefined);
    return y + (options?.lineHeight || 6);
  }
};

// Função para verificar se precisa quebrar página
export const checkPageBreak = (doc: any, currentY: number, requiredHeight: number): number => {
  const pageHeight = PDF_DIMENSIONS.pageHeight - PDF_DIMENSIONS.margin;
  
  if (currentY + requiredHeight > pageHeight) {
    doc.addPage();
    return PDF_DIMENSIONS.margin + 20; // Espaço para cabeçalho
  }
  
  return currentY;
};

// Função para criar cabeçalho de seção
export const createSectionHeader = (doc: any, title: string, y: number): number => {
  // Fundo do cabeçalho
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(PDF_DIMENSIONS.margin - 2, y - 6, 170, 12, 'F');
  
  // Texto do cabeçalho
  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(255, 255, 255);
  doc.text(sanitizeTextForPdf(title), PDF_DIMENSIONS.margin, y + 2);
  
  return y + 15;
};

// Função para processar imagem com fallback
export const processImageSafely = async (imagePath: string): Promise<string | null> => {
  try {
    // Se a imagem for uma URL completa, tenta carregar
    if (imagePath.startsWith('http')) {
      const response = await fetch(imagePath);
      if (response.ok) {
        const blob = await response.blob();
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve(null);
          reader.readAsDataURL(blob);
        });
      }
    }
    
    // Para imagens locais ou em caso de erro, retorna null
    return null;
  } catch (error) {
    console.warn('Erro ao processar imagem:', error);
    return null;
  }
};

// Função para formatar data de forma segura
export const formatDateSafely = (dateString: string | undefined): string => {
  if (!dateString) return 'Data não informada';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Data inválida';
    
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (error) {
    return 'Data inválida';
  }
};

// Função para obter texto de status
export const getStatusText = (status: string): string => {
  const statusMap: Record<string, string> = {
    'pendente': 'Pendente',
    'em_andamento': 'Em Andamento',
    'concluido': 'Concluído',
    'cancelado': 'Cancelado',
    'agendado': 'Agendado'
  };
  
  return statusMap[status] || status;
};

// Função para obter cor do status
export const getStatusColor = (status: string): [number, number, number] => {
  const colorMap: Record<string, [number, number, number]> = {
    'pendente': [...PDF_COLORS.warning] as [number, number, number],
    'em_andamento': [...PDF_COLORS.primaryLight] as [number, number, number],
    'concluido': [...PDF_COLORS.success] as [number, number, number],
    'cancelado': [...PDF_COLORS.danger] as [number, number, number],
    'agendado': [...PDF_COLORS.accent] as [number, number, number]
  };
  
  return colorMap[status] || [...PDF_COLORS.text] as [number, number, number];
};