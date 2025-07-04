
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';

// Função para sanitizar texto e remover caracteres especiais problemáticos
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text
    .toString()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove acentos
    .replace(/[^\x00-\x7F]/g, ' ') // Remove caracteres não-ASCII
    .replace(/[""'']/g, '"') // Normaliza aspas
    .replace(/[–—]/g, '-') // Normaliza hífens
    .replace(/…/g, '...') // Normaliza reticências
    .replace(/[\u00A0\u2000-\u200B\u2028-\u2029\u202F\u205F\u3000]/g, ' ') // Normaliza espaços
    .replace(/\s+/g, ' ') // Remove espaços múltiplos
    .trim();
};

// Cores profissionais
const COLORS = {
  primary: [41, 128, 185], // Azul profissional
  secondary: [52, 73, 94], // Cinza escuro
  accent: [46, 204, 113], // Verde sucesso
  warning: [241, 196, 15], // Amarelo aviso
  danger: [231, 76, 60], // Vermelho erro
  light: [236, 240, 241], // Cinza claro
  white: [255, 255, 255], // Branco
  text: [44, 62, 80], // Texto escuro
  textLight: [127, 140, 141] // Texto claro
};

// Função para quebrar texto em linhas
const splitTextIntoLines = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text) return [''];
  const sanitized = sanitizeText(text);
  return doc.splitTextToSize(sanitized, maxWidth);
};

// Função para adicionar texto formatado
const addFormattedText = (
  doc: jsPDF, 
  text: string, 
  x: number, 
  y: number, 
  options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold' | 'italic';
    color?: number[];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): { finalY: number; lines: string[] } => {
  
  const {
    fontSize = 10,
    fontStyle = 'normal',
    color = COLORS.text,
    maxWidth = 170,
    align = 'left'
  } = options;

  // Configurar fonte
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(color[0], color[1], color[2]);

  // Quebrar texto em linhas
  const lines = splitTextIntoLines(doc, text, maxWidth);
  
  // Adicionar cada linha
  lines.forEach((line, index) => {
    const lineY = y + (index * (fontSize * 0.4));
    
    switch (align) {
      case 'center':
        doc.text(line, x + (maxWidth / 2), lineY, { align: 'center' });
        break;
      case 'right':
        doc.text(line, x + maxWidth, lineY, { align: 'right' });
        break;
      default:
        doc.text(line, x, lineY);
    }
  });

  return {
    finalY: y + (lines.length * (fontSize * 0.4)),
    lines
  };
};

// Função para adicionar cabeçalho profissional
const addHeader = (doc: jsPDF, service: Service): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Fundo do cabeçalho
  doc.setFillColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.rect(0, 0, pageWidth, 50, 'F');
  
  // Logo/Título
  addFormattedText(doc, 'RELATORIO DE SERVICO', 20, 20, {
    fontSize: 24,
    fontStyle: 'bold',
    color: COLORS.white,
    maxWidth: pageWidth - 40
  });
  
  // Subtítulo
  addFormattedText(doc, `Demanda: ${sanitizeText(service.number)}`, 20, 35, {
    fontSize: 12,
    color: COLORS.white,
    maxWidth: pageWidth - 40
  });
  
  // Data de geração
  const today = new Date().toLocaleDateString('pt-BR');
  addFormattedText(doc, `Gerado em: ${today}`, pageWidth - 20, 20, {
    fontSize: 10,
    color: COLORS.white,
    align: 'right',
    maxWidth: 100
  });
  
  return 60; // Retorna Y onde o conteúdo deve começar
};

// Função para adicionar seção com título
const addSection = (doc: jsPDF, title: string, y: number, icon?: string): number => {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Linha decorativa
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(2);
  doc.line(20, y, pageWidth - 20, y);
  
  // Título da seção
  addFormattedText(doc, title.toUpperCase(), 20, y + 15, {
    fontSize: 14,
    fontStyle: 'bold',
    color: COLORS.primary
  });
  
  return y + 25;
};

