
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
    photo: '📷',
    message: '💬'
  };
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.text(icons[icon as keyof typeof icons] || '•', x, y);
};

// Função para processar imagem para PDF
const processImageForPDF = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);
    
    if (imageUrl.startsWith('data:')) {
      console.log('[PDF] Imagem já em base64');
      return imageUrl;
    }

    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn('[PDF] Erro ao carregar imagem:', response.status);
      return null;
    }

    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[PDF] Erro ao processar imagem:', error);
    return null;
  }
};

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório profissional');
    console.log('[PDF] Serviço:', service.title, '- Tipo:', service.serviceType);
    console.log('[PDF] Fotos:', service.photos?.length || 0);
    console.log('[PDF] Campos customizados:', service.customFields?.length || 0);
    console.log('[PDF] Mensagens:', service.messages?.length || 0);
    
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

    // Cartão de Informações Principais
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, currentY, contentWidth, 100, 5, 5, 'F');
    doc.setDrawColor(41, 128, 185);
    doc.setLineWidth(1);
    doc.roundedRect(margin, currentY, contentWidth, 100, 5, 5, 'S');

    let cardY = currentY + 15;
    
    // Título da demanda
    addFormattedText(doc, sanitizeText(service.title), margin + (contentWidth / 2), cardY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [52, 58, 64],
      align: 'center',
      maxWidth: contentWidth - 20
    });

    cardY += 25;

    // Informações em duas colunas
    addIcon(doc, 'wrench', margin + 10, cardY);
    addFormattedText(doc, `OS Nº: ${sanitizeText(service.number || service.id.substring(0, 8))}`, margin + 20, cardY, {
      fontSize: 12,
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

    // Status com cor
    const statusColors: Record<string, [number, number, number]> = {
      'pendente': [255, 193, 7],
      'concluido': [40, 167, 69],
      'cancelado': [220, 53, 69]
    };
    
    const statusColor = statusColors[service.status] || [108, 117, 125];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(margin + 110, cardY, 60, 15, 3, 3, 'F');
    
    addFormattedText(doc, sanitizeText(service.status).toUpperCase(), margin + 140, cardY + 10, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255],
      align: 'center'
    });

    cardY += 20;
    addIcon(doc, 'calendar', margin + 10, cardY);
    addFormattedText(doc, `Criação: ${service.creationDate ? formatDate(service.creationDate) : 'N/A'}`, margin + 20, cardY, {
      fontSize: 10,
      color: [108, 117, 125]
    });

    if (service.date) {
      addIcon(doc, 'calendar', margin + 110, cardY);
      addFormattedText(doc, `Conclusão: ${formatDate(service.date)}`, margin + 120, cardY, {
        fontSize: 10,
        color: [108, 117, 125]
      });
    }

    // NOVA PÁGINA - DETALHES DO SERVIÇO
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
      const descLines = splitTextIntoLines(doc, sanitizeText(service.description), contentWidth - 20);
      const descHeight = Math.max(30, descLines.length * 5 + 10);
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
      // Verificar se há espaço suficiente
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }

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

      autoTable(doc, {
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
      // Nova página para fotos
      doc.addPage();
      currentY = 20;

      addIcon(doc, 'photo', margin, currentY + 5);
      addFormattedText(doc, `REGISTRO FOTOGRÁFICO (${service.photos.length} anexos)`, margin + 15, currentY + 8, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 40;

      // Processamento das fotos
      for (let i = 0; i < service.photos.length; i++) {
        // Verificar espaço disponível
        if (currentY > pageHeight - 150) {
          doc.addPage();
          currentY = 20;
          
          // Título da página de continuação
          addFormattedText(doc, 'REGISTRO FOTOGRÁFICO (Continuação)', margin, currentY, {
            fontSize: 14,
            fontStyle: 'bold',
            color: [41, 128, 185]
          });
          currentY += 30;
        }

        const photoTitle = service.photoTitles?.[i] || `Foto ${i + 1}`;
        
        // Título da foto
        addFormattedText(doc, `${i + 1}. ${sanitizeText(photoTitle)}`, margin, currentY, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        currentY += 15;

        try {
          console.log('[PDF] Processando foto:', service.photos[i]);
          const processedImage = await processImageForPDF(service.photos[i]);
          
          if (processedImage) {
            const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
            const imageWidth = 120;
            const imageHeight = 80;
            const xPosition = (pageWidth - imageWidth) / 2;
            
            doc.addImage(processedImage, imageFormat, xPosition, currentY, imageWidth, imageHeight);
            currentY += imageHeight + 15;
            console.log('[PDF] Foto processada com sucesso:', photoTitle);
          } else { 
            console.warn('[PDF] Falha ao processar foto:', service.photos[i]);
            
            // Placeholder visual para foto
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(245, 245, 245);
            const photoBoxWidth = 120;
            const photoBoxHeight = 80;
            const photoBoxX = (pageWidth - photoBoxWidth) / 2;
            doc.roundedRect(photoBoxX, currentY, photoBoxWidth, photoBoxHeight, 5, 5, 'FD');
            
            doc.setFontSize(12);
            doc.setTextColor(150, 150, 150);
            doc.text('FOTO INDISPONÍVEL', photoBoxX + (photoBoxWidth / 2), currentY + (photoBoxHeight / 2), { align: 'center' });
            
            currentY += photoBoxHeight + 15;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar foto:', error);
          
          // Placeholder para erro
          doc.setDrawColor(220, 53, 69);
          doc.setFillColor(255, 245, 245);
          const errorBoxWidth = 120;
          const errorBoxHeight = 80;
          const errorBoxX = (pageWidth - errorBoxWidth) / 2;
          doc.roundedRect(errorBoxX, currentY, errorBoxWidth, errorBoxHeight, 5, 5, 'FD');
          
          doc.setFontSize(10);
          doc.setTextColor(220, 53, 69);
          doc.text('ERRO AO CARREGAR', errorBoxX + (errorBoxWidth / 2), currentY + (errorBoxHeight / 2), { align: 'center' });
          
          currentY += errorBoxHeight + 15;
        }
      }
    }

    // COMUNICAÇÃO E FEEDBACK
    if (service.messages && service.messages.length > 0) {
      // Nova página para mensagens se necessário
      if (currentY > pageHeight - 100) {
        doc.addPage();
        currentY = 20;
      }

      addIcon(doc, 'message', margin, currentY + 5);
      addFormattedText(doc, 'HISTÓRICO DE COMUNICAÇÃO', margin + 15, currentY + 8, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 30;

      service.messages.forEach((message) => {
        if (currentY > pageHeight - 80) {
          doc.addPage();
          currentY = 20;
        }

        doc.setFillColor(248, 249, 250);
        const messageLines = splitTextIntoLines(doc, sanitizeText(message.message), contentWidth - 20);
        const messageHeight = Math.max(40, messageLines.length * 4 + 25);
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

    // FEEDBACK DO CLIENTE
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
      const feedbackHeight = service.feedback.clientComment ? 60 : 40;
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

      if (service.feedback.technicianFeedback) {
        addFormattedText(doc, `Feedback Técnico: ${sanitizeText(service.feedback.technicianFeedback)}`, margin + 10, currentY + 45, {
          fontSize: 10,
          color: [133, 100, 4],
          maxWidth: contentWidth - 20
        });
      }

      currentY += feedbackHeight + 20;
    }

    // PÁGINA DE ASSINATURAS
    if (service.signatures && (service.signatures.client || service.signatures.technician)) {
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
    const fileName = `relatorio_servico_${sanitizeText(service.number || service.id.substring(0, 8))}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    console.log('[PDF] Relatório profissional gerado com sucesso:', fileName);

  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório profissional:', error);
    throw new Error('Erro ao gerar relatório PDF profissional');
  }
};
