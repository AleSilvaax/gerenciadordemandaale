
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';

// Função para sanitizar texto
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

// Função para quebrar texto
const wrapText = (doc: jsPDF, text: string, maxWidth: number): string[] => {
  if (!text) return [''];
  const sanitized = sanitizeText(text);
  return doc.splitTextToSize(sanitized, maxWidth);
};

// Processamento de imagens melhorado
const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);
    
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    // Carregar imagem com headers apropriados
    const response = await fetch(imageUrl, {
      mode: 'cors',
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*'
      }
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

// Função para verificar se precisa de nova página
const checkPageBreak = (doc: jsPDF, currentY: number, requiredHeight: number = 30): number => {
  if (currentY + requiredHeight > 270) {
    doc.addPage();
    return 30;
  }
  return currentY;
};

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório profissional');
    
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // === PÁGINA DE CAPA ===
    // Cabeçalho da capa
    doc.setFillColor(52, 152, 219);
    doc.rect(0, 0, pageWidth, 60, 'F');

    // Título principal centralizado
    doc.setFontSize(24);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text('RELATÓRIO DE SERVIÇO', pageWidth / 2, 35, { align: 'center' });

    // Informações da capa
    let capaY = 90;
    
    // Título do serviço
    capaY = addText(doc, sanitizeText(service.title), margin, capaY, {
      fontSize: 18,
      fontStyle: 'bold',
      color: [52, 73, 94],
      maxWidth: contentWidth,
      align: 'center'
    });

    capaY += 10;

    // OS e Data
    const osText = `OS: ${sanitizeText(service.number || service.id.substring(0, 8))}`;
    const dataText = `Data: ${new Date().toLocaleDateString('pt-BR')}`;
    
    capaY = addText(doc, osText, margin, capaY, {
      fontSize: 14,
      color: [52, 73, 94],
      maxWidth: contentWidth,
      align: 'center'
    });

    capaY = addText(doc, dataText, margin, capaY, {
      fontSize: 14,
      color: [52, 73, 94],
      maxWidth: contentWidth,
      align: 'center'
    });

    capaY += 20;

    // Status com destaque
    const statusColors: Record<string, [number, number, number]> = {
      'pendente': [241, 196, 15],
      'concluido': [46, 204, 113],
      'cancelado': [231, 76, 60]
    };
    
    const statusColor = statusColors[service.status] || [149, 165, 166];
    const statusText = sanitizeText(service.status).toUpperCase();
    
    doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(pageWidth/2 - 30, capaY, 60, 15, 3, 3, 'F');
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.text(statusText, pageWidth/2, capaY + 10, { align: 'center' });

    // Informações do cliente na capa
    capaY += 40;
    if (service.client) {
      capaY = addText(doc, `Cliente: ${sanitizeText(service.client)}`, margin, capaY, {
        fontSize: 12,
        color: [52, 73, 94],
        maxWidth: contentWidth,
        align: 'center'
      });
    }

    if (service.location) {
      capaY = addText(doc, `Local: ${sanitizeText(service.location)}`, margin, capaY, {
        fontSize: 12,
        color: [52, 73, 94],
        maxWidth: contentWidth,
        align: 'center'
      });
    }

    // === NOVA PÁGINA - CONTEÚDO ===
    doc.addPage();
    let currentY = 30;

    // === DADOS DO CLIENTE ===
    currentY = addText(doc, 'DADOS DO CLIENTE', margin, currentY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [52, 152, 219]
    });

    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(1);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 15;

    // Informações em duas colunas
    const leftCol = margin;
    const rightCol = margin + (contentWidth / 2);
    let leftY = currentY;
    let rightY = currentY;

    if (service.client) {
      leftY = addText(doc, `Cliente: ${sanitizeText(service.client)}`, leftCol, leftY, {
        fontSize: 11,
        color: [52, 73, 94]
      });
    }

    if (service.location) {
      rightY = addText(doc, `Local: ${sanitizeText(service.location)}`, rightCol, rightY, {
        fontSize: 11,
        color: [52, 73, 94]
      });
    }

    if (service.address) {
      leftY = addText(doc, `Endereço: ${sanitizeText(service.address)}`, leftCol, leftY, {
        fontSize: 11,
        color: [52, 73, 94]
      });
    }

    if (service.city) {
      rightY = addText(doc, `Cidade: ${sanitizeText(service.city)}`, rightCol, rightY, {
        fontSize: 11,
        color: [52, 73, 94]
      });
    }

    currentY = Math.max(leftY, rightY) + 20;

    // === DESCRIÇÃO DO SERVIÇO ===
    if (service.description) {
      currentY = checkPageBreak(doc, currentY, 40);
      
      currentY = addText(doc, 'DESCRIÇÃO DO SERVIÇO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      currentY = addText(doc, sanitizeText(service.description), margin, currentY, {
        fontSize: 11,
        color: [52, 73, 94],
        maxWidth: contentWidth
      });

      currentY += 20;
    }

    // === CHECKLIST TÉCNICO ===
    if (service.customFields && service.customFields.length > 0) {
      currentY = checkPageBreak(doc, currentY, 60);

      currentY = addText(doc, 'CHECKLIST TÉCNICO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      const tableData = service.customFields.map((field: CustomField) => {
        let value = '';
        if (field.type === 'boolean') {
          value = field.value ? 'Sim' : 'Não';
        } else {
          value = String(field.value || 'N/A');
        }
        return [sanitizeText(field.label || ''), sanitizeText(value)];
      });

      autoTable(doc, {
        head: [['Item', 'Status/Valor']],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [189, 195, 199],
          lineWidth: 0.3
        },
        headStyles: {
          fillColor: [52, 152, 219],
          textColor: [255, 255, 255],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 246, 250]
        },
        columnStyles: {
          0: { cellWidth: 90 },
          1: { cellWidth: 80 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // === REGISTRO FOTOGRÁFICO ===
    if (service.photos && service.photos.length > 0) {
      currentY = checkPageBreak(doc, currentY, 60);

      currentY = addText(doc, `REGISTRO FOTOGRÁFICO (${service.photos.length} fotos)`, margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 20;

      for (let i = 0; i < service.photos.length; i++) {
        currentY = checkPageBreak(doc, currentY, 100);

        const photoTitle = service.photoTitles?.[i] || `Foto ${i + 1}`;
        
        currentY = addText(doc, `${i + 1}. ${sanitizeText(photoTitle)}`, margin, currentY, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 73, 94]
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
            doc.setDrawColor(189, 195, 199);
            doc.setFillColor(236, 240, 241);
            const boxWidth = 120;
            const boxHeight = 80;
            const boxX = (pageWidth - boxWidth) / 2;
            doc.rect(boxX, currentY, boxWidth, boxHeight, 'FD');
            
            addText(doc, 'FOTO NÃO DISPONÍVEL', boxX + (boxWidth / 2), currentY + (boxHeight / 2), {
              fontSize: 11,
              color: [127, 140, 141],
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
      currentY = checkPageBreak(doc, currentY, 60);

      currentY = addText(doc, 'HISTÓRICO DE COMUNICAÇÃO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      service.messages.forEach((message) => {
        currentY = checkPageBreak(doc, currentY, 25);

        // Data e remetente
        currentY = addText(doc, `${sanitizeText(message.senderName)} - ${formatDate(message.timestamp || new Date().toISOString())}`, margin, currentY, {
          fontSize: 10,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });

        // Mensagem
        currentY = addText(doc, sanitizeText(message.message), margin, currentY, {
          fontSize: 10,
          color: [52, 73, 94],
          maxWidth: contentWidth
        });

        currentY += 10;
      });

      currentY += 10;
    }

    // === AVALIAÇÃO DO CLIENTE ===
    if (service.feedback) {
      currentY = checkPageBreak(doc, currentY, 40);

      currentY = addText(doc, 'AVALIAÇÃO DO CLIENTE', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      currentY = addText(doc, `Avaliação: ${service.feedback.clientRating}/5 estrelas`, margin, currentY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [52, 73, 94]
      });

      if (service.feedback.clientComment) {
        currentY = addText(doc, `Comentário: ${sanitizeText(service.feedback.clientComment)}`, margin, currentY, {
          fontSize: 10,
          color: [52, 73, 94],
          maxWidth: contentWidth
        });
      }

      currentY += 20;
    }

    // === ASSINATURAS ===
    if (service.signatures && (service.signatures.client || service.signatures.technician)) {
      currentY = checkPageBreak(doc, currentY, 100);

      currentY = addText(doc, 'ASSINATURAS', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 25;

      const signatureWidth = (contentWidth - 20) / 2;
      const signatureY = currentY;

      // Assinatura do Cliente
      if (service.signatures.client) {
        addText(doc, 'Cliente', margin, signatureY, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 73, 94],
          align: 'center',
          maxWidth: signatureWidth
        });

        try {
          const processedSignature = await processImage(service.signatures.client);
          if (processedSignature) {
            const sigWidth = 80;
            const sigHeight = 40;
            const sigX = margin + (signatureWidth - sigWidth) / 2;
            doc.addImage(processedSignature, 'PNG', sigX, signatureY + 15, sigWidth, sigHeight);
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do cliente:', error);
        }

        addText(doc, sanitizeText(service.client || 'N/A'), margin, signatureY + 65, {
          fontSize: 10,
          color: [127, 140, 141],
          maxWidth: signatureWidth,
          align: 'center'
        });
      }

      // Assinatura do Técnico (lado direito, mesma altura)
      if (service.signatures.technician) {
        const techX = margin + signatureWidth + 20;
        
        addText(doc, 'Técnico', techX, signatureY, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 73, 94],
          align: 'center',
          maxWidth: signatureWidth
        });

        try {
          const processedSignature = await processImage(service.signatures.technician);
          if (processedSignature) {
            const sigWidth = 80;
            const sigHeight = 40;
            const sigX = techX + (signatureWidth - sigWidth) / 2;
            doc.addImage(processedSignature, 'PNG', sigX, signatureY + 15, sigWidth, sigHeight);
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do técnico:', error);
        }

        addText(doc, sanitizeText(service.technician?.name || 'N/A'), techX, signatureY + 65, {
          fontSize: 10,
          color: [127, 140, 141],
          maxWidth: signatureWidth,
          align: 'center'
        });
      }

      currentY += 85;
    }

    // === RODAPÉ EM TODAS AS PÁGINAS ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora do rodapé
      doc.setDrawColor(189, 195, 199);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Informações do rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(127, 140, 141);
      doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 15);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 30, pageHeight - 15);
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