// Função para adicionar card informativo
const addInfoCard = (doc: jsPDF, title: string, content: string, x: number, y: number, width: number): number => {
  if (!content) return y;
  
  const cardHeight = Math.max(35, content.length > 50 ? 50 : 35);
  
  // Fundo do card
  doc.setFillColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
  doc.roundedRect(x, y, width, cardHeight, 3, 3, 'F');
  
  // Borda do card
  doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.roundedRect(x, y, width, cardHeight, 3, 3, 'S');
  
  // Título do card
  addFormattedText(doc, title, x + 8, y + 12, {
    fontSize: 9,
    fontStyle: 'bold',
    color: COLORS.secondary
  });
  
  // Conteúdo do card
  addFormattedText(doc, sanitizeText(content), x + 8, y + 22, {
    fontSize: 10,
    color: COLORS.text,
    maxWidth: width - 16
  });
  
  return y + cardHeight + 8;
};

// Função para adicionar status badge
const addStatusBadge = (doc: jsPDF, status: string, x: number, y: number): void => {
  const statusColors: Record<string, number[]> = {
    'pendente': COLORS.warning,
    'concluido': COLORS.accent,
    'cancelado': COLORS.danger
  };
  
  const color = statusColors[status.toLowerCase()] || COLORS.secondary;
  const badgeWidth = 80;
  const badgeHeight = 20;
  
  // Fundo do badge
  doc.setFillColor(color[0], color[1], color[2]);
  doc.roundedRect(x, y, badgeWidth, badgeHeight, 10, 10, 'F');
  
  // Texto do badge
  addFormattedText(doc, sanitizeText(status).toUpperCase(), x + badgeWidth/2, y + 13, {
    fontSize: 10,
    fontStyle: 'bold',
    color: COLORS.white,
    align: 'center',
    maxWidth: badgeWidth
  });
};

