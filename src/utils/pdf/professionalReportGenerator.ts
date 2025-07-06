
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

// Função para processar imagens com melhor compatibilidade
const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);
    
    if (imageUrl.startsWith('data:image')) {
      console.log('[PDF] Imagem já em base64');
      return imageUrl;
    }

    // Tentar diferentes métodos para carregar a imagem
    const response = await fetch(imageUrl, {
      mode: 'cors',
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*',
        'Cache-Control': 'no-cache'
      }
    });

    if (!response.ok) {
      console.warn('[PDF] Erro ao carregar imagem via fetch:', response.status);
      return null;
    }

    const blob = await response.blob();
    console.log('[PDF] Blob carregado, tamanho:', blob.size, 'tipo:', blob.type);
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        console.log('[PDF] Conversão para base64 concluída');
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('[PDF] Erro na conversão:', error);
        resolve(null);
      };
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

  return y + (lines.length * lineHeight) + 3;
};

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório profissional minimalista');
    
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);
    let currentY = 30;

    // === CABEÇALHO MINIMALISTA ===
    // Linha superior
    doc.setDrawColor(52, 152, 219);
    doc.setLineWidth(2);
    doc.line(margin, 25, pageWidth - margin, 25);

    // Título principal
    currentY = addText(doc, 'RELATÓRIO DE SERVIÇO', margin, currentY, {
      fontSize: 20,
      fontStyle: 'bold',
      color: [52, 73, 94],
      maxWidth: contentWidth,
      align: 'center'
    });

    currentY += 15;

    // === INFORMAÇÕES PRINCIPAIS ===
    // Título do serviço
    currentY = addText(doc, sanitizeText(service.title), margin, currentY, {
      fontSize: 16,
      fontStyle: 'bold',
      color: [44, 62, 80],
      maxWidth: contentWidth,
      align: 'center'
    });

    currentY += 10;

    // OS e Status em linha
    const osText = `OS: ${sanitizeText(service.number || service.id.substring(0, 8))}`;
    const statusText = sanitizeText(service.status).toUpperCase();
    
    addText(doc, osText, margin, currentY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [52, 73, 94]
    });

    // Status com cor
    const statusColors: Record<string, [number, number, number]> = {
      'pendente': [241, 196, 15],
      'concluido': [46, 204, 113],
      'cancelado': [231, 76, 60]
    };
    
    const statusColor = statusColors[service.status] || [149, 165, 166];
    addText(doc, statusText, pageWidth - margin - 40, currentY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: statusColor,
      align: 'right'
    });

    currentY += 20;

    // === DADOS DO CLIENTE ===
    currentY = addText(doc, 'DADOS DO CLIENTE', margin, currentY, {
      fontSize: 14,
      fontStyle: 'bold',
      color: [52, 152, 219]
    });

    currentY += 5;

    // Linha separadora
    doc.setDrawColor(189, 195, 199);
    doc.setLineWidth(0.5);
    doc.line(margin, currentY, pageWidth - margin, currentY);
    currentY += 10;

    // Informações do cliente em duas colunas
    const leftCol = margin;
    const rightCol = margin + (contentWidth / 2);

    let leftY = currentY;
    let rightY = currentY;

    if (service.client) {
      leftY = addText(doc, `Cliente: ${sanitizeText(service.client)}`, leftCol, leftY, {
        fontSize: 10,
        color: [52, 73, 94]
      });
    }

    if (service.location) {
      rightY = addText(doc, `Local: ${sanitizeText(service.location)}`, rightCol, rightY, {
        fontSize: 10,
        color: [52, 73, 94]
      });
    }

    if (service.address) {
      leftY = addText(doc, `Endereço: ${sanitizeText(service.address)}`, leftCol, leftY, {
        fontSize: 10,
        color: [52, 73, 94]
      });
    }

    if (service.city) {
      rightY = addText(doc, `Cidade: ${sanitizeText(service.city)}`, rightCol, rightY, {
        fontSize: 10,
        color: [52, 73, 94]
      });
    }

    currentY = Math.max(leftY, rightY) + 15;

    // === DESCRIÇÃO DO SERVIÇO ===
    if (service.description) {
      currentY = addText(doc, 'DESCRIÇÃO DO SERVIÇO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      currentY = addText(doc, sanitizeText(service.description), margin, currentY, {
        fontSize: 10,
        color: [52, 73, 94],
        maxWidth: contentWidth
      });

      currentY += 15;
    }

    // === CHECKLIST TÉCNICO ===
    if (service.customFields && service.customFields.length > 0) {
      if (currentY > 200) {
        doc.addPage();
        currentY = 30;
      }

      currentY = addText(doc, 'CHECKLIST TÉCNICO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 10;

      const tableData = service.customFields.map((field: CustomField) => {
        let value = '';
        if (field.type === 'boolean') {
          value = field.value ? 'Sim' : 'Não';
        } else if (field.type === 'select') {
          value = String(field.value || 'N/A');
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
          fontSize: 9,
          cellPadding: 4,
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
          0: { cellWidth: 80 },
          1: { cellWidth: 90 }
        },
        margin: { left: margin, right: margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // === REGISTRO FOTOGRÁFICO ===
    if (service.photos && service.photos.length > 0) {
      if (currentY > 150) {
        doc.addPage();
        currentY = 30;
      }

      currentY = addText(doc, `REGISTRO FOTOGRÁFICO (${service.photos.length} fotos)`, margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      for (let i = 0; i < service.photos.length; i++) {
        if (currentY > 200) {
          doc.addPage();
          currentY = 30;
        }

        const photoTitle = service.photoTitles?.[i] || `Foto ${i + 1}`;
        
        currentY = addText(doc, `${i + 1}. ${sanitizeText(photoTitle)}`, margin, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });

        try {
          console.log('[PDF] Processando foto:', service.photos[i]);
          const processedImage = await processImage(service.photos[i]);
          
          if (processedImage) {
            console.log('[PDF] Imagem processada com sucesso');
            const imageFormat = processedImage.includes('data:image/png') ? 'PNG' : 'JPEG';
            const imageWidth = 100;
            const imageHeight = 70;
            const xPosition = (pageWidth - imageWidth) / 2;
            
            doc.addImage(processedImage, imageFormat, xPosition, currentY, imageWidth, imageHeight);
            currentY += imageHeight + 15;
            console.log('[PDF] Imagem adicionada ao PDF');
          } else {
            console.warn('[PDF] Não foi possível processar a imagem');
            // Placeholder para foto não disponível
            doc.setDrawColor(189, 195, 199);
            doc.setFillColor(236, 240, 241);
            const boxWidth = 100;
            const boxHeight = 70;
            const boxX = (pageWidth - boxWidth) / 2;
            doc.rect(boxX, currentY, boxWidth, boxHeight, 'FD');
            
            addText(doc, 'FOTO NÃO DISPONÍVEL', boxX + (boxWidth / 2), currentY + (boxHeight / 2), {
              fontSize: 10,
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
      if (currentY > 200) {
        doc.addPage();
        currentY = 30;
      }

      currentY = addText(doc, 'HISTÓRICO DE COMUNICAÇÃO', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      service.messages.forEach((message) => {
        if (currentY > 250) {
          doc.addPage();
          currentY = 30;
        }

        // Data e remetente
        currentY = addText(doc, `${sanitizeText(message.senderName)} - ${formatDate(message.timestamp || new Date().toISOString())}`, margin, currentY, {
          fontSize: 9,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });

        // Mensagem
        currentY = addText(doc, sanitizeText(message.message), margin, currentY, {
          fontSize: 9,
          color: [52, 73, 94],
          maxWidth: contentWidth
        });

        currentY += 8;
      });

      currentY += 10;
    }

    // === AVALIAÇÃO DO CLIENTE ===
    if (service.feedback) {
      if (currentY > 220) {
        doc.addPage();
        currentY = 30;
      }

      currentY = addText(doc, 'AVALIAÇÃO DO CLIENTE', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
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

      currentY += 15;
    }

    // === ASSINATURAS ===
    if (service.signatures && (service.signatures.client || service.signatures.technician)) {
      if (currentY > 180) {
        doc.addPage();
        currentY = 30;
      }

      currentY = addText(doc, 'ASSINATURAS', margin, currentY, {
        fontSize: 14,
        fontStyle: 'bold',
        color: [52, 152, 219]
      });

      currentY += 5;
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 20;

      const signatureWidth = (contentWidth - 20) / 2;

      // Assinatura do Cliente
      if (service.signatures.client) {
        currentY = addText(doc, 'Cliente', margin, currentY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });

        try {
          const processedSignature = await processImage(service.signatures.client);
          if (processedSignature) {
            const sigWidth = 60;
            const sigHeight = 30;
            const sigX = margin + (signatureWidth - sigWidth) / 2;
            doc.addImage(processedSignature, 'PNG', sigX, currentY, sigWidth, sigHeight);
            currentY += sigHeight + 5;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do cliente:', error);
          currentY += 35;
        }

        addText(doc, sanitizeText(service.client || 'N/A'), margin, currentY, {
          fontSize: 9,
          color: [127, 140, 141],
          maxWidth: signatureWidth,
          align: 'center'
        });
      }

      // Assinatura do Técnico
      if (service.signatures.technician) {
        let techY = currentY - 70; // Posicionar ao lado da assinatura do cliente
        const techX = margin + signatureWidth + 20;
        
        techY = addText(doc, 'Técnico', techX, techY, {
          fontSize: 11,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });

        try {
          const processedSignature = await processImage(service.signatures.technician);
          if (processedSignature) {
            const sigWidth = 60;
            const sigHeight = 30;
            const sigX = techX + (signatureWidth - sigWidth) / 2;
            doc.addImage(processedSignature, 'PNG', sigX, techY, sigWidth, sigHeight);
            techY += sigHeight + 5;
          }
        } catch (error) {
          console.error('[PDF] Erro ao processar assinatura do técnico:', error);
          techY += 35;
        }

        addText(doc, sanitizeText(service.technician?.name || 'N/A'), techX, techY, {
          fontSize: 9,
          color: [127, 140, 141],
          maxWidth: signatureWidth,
          align: 'center'
        });
      }

      currentY += 20;
    }

    // === RODAPÉ ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Linha separadora
      doc.setDrawColor(189, 195, 199);
      doc.setLineWidth(0.3);
      doc.line(margin, pageHeight - 25, pageWidth - margin, pageHeight - 25);
      
      // Informações do rodapé
      addText(doc, `Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, pageHeight - 20, {
        fontSize: 8,
        color: [127, 140, 141]
      });

      addText(doc, `Página ${i} de ${pageCount}`, pageWidth - margin - 30, pageHeight - 20, {
        fontSize: 8,
        color: [127, 140, 141]
      });
    }

    // Salvar PDF
    const fileName = `relatorio_servico_${sanitizeText(service.number || service.id.substring(0, 8))}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    console.log('[PDF] Relatório profissional minimalista gerado com sucesso:', fileName);

  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório profissional:', error);
    throw new Error('Erro ao gerar relatório PDF profissional: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
