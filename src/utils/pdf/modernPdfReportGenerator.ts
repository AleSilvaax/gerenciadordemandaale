
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';

// Função para sanitizar texto e remover caracteres especiais problemáticos
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text
    .toString()
    .replace(/[^\x00-\x7F]/g, '') // Remove caracteres não-ASCII
    .replace(/[""]/g, '"')        // Normaliza aspas
    .replace(/['']/g, "'")        // Normaliza apóstrofes
    .replace(/[–—]/g, '-')        // Normaliza hífens
    .replace(/…/g, '...')         // Normaliza reticências
    .replace(/[\u00A0\u2000-\u200B\u2028-\u2029\u202F\u205F\u3000]/g, ' ') // Normaliza espaços
    .trim();
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
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): { finalY: number; lines: string[] } => {
  
  const {
    fontSize = 10,
    fontStyle = 'normal',
    color = [0, 0, 0],
    maxWidth = 180,
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

export const generateModernServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório moderno');
    
    const doc = new jsPDF();
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // Cabeçalho moderno
    doc.setFillColor(41, 128, 185); // Azul moderno
    doc.rect(0, 0, pageWidth, 40, 'F');

    // Título do relatório
    addFormattedText(doc, 'RELATORIO DE SERVICO', margin, 25, {
      fontSize: 18,
      fontStyle: 'bold',
      color: [255, 255, 255],
      align: 'center',
      maxWidth: contentWidth
    });

    currentY = 50;

    // Informações básicas em cards
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, currentY, contentWidth, 60, 3, 3, 'F');
    doc.setDrawColor(233, 236, 239);
    doc.roundedRect(margin, currentY, contentWidth, 60, 3, 3, 'S');

    // Título e número
    const titleResult = addFormattedText(doc, `TITULO: ${sanitizeText(service.title)}`, margin + 10, currentY + 15, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [52, 58, 64]
    });

    const numberResult = addFormattedText(doc, `NUMERO: ${sanitizeText(service.number)}`, margin + 10, titleResult.finalY + 5, {
      fontSize: 12,
      color: [108, 117, 125]
    });

    // Status com cor
    const statusColors: Record<string, [number, number, number]> = {
      'pendente': [255, 193, 7],
      'concluido': [40, 167, 69],
      'cancelado': [220, 53, 69]
    };
    
    const statusColor = statusColors[service.status] || [108, 117, 125];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin + 120, currentY + 10, 60, 15, 2, 2, 'F');
    
    addFormattedText(doc, sanitizeText(service.status).toUpperCase(), margin + 125, currentY + 20, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255]
    });

    currentY += 80;

    // Seção de detalhes
    addFormattedText(doc, 'DETALHES DO SERVICO', margin, currentY, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [52, 58, 64]
    });

    currentY += 20;

    // Grid de informações
    const fields = [
      { label: 'Cliente', value: service.client },
      { label: 'Local', value: service.location },
      { label: 'Endereco', value: service.address },
      { label: 'Cidade', value: service.city },
      { label: 'Tipo de Servico', value: service.serviceType },
      { label: 'Prioridade', value: service.priority },
      { label: 'Data de Criacao', value: service.creationDate ? new Date(service.creationDate).toLocaleDateString('pt-BR') : '' },
      { label: 'Data de Vencimento', value: service.dueDate ? new Date(service.dueDate).toLocaleDateString('pt-BR') : '' }
    ];

    let fieldY = currentY;
    let isLeftColumn = true;

    fields.forEach((field, index) => {
      if (field.value) {
        const x = isLeftColumn ? margin : margin + (contentWidth / 2) + 10;
        
        // Label
        addFormattedText(doc, `${field.label}:`, x, fieldY, {
          fontSize: 10,
          fontStyle: 'bold',
          color: [73, 80, 87]
        });
        
        // Valor
        addFormattedText(doc, sanitizeText(field.value), x, fieldY + 12, {
          fontSize: 10,
          color: [108, 117, 125],
          maxWidth: (contentWidth / 2) - 20
        });

        if (isLeftColumn) {
          isLeftColumn = false;
        } else {
          isLeftColumn = true;
          fieldY += 35;
        }
      }
    });

    currentY = fieldY + (isLeftColumn ? 35 : 0);

    // Descrição
    if (service.description) {
      currentY += 10;
      
      addFormattedText(doc, 'DESCRICAO:', margin, currentY, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      currentY += 15;

      doc.setFillColor(248, 249, 250);
      const descHeight = Math.max(30, (sanitizeText(service.description).length / 80) * 12);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 2, 2, 'F');
      doc.setDrawColor(233, 236, 239);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 2, 2, 'S');

      addFormattedText(doc, sanitizeText(service.description), margin + 10, currentY + 10, {
        fontSize: 10,
        color: [52, 58, 64],
        maxWidth: contentWidth - 20
      });

      currentY += descHeight + 20;
    }

    // Notas técnicas
    if (service.notes) {
      addFormattedText(doc, 'OBSERVACOES TECNICAS:', margin, currentY, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      currentY += 15;

      doc.setFillColor(255, 248, 225);
      const notesHeight = Math.max(25, (sanitizeText(service.notes).length / 80) * 12);
      doc.roundedRect(margin, currentY, contentWidth, notesHeight, 2, 2, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.roundedRect(margin, currentY, contentWidth, notesHeight, 2, 2, 'S');

      addFormattedText(doc, sanitizeText(service.notes), margin + 10, currentY + 10, {
        fontSize: 10,
        color: [133, 100, 4],
        maxWidth: contentWidth - 20
      });

      currentY += notesHeight + 20;
    }

    // Verificar se precisa de nova página
    if (currentY > 240) {
      doc.addPage();
      currentY = 20;
    }

    // Seção de fotos (se existirem)
    if (service.photos && service.photos.length > 0) {
      addFormattedText(doc, `ANEXOS E FOTOS (${service.photos.length})`, margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      currentY += 20;

      service.photos.forEach((photoUrl, index) => {
        const title = service.photoTitles?.[index] || `Foto ${index + 1}`;
        
        // Título da foto
        addFormattedText(doc, sanitizeText(title), margin, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [73, 80, 87]
        });

        // URL da foto (para referência)
        addFormattedText(doc, `URL: ${photoUrl}`, margin, currentY + 12, {
          fontSize: 8,
          color: [108, 117, 125],
          maxWidth: contentWidth
        });

        currentY += 30;

        // Verificar nova página
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }
      });
    }

    // Campos customizados
    if (service.customFields && service.customFields.length > 0) {
      // Verificar nova página
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      addFormattedText(doc, 'CAMPOS TECNICOS', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      currentY += 20;

      service.customFields.forEach((field: any) => {
        if (field.value) {
          // Nome do campo
          addFormattedText(doc, `${sanitizeText(field.name)}:`, margin, currentY, {
            fontSize: 10,
            fontStyle: 'bold',
            color: [73, 80, 87]
          });

          // Valor do campo
          const valueText = typeof field.value === 'object' 
            ? JSON.stringify(field.value).replace(/[{}",]/g, ' ')
            : field.value.toString();

          addFormattedText(doc, sanitizeText(valueText), margin, currentY + 12, {
            fontSize: 10,
            color: [108, 117, 125],
            maxWidth: contentWidth
          });

          currentY += 30;

          // Verificar nova página
          if (currentY > 250) {
            doc.addPage();
            currentY = 20;
          }
        }
      });
    }

    // Rodapé
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(233, 236, 239);
      doc.line(margin, 280, pageWidth - margin, 280);
      
      // Informações do rodapé
      addFormattedText(doc, `Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, 290, {
        fontSize: 8,
        color: [108, 117, 125]
      });

      addFormattedText(doc, `Pagina ${i} de ${pageCount}`, pageWidth - margin - 30, 290, {
        fontSize: 8,
        color: [108, 117, 125]
      });
    }

    // Salvar PDF
    const fileName = `relatorio_${sanitizeText(service.number || service.id)}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    console.log('[PDF] Relatório gerado com sucesso:', fileName);

  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório:', error);
    throw new Error('Erro ao gerar relatório PDF');
  }
};