export const generateModernServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório moderno profissional');
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    const cardWidth = (contentWidth - 10) / 2; // Para cards lado a lado
    
    // Adicionar cabeçalho
    let currentY = addHeader(doc, service);
    
    // Seção: Informações Gerais
    currentY = addSection(doc, 'Informacoes Gerais', currentY);
    
    // Cards lado a lado - Linha 1
    let cardY = currentY;
    currentY = addInfoCard(doc, 'TITULO DA DEMANDA', service.title, margin, cardY, cardWidth);
    addInfoCard(doc, 'CLIENTE', service.client || 'Nao informado', margin + cardWidth + 10, cardY, cardWidth);
    
    // Cards lado a lado - Linha 2
    cardY = currentY;
    currentY = addInfoCard(doc, 'LOCAL', service.location, margin, cardY, cardWidth);
    addInfoCard(doc, 'CIDADE', service.city || 'Nao informado', margin + cardWidth + 10, cardY, cardWidth);
    
    // Cards lado a lado - Linha 3
    cardY = currentY;
    currentY = addInfoCard(doc, 'TIPO DE SERVICO', service.serviceType || 'Nao informado', margin, cardY, cardWidth);
    
    // Status badge
    addStatusBadge(doc, service.status, margin + cardWidth + 10, cardY + 8);
    currentY = Math.max(currentY, cardY + 35);
    
    // Cards lado a lado - Linha 4
    if (service.priority || service.creationDate) {
      cardY = currentY;
      if (service.priority) {
        currentY = addInfoCard(doc, 'PRIORIDADE', service.priority, margin, cardY, cardWidth);
      }
      if (service.creationDate) {
        const creationDate = new Date(service.creationDate).toLocaleDateString('pt-BR');
        addInfoCard(doc, 'DATA DE CRIACAO', creationDate, margin + cardWidth + 10, cardY, cardWidth);
      }
    }
    
    currentY += 10;
    
    // Seção: Descrição
    if (service.description) {
      currentY = addSection(doc, 'Descricao do Servico', currentY);
      
      // Card de descrição (largura total)
      const descHeight = Math.max(40, Math.ceil(service.description.length / 80) * 8 + 20);
      
      doc.setFillColor(250, 250, 250);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 5, 5, 'F');
      
      doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
      doc.setLineWidth(0.5);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 5, 5, 'S');
      
      addFormattedText(doc, sanitizeText(service.description), margin + 10, currentY + 15, {
        fontSize: 11,
        color: COLORS.text,
        maxWidth: contentWidth - 20
      });
      
      currentY += descHeight + 15;
    }
    
    // Seção: Observações Técnicas
    if (service.notes) {
      currentY = addSection(doc, 'Observacoes Tecnicas', currentY);
      
      const notesHeight = Math.max(30, Math.ceil(service.notes.length / 80) * 8 + 15);
      
      doc.setFillColor(255, 252, 240);
      doc.roundedRect(margin, currentY, contentWidth, notesHeight, 5, 5, 'F');
      
      doc.setDrawColor(COLORS.warning[0], COLORS.warning[1], COLORS.warning[2]);
      doc.setLineWidth(1);
      doc.roundedRect(margin, currentY, contentWidth, notesHeight, 5, 5, 'S');
      
      addFormattedText(doc, sanitizeText(service.notes), margin + 10, currentY + 15, {
        fontSize: 10,
        color: COLORS.text,
        maxWidth: contentWidth - 20
      });
      
      currentY += notesHeight + 15;
    }
    
    // Verificar se precisa de nova página
    if (currentY > 240) {
      doc.addPage();
      currentY = 30;
    }
    
    // Seção: Campos Técnicos
    if (service.customFields && service.customFields.length > 0) {
      currentY = addSection(doc, 'Campos Tecnicos', currentY);
      
      service.customFields.forEach((field: any, index: number) => {
        if (field.value) {
          const isEven = index % 2 === 0;
          const cardX = isEven ? margin : margin + cardWidth + 10;
          
          if (isEven && index > 0) {
            currentY += 5; // Espaço entre linhas
          }
          
          const fieldY = addInfoCard(
            doc, 
            sanitizeText(field.name).toUpperCase(), 
            typeof field.value === 'object' ? JSON.stringify(field.value) : field.value.toString(),
            cardX,
            currentY,
            cardWidth
          );
          
          if (!isEven) {
            currentY = fieldY;
          }
          
          // Verificar nova página
          if (currentY > 250) {
            doc.addPage();
            currentY = 30;
          }
        }
      });
    }
    
    // Seção: Anexos
    if (service.photos && service.photos.length > 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 30;
      }
      
      currentY = addSection(doc, `Anexos e Fotos (${service.photos.length})`, currentY);
      
      service.photos.forEach((photoUrl, index) => {
        const title = service.photoTitles?.[index] || `Foto ${index + 1}`;
        
        // Card para cada foto
        const photoCardHeight = 40;
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, currentY, contentWidth, photoCardHeight, 3, 3, 'F');
        
        doc.setDrawColor(COLORS.primary[0], COLORS.primary[1], COLORS.primary[2]);
        doc.setLineWidth(0.3);
        doc.roundedRect(margin, currentY, contentWidth, photoCardHeight, 3, 3, 'S');
        
        // Título da foto
        addFormattedText(doc, `${index + 1}. ${sanitizeText(title)}`, margin + 8, currentY + 15, {
          fontSize: 11,
          fontStyle: 'bold',
          color: COLORS.text
        });
        
        // URL da foto (truncada)
        const truncatedUrl = photoUrl.length > 60 ? photoUrl.substring(0, 60) + '...' : photoUrl;
        addFormattedText(doc, `URL: ${truncatedUrl}`, margin + 8, currentY + 28, {
          fontSize: 8,
          color: COLORS.textLight,
          maxWidth: contentWidth - 16
        });
        
        currentY += photoCardHeight + 5;
        
        // Verificar nova página
        if (currentY > 250) {
          doc.addPage();
          currentY = 30;
        }
      });
    }
    
    // Rodapé profissional
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(COLORS.light[0], COLORS.light[1], COLORS.light[2]);
      doc.setLineWidth(1);
      doc.line(margin, 280, pageWidth - margin, 280);
      
      // Informações do rodapé
      addFormattedText(doc, `Sistema GerenciadorDemandas - ${new Date().toLocaleString('pt-BR')}`, margin, 290, {
        fontSize: 8,
        color: COLORS.textLight
      });
      
      addFormattedText(doc, `Pagina ${i} de ${pageCount}`, pageWidth - margin, 290, {
        fontSize: 8,
        color: COLORS.textLight,
        align: 'right'
      });
    }
    
    // Salvar PDF
    const fileName = `relatorio_${sanitizeText(service.number || service.id)}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);
    
    console.log('[PDF] Relatório profissional gerado com sucesso:', fileName);
    
  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório:', error);
    throw new Error('Erro ao gerar relatório PDF');
  }
};
