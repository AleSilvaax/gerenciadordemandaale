
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';

// Função para sanitizar texto e remover caracteres especiais
const sanitizeText = (text: string | undefined | null): string => {
  if (!text) return '';
  
  return text.toString()
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/…/g, '...')
    .replace(/[\u00A0\u2000-\u200B\u2028-\u2029\u202F\u205F\u3000]/g, ' ')
    .replace(/[^\x20-\x7E\u00C0-\u017F]/g, '')
    .trim();
};

// Função para quebrar texto em linhas
const wrapText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text) return [''];
  const sanitized = sanitizeText(text);
  return doc.splitTextToSize(sanitized, maxWidth);
};

// Função para adicionar texto com controle de posição
const addText = (
  doc: jsPDF,
  text: string,
  x: number,
  y: number,
  options: {
    fontSize?: number;
    fontStyle?: 'normal' | 'bold';
    color?: [number, number, number];
    maxWidth?: number;
    align?: 'left' | 'center' | 'right';
  } = {}
): number => {
  const { fontSize = 10, fontStyle = 'normal', color = [0, 0, 0], maxWidth = 170, align = 'left' } = options;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', fontStyle);
  doc.setTextColor(color[0], color[1], color[2]);

  const lines = wrapText(doc, text, maxWidth);
  const lineHeight = fontSize * 0.35;

  lines.forEach((line, index) => {
    const lineY = y + (index * lineHeight);
    
    if (align === 'center') {
      doc.text(line, x + (maxWidth / 2), lineY, { align: 'center' });
    } else if (align === 'right') {
      doc.text(line, x + maxWidth, lineY, { align: 'right' });
    } else {
      doc.text(line, x, lineY);
    }
  });

  return y + (lines.length * lineHeight) + 5;
};

