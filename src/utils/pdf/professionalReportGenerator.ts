
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';

// Função para sanitizar texto
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  return text
    .toString()
    .replace(/[^\x00-\x7F]/g, '')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[\u00A0\u2000-\u200B\u2028-\u2029\u202F\u205F\u3000]/g, ' ')
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

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = splitTextIntoLines(doc, text, maxWidth);
  
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

// Função para adicionar ícones simples usando texto
const addIcon = (doc: jsPDF, icon: string, x: number, y: number) => {
  const icons = {
    check: '✓',
    user: '👤',
    location: '📍',
    calendar: '📅',
    wrench: '🔧',
    star: '⭐',
    photo: '📷'
  };
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(icons[icon as keyof typeof icons] || '•', x, y);
};

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório profissional');
    
    const doc = new jsPDF();
    let currentY = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // CAPA PROFISSIONAL
    // Cabeçalho com espaço para logo
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 50, 'F');

    // Espaço reservado para logo futuro
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.rect(margin, 10, 40, 30, 'S');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('LOGO', margin + 20, 28, { align: 'center' });

    // Título principal
    addFormattedText(doc, 'RELATÓRIO DE SERVIÇO', margin + 50, 30, {
      fontSize: 20,
      fontStyle: 'bold',
      color: [255, 255, 255],
      align: 'left'
    });

    currentY = 70;

    // Cartão de Destaque
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, currentY, contentWidth, 80, 5, 5, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.roundedRect(margin, currentY, contentWidth, 80, 5, 5, 'S');

    // Informações principais com ícones
    let cardY = currentY + 15;
    
    addIcon(doc, 'wrench', margin + 10, cardY);
    addFormattedText(doc, `OS Nº: ${sanitizeText(service.number)}`, margin + 20, cardY, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [52, 58, 64]
    });

    addIcon(doc, 'user', margin + 110, cardY);
    addFormattedText(doc, `Cliente: ${sanitizeText(service.client || 'N/A')}`, margin + 120, cardY, {
      fontSize: 12,
      color: [73, 80, 87]
    });

    cardY += 20;
    addIcon(doc, 'location', margin + 10, cardY);
    addFormattedText(doc, `Local: ${sanitizeText(service.location)}`, margin + 20, cardY, {
      fontSize: 12,
      color: [73, 80, 87]
    });

    cardY += 15;
    addIcon(doc, 'calendar', margin + 10, cardY);
    addFormattedText(doc, `Criação: ${service.creationDate ? formatDate(service.creationDate) : 'N/A'}`, margin + 20, cardY, {
      fontSize: 11,
      color: [108, 117, 125]
    });

    addIcon(doc, 'calendar', margin + 110, cardY);
    addFormattedText(doc, `Conclusão: ${service.date ? formatDate(service.date) : 'N/A'}`, margin + 120, cardY, {
      fontSize: 11,
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
    doc.roundedRect(margin + 130, currentY + 10, 50, 20, 3, 3, 'F');
    
    addIcon(doc, 'check', margin + 135, currentY + 23);
    addFormattedText(doc, sanitizeText(service.status).toUpperCase(), margin + 145, currentY + 23, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255]
    });

    currentY += 100;

    // NOVA PÁGINA - DETALHES TÉCNICOS
    doc.addPage();
    currentY = 20;

    // Título da seção
    addFormattedText(doc, 'DETALHES DO SERVIÇO', margin, currentY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [41, 128, 185]
    });

    currentY += 25;

    // Descrição do Serviço
    if (service.description) {
      addFormattedText(doc, 'DESCRIÇÃO:', margin, currentY, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      currentY += 15;

      doc.setFillColor(248, 249, 250);
      const descHeight = Math.max(30, (sanitizeText(service.description).length / 80) * 12);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 3, 3, 'F');
      doc.setDrawColor(233, 236, 239);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 3, 3, 'S');

      addFormattedText(doc, sanitizeText(service.description), margin + 10, currentY + 10, {
        fontSize: 10,
        color: [52, 58, 64],
        maxWidth: contentWidth - 20
      });

      currentY += descHeight + 20;
    }

    // CHECKLIST TÉCNICO (SEÇÃO CRÍTICA)
    if (service.customFields && service.customFields.length > 0) {
      addFormattedText(doc, 'CHECKLIST TÉCNICO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 20;

      // Criar tabela para campos técnicos
      const tableData = service.customFields.map((field: CustomField) => {
        let value = '';
        if (field.type === 'boolean') {
          value = field.value ? 'Sim' : 'Não';
        } else if (field.type === 'select') {
          value = String(field.value);
        } else {
          value = String(field.value || 'N/A');
        }
        return [sanitizeText(field.label), sanitizeText(value)];
      });

      (doc as any).autoTable({
        head: [['Campo', 'Valor']],
        body: tableData,
        startY: currentY,
        styles: { 
          fontSize: 10,
          cellPadding: 8,
          lineColor: [233, 236, 239],
          lineWidth: 0.5
        },
        headStyles: { 
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: { fillColor: [248, 249, 250] },
        columnStyles: {
          0: { cellWidth: contentWidth * 0.4 },
          1: { cellWidth: contentWidth * 0.6 }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // RELATÓRIO FOTOGRÁFICO
    if (service.photos && service.photos.length > 0) {
      // Verificar se precisa de nova página
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }

      addIcon(doc, 'photo', margin, currentY + 5);
      addFormattedText(doc, `ANEXOS FOTOGRÁFICOS (${service.photos.length} fotos)`, margin + 15, currentY + 8, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 30;

      for (let i = 0; i < service.photos.length; i++) {
        if (currentY > pageHeight - 60) {
          doc.addPage();
          currentY = 20;
        }

        const photoTitle = service.photoTitles?.[i] || `Foto ${i + 1}`;
        
        addFormattedText(doc, sanitizeText(photoTitle), margin, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [73, 80, 87]
        });

        addFormattedText(doc, `URL: ${service.photos[i]}`, margin, currentY + 12, {
          fontSize: 8,
          color: [108, 117, 125],
          maxWidth: contentWidth
        });

        currentY += 35;
      }
    }

    // COMUNICAÇÃO E FEEDBACK
    if (service.messages && service.messages.length > 0) {
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }

      addFormattedText(doc, 'HISTÓRICO DE COMUNICAÇÃO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 20;

      service.messages.forEach((message) => {
        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(248, 249, 250);
        const messageHeight = 40;
        doc.roundedRect(margin, currentY, contentWidth, messageHeight, 3, 3, 'F');

        addFormattedText(doc, `${message.senderName} (${message.senderRole})`, margin + 10, currentY + 12, {
          fontSize: 10,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        addFormattedText(doc, formatDate(message.timestamp || new Date().toISOString()), margin + 10, currentY + 22, {
          fontSize: 8,
          color: [108, 117, 125]
        });

        addFormattedText(doc, sanitizeText(message.message), margin + 10, currentY + 32, {
          fontSize: 9,
          color: [52, 58, 64],
          maxWidth: contentWidth - 20
        });

        currentY += messageHeight + 10;
      });
    }

    // Feedback
    if (service.feedback) {
      if (currentY > pageHeight - 80) {
        doc.addPage();
        currentY = 20;
      }

      addIcon(doc, 'star', margin, currentY + 5);
      addFormattedText(doc, 'AVALIAÇÃO DO CLIENTE', margin + 15, currentY + 8, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 25;

      doc.setFillColor(255, 248, 225);
      const feedbackHeight = 60;
      doc.roundedRect(margin, currentY, contentWidth, feedbackHeight, 3, 3, 'F');

      addFormattedText(doc, `Avaliação: ${service.feedback.clientRating}/5 estrelas`, margin + 10, currentY + 15, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [133, 100, 4]
      });

      if (service.feedback.clientComment) {
        addFormattedText(doc, `Comentário: ${sanitizeText(service.feedback.clientComment)}`, margin + 10, currentY + 30, {
          fontSize: 10,
          color: [133, 100, 4],
          maxWidth: contentWidth - 20
        });
      }

      currentY += feedbackHeight + 20;
    }

    // PÁGINA DE ASSINATURAS
    doc.addPage();
    currentY = 20;

    addFormattedText(doc, 'TERMO DE CONCLUSÃO E ASSINATURAS', margin, currentY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [41, 128, 185],
      align: 'center',
      maxWidth: contentWidth
    });

    currentY += 40;

    if (service.signatures) {
      const signatureWidth = (contentWidth - 20) / 2;

      // Assinatura do Cliente
      if (service.signatures.client) {
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, currentY, signatureWidth, 80, 3, 3, 'F');
        doc.setDrawColor(233, 236, 239);
        doc.roundedRect(margin, currentY, signatureWidth, 80, 3, 3, 'S');

        addFormattedText(doc, 'ASSINATURA DO CLIENTE', margin + 10, currentY + 15, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        addFormattedText(doc, `Cliente: ${sanitizeText(service.client || 'N/A')}`, margin + 10, currentY + 55, {
          fontSize: 10,
          color: [108, 117, 125]
        });

        addFormattedText(doc, `Data: ${formatDate(new Date().toISOString())}`, margin + 10, currentY + 70, {
          fontSize: 10,
          color: [108, 117, 125]
        });
      }

      // Assinatura do Técnico
      if (service.signatures.technician) {
        const technicianX = margin + signatureWidth + 20;
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(technicianX, currentY, signatureWidth, 80, 3, 3, 'F');
        doc.setDrawColor(233, 236, 239);
        doc.roundedRect(technicianX, currentY, signatureWidth, 80, 3, 3, 'S');

        addFormattedText(doc, 'ASSINATURA DO TÉCNICO', technicianX + 10, currentY + 15, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        addFormattedText(doc, `Técnico: ${sanitizeText(service.technician?.name || 'N/A')}`, technicianX + 10, currentY + 55, {
          fontSize: 10,
          color: [108, 117, 125]
        });

        addFormattedText(doc, `Data: ${formatDate(new Date().toISOString())}`, technicianX + 10, currentY + 70, {
          fontSize: 10,
          color: [108, 117, 125]
        });
      }
    }

    // Rodapé em todas as páginas
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(233, 236, 239);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Informações do rodapé
      addFormattedText(doc, 'GerenciadorDemandas', margin, pageHeight - 15, {
        fontSize: 8,
        color: [108, 117, 125]
      });

      addFormattedText(doc, `Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin + 60, pageHeight - 15, {
        fontSize: 8,
        color: [108, 117, 125]
      });

      addFormattedText(doc, `Página ${i} de ${pageCount}`, pageWidth - margin - 30, pageHeight - 15, {
        fontSize: 8,
        color: [108, 117, 125]
      });
    }

    // Salvar PDF
    const fileName = `relatorio_servico_${sanitizeText(service.number || service.id)}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    console.log('[PDF] Relatório profissional gerado com sucesso:', fileName);

  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório profissional:', error);
    throw new Error('Erro ao gerar relatório PDF profissional');
  }
};