// Função para processar imagens
const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);
    
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    const response = await fetch(imageUrl, {
      mode: 'cors',
      headers: { 'Accept': 'image/*' }
    });

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
    
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 15;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 20;

    // === CABEÇALHO PRINCIPAL ===
    doc.setFillColor(41, 128, 185);
    doc.rect(0, 0, pageWidth, 45, 'F');

    // Logo placeholder
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(2);
    doc.rect(margin, 8, 35, 25, 'S');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(8);
    doc.text('LOGO', margin + 17.5, 22, { align: 'center' });

    // Título principal
    currentY = addText(doc, 'RELATORIO DE SERVICO', margin + 45, 25, {
      fontSize: 18,
      fontStyle: 'bold',
      color: [255, 255, 255],
      maxWidth: contentWidth - 45
    });

    currentY = 55;

    // === CARTÃO DE INFORMAÇÕES PRINCIPAIS ===
    doc.setFillColor(248, 249, 250);
    doc.roundedRect(margin, currentY, contentWidth, 85, 3, 3, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.5);
    doc.roundedRect(margin, currentY, contentWidth, 85, 3, 3, 'S');

    let cardY = currentY + 15;

    // Título do serviço (centralizado)
    cardY = addText(doc, sanitizeText(service.title), margin + 10, cardY, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [52, 58, 64],
      maxWidth: contentWidth - 20,
      align: 'center'
    });

    cardY += 10;

    // Informações em duas colunas
    const leftCol = margin + 15;
    const rightCol = margin + (contentWidth / 2) + 10;

    // Coluna esquerda
    cardY = addText(doc, `OS N°: ${sanitizeText(service.number || service.id.substring(0, 8))}`, leftCol, cardY, {
      fontSize: 11,
      fontStyle: 'bold',
      color: [52, 58, 64]
    });

    cardY = addText(doc, `Cliente: ${sanitizeText(service.client || 'N/A')}`, leftCol, cardY, {
      fontSize: 10,
      color: [73, 80, 87]
    });

    // Coluna direita (resetar Y)
    let rightY = currentY + 40;
    
    // Status com cor
    const statusColors: Record<string, [number, number, number]> = {
      'pendente': [255, 193, 7],
      'concluido': [40, 167, 69],
      'cancelado': [220, 53, 69]
    };
    
    const statusColor = statusColors[service.status] || [108, 117, 125];
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(rightCol, rightY - 10, 65, 18, 3, 3, 'F');
    
    addText(doc, sanitizeText(service.status).toUpperCase(), rightCol + 32.5, rightY - 2, {
      fontSize: 10,
      fontStyle: 'bold',
      color: [255, 255, 255],
      align: 'center'
    });

    rightY = addText(doc, `Local: ${sanitizeText(service.location)}`, rightCol, rightY + 10, {
      fontSize: 10,
      color: [73, 80, 87]
    });

    // Data de criação (parte inferior do cartão)
    addText(doc, `Criado em: ${service.creationDate ? formatDate(service.creationDate) : 'N/A'}`, leftCol, currentY + 70, {
      fontSize: 9,
      color: [108, 117, 125]
    });

    if (service.date) {
      addText(doc, `Concluído em: ${formatDate(service.date)}`, rightCol, currentY + 70, {
        fontSize: 9,
        color: [108, 117, 125]
      });
    }

    currentY += 100;

    // === DETALHES DO SERVIÇO ===
    currentY = addText(doc, 'DETALHES DO SERVICO', margin, currentY, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [41, 128, 185]
    });

    currentY += 5;

    // Descrição
    if (service.description) {
      currentY = addText(doc, 'DESCRICAO:', margin, currentY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [52, 58, 64]
      });

      doc.setFillColor(248, 249, 250);
      const descLines = wrapText(doc, sanitizeText(service.description), contentWidth - 20);
      const descHeight = Math.max(25, descLines.length * 4 + 15);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 2, 2, 'F');
      doc.setDrawColor(220, 220, 220);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 2, 2, 'S');

      currentY = addText(doc, sanitizeText(service.description), margin + 10, currentY + 8, {
        fontSize: 10,
        color: [52, 58, 64],
        maxWidth: contentWidth - 20
      });

      currentY += 10;
    }

    // Informações adicionais
    const infoFields = [
      { label: 'Tipo de Serviço', value: service.serviceType },
      { label: 'Prioridade', value: service.priority },
      { label: 'Endereço', value: service.address },
      { label: 'Cidade', value: service.city }
    ];

    let hasInfo = false;
    infoFields.forEach(field => {
      if (field.value) {
        if (!hasInfo) {
          currentY = addText(doc, 'INFORMACOES ADICIONAIS:', margin, currentY, {
            fontSize: 11,
            fontStyle: 'bold',
            color: [52, 58, 64]
          });
          hasInfo = true;
        }
        currentY = addText(doc, `${field.label}: ${sanitizeText(field.value)}`, margin + 5, currentY, {
          fontSize: 10,
          color: [73, 80, 87]
        });
      }
    });

    if (hasInfo) currentY += 10;

    // === CHECKLIST TÉCNICO ===
    if (service.customFields && service.customFields.length > 0) {
      // Verificar espaço para nova página
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      currentY = addText(doc, 'CHECKLIST TECNICO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 5;

      const tableData = service.customFields.map((field: CustomField) => {
        let value = '';
        if (field.type === 'boolean') {
          value = field.value ? 'Sim' : 'Não';
        } else if (field.type === 'select') {
          value = String(field.value || 'N/A');
        } else {
          value = String(field.value || 'N/A');
        }
        return [sanitizeText(field.label || field.name || ''), sanitizeText(value)];
      });

      autoTable(doc, {
        head: [['Campo', 'Valor']],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 9,
          cellPadding: 6,
          lineColor: [200, 200, 200],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250]
        },
        columnStyles: {
          0: { cellWidth: 70 },
          1: { cellWidth: 100 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 15;
    }

    // === REGISTRO FOTOGRÁFICO ===
    if (service.photos && service.photos.length > 0) {
      // Nova página para fotos
      if (currentY > 150) {
        doc.addPage();
        currentY = 20;
      }

      currentY = addText(doc, `REGISTRO FOTOGRAFICO (${service.photos.length} fotos)`, margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 10;

      for (let i = 0; i < service.photos.length; i++) {
        // Verificar espaço para nova página
        if (currentY > 200) {
          doc.addPage();
          currentY = 20;
        }

        const photoTitle = service.photoTitles?.[i] || `Foto ${i + 1}`;
        
        currentY = addText(doc, `${i + 1}. ${sanitizeText(photoTitle)}`, margin, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        try {
          const processedImage = await processImage(service.photos[i]);
          
          if (processedImage) {
            const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
            const imageWidth = 120;
            const imageHeight = 80;
            const xPosition = (pageWidth - imageWidth) / 2;
            
            doc.addImage(processedImage, imageFormat, xPosition, currentY, imageWidth, imageHeight);
            currentY += imageHeight + 15;
          } else {
            // Placeholder para foto não disponível
            doc.setDrawColor(200, 200, 200);
            doc.setFillColor(245, 245, 245);
            const boxWidth = 120;
            const boxHeight = 80;
            const boxX = (pageWidth - boxWidth) / 2;
            doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 3, 3, 'FD');
            
            addText(doc, 'FOTO INDISPONIVEL', boxX + (boxWidth / 2), currentY + (boxHeight / 2), {
              fontSize: 10,
              color: [150, 150, 150],
              align: 'center'
            });
            
            currentY += boxHeight + 15;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar foto:', error);
          currentY += 20;
        }
      }
    }

    // === HISTÓRICO DE COMUNICAÇÃO ===
    if (service.messages && service.messages.length > 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 20;
      }

      currentY = addText(doc, 'HISTORICO DE COMUNICACAO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      currentY += 5;

      service.messages.forEach((message) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 20;
        }

        // Caixa da mensagem
        const messageLines = wrapText(doc, sanitizeText(message.message), contentWidth - 20);
        const messageHeight = Math.max(35, messageLines.length * 4 + 20);
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, currentY, contentWidth, messageHeight, 2, 2, 'F');
        doc.setDrawColor(220, 220, 220);
        doc.roundedRect(margin, currentY, contentWidth, messageHeight, 2, 2, 'S');

        // Cabeçalho da mensagem
        let msgY = currentY + 10;
        msgY = addText(doc, `${sanitizeText(message.senderName)} (${sanitizeText(message.senderRole)})`, margin + 10, msgY, {
          fontSize: 9,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        msgY = addText(doc, formatDate(message.timestamp || new Date().toISOString()), margin + 10, msgY, {
          fontSize: 8,
          color: [108, 117, 125]
        });

        msgY = addText(doc, sanitizeText(message.message), margin + 10, msgY, {
          fontSize: 9,
          color: [52, 58, 64],
          maxWidth: contentWidth - 20
        });

        currentY += messageHeight + 10;
      });
    }

    // === AVALIAÇÃO DO CLIENTE ===
    if (service.feedback) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 20;
      }

      currentY = addText(doc, 'AVALIACAO DO CLIENTE', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      doc.setFillColor(255, 248, 225);
      const feedbackHeight = service.feedback.clientComment ? 50 : 30;
      doc.roundedRect(margin, currentY, contentWidth, feedbackHeight, 2, 2, 'F');
      doc.setDrawColor(255, 193, 7);
      doc.roundedRect(margin, currentY, contentWidth, feedbackHeight, 2, 2, 'S');

      let fbY = currentY + 10;
      fbY = addText(doc, `Avaliacao: ${service.feedback.clientRating}/5 estrelas`, margin + 10, fbY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [133, 100, 4]
      });

      if (service.feedback.clientComment) {
        fbY = addText(doc, `Comentario: ${sanitizeText(service.feedback.clientComment)}`, margin + 10, fbY, {
          fontSize: 10,
          color: [133, 100, 4],
          maxWidth: contentWidth - 20
        });
      }

      currentY += feedbackHeight + 15;
    }

    // === TERMO DE CONCLUSÃO E ASSINATURAS ===
    if (service.signatures && (service.signatures.client || service.signatures.technician)) {
      doc.addPage();
      currentY = 20;

      currentY = addText(doc, 'TERMO DE CONCLUSAO E ASSINATURAS', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185],
        align: 'center',
        maxWidth: contentWidth
      });

      currentY += 20;

      const signatureWidth = (contentWidth - 20) / 2;

      // Assinatura do Cliente
      if (service.signatures.client) {
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(margin, currentY, signatureWidth, 70, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(margin, currentY, signatureWidth, 70, 2, 2, 'S');

        let sigY = currentY + 10;
        sigY = addText(doc, 'ASSINATURA DO CLIENTE', margin + 10, sigY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        try {
          const processedSignature = await processImage(service.signatures.client);
          if (processedSignature) {
            doc.addImage(processedSignature, 'PNG', margin + 10, sigY, signatureWidth - 20, 25);
            sigY += 30;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do cliente:', error);
          sigY += 25;
        }

        addText(doc, `Cliente: ${sanitizeText(service.client || 'N/A')}`, margin + 10, sigY, {
          fontSize: 9,
          color: [108, 117, 125]
        });
      }

      // Assinatura do Técnico
      if (service.signatures.technician) {
        const techX = margin + signatureWidth + 20;
        
        doc.setFillColor(248, 249, 250);
        doc.roundedRect(techX, currentY, signatureWidth, 70, 2, 2, 'F');
        doc.setDrawColor(200, 200, 200);
        doc.roundedRect(techX, currentY, signatureWidth, 70, 2, 2, 'S');

        let techY = currentY + 10;
        techY = addText(doc, 'ASSINATURA DO TECNICO', techX + 10, techY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 58, 64]
        });

        try {
          const processedSignature = await processImage(service.signatures.technician);
          if (processedSignature) {
            doc.addImage(processedSignature, 'PNG', techX + 10, techY, signatureWidth - 20, 25);
            techY += 30;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do técnico:', error);
          techY += 25;
        }

        addText(doc, `Tecnico: ${sanitizeText(service.technician?.name || 'N/A')}`, techX + 10, techY, {
          fontSize: 9,
          color: [108, 117, 125]
        });
      }
    }

    // === RODAPÉ EM TODAS AS PÁGINAS ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 20, pageWidth - margin, pageHeight - 20);
      
      // Informações do rodapé
      addText(doc, 'GerenciadorDemandas', margin, pageHeight - 15, {
        fontSize: 8,
        color: [108, 117, 125]
      });

      addText(doc, `Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin + 60, pageHeight - 15, {
        fontSize: 8,
        color: [108, 117, 125]
      });

      addText(doc, `Pagina ${i} de ${pageCount}`, pageWidth - margin - 30, pageHeight - 15, {
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
    throw new Error('Erro ao gerar relatório PDF profissional: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
