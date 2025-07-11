
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';
import { addText, sanitizeText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';

export const createCoverPage = (doc: jsPDF, service: Service): void => {
  const pageWidth = 210;
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Cabeçalho moderno
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 70, 'F');

  // Título principal
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO DE SERVIÇO', pageWidth / 2, 35, { align: 'center' });

  // Linha decorativa
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(2);
  doc.line(60, 45, 150, 45);

  let currentY = 100;

  // Título do serviço
  currentY = addText(doc, sanitizeText(service.title), margin, currentY, {
    fontSize: 20,
    fontStyle: 'bold',
    color: [52, 73, 94],
    maxWidth: contentWidth,
    align: 'center'
  });

  currentY += 15;

  // Informações principais em caixas
  const boxWidth = (contentWidth - 10) / 2;
  const boxHeight = 40;
  const boxSpacing = 10;
  const totalBoxesWidth = (boxWidth * 2) + boxSpacing;
  const leftX = (pageWidth - totalBoxesWidth) / 2;
  const rightX = leftX + boxWidth + boxSpacing;
  
  // Caixa OS
  doc.setFillColor(236, 240, 241);
  doc.setDrawColor(189, 195, 199);
  doc.roundedRect(leftX, currentY, boxWidth, boxHeight, 5, 5, 'FD');
  
  addText(doc, 'ORDEM DE SERVIÇO', leftX + 10, currentY + 15, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [52, 73, 94]
  });
  
  addText(doc, sanitizeText(service.number || service.id.substring(0, 8)), leftX + 10, currentY + 28, {
    fontSize: 14,
    color: [41, 128, 185]
  });

  // Caixa Data
  doc.setFillColor(236, 240, 241);
  doc.roundedRect(rightX, currentY, boxWidth, boxHeight, 5, 5, 'FD');
  
  addText(doc, 'DATA DE GERAÇÃO', rightX + 10, currentY + 15, {
    fontSize: 12,
    fontStyle: 'bold',
    color: [52, 73, 94]
  });
  
  addText(doc, new Date().toLocaleDateString('pt-BR'), rightX + 10, currentY + 28, {
    fontSize: 14,
    color: [41, 128, 185]
  });

  currentY += 60;

  // Status destacado
  const statusColors: Record<string, [number, number, number]> = {
    'pendente': [241, 196, 15],
    'concluido': [46, 204, 113],
    'cancelado': [231, 76, 60]
  };
  
  const statusColor = statusColors[service.status] || [149, 165, 166];
  const statusText = sanitizeText(service.status).toUpperCase();
  
  doc.setFillColor(statusColor[0], statusColor[1], statusColor[2]);
  doc.roundedRect(pageWidth/2 - 40, currentY, 80, 20, 5, 5, 'F');
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text(statusText, pageWidth/2, currentY + 13, { align: 'center' });

  currentY += 40;

  // Informações do cliente
  if (service.client || service.location) {
    doc.setFillColor(247, 249, 250);
    doc.roundedRect(margin, currentY, contentWidth, 50, 8, 8, 'F');
    
    currentY += 15;
    
    if (service.client) {
      currentY = addText(doc, `Cliente: ${sanitizeText(service.client)}`, margin + 15, currentY, {
        fontSize: 13,
        color: [52, 73, 94],
        maxWidth: contentWidth - 30
      });
    }

    if (service.location) {
      currentY = addText(doc, `Local: ${sanitizeText(service.location)}`, margin + 15, currentY, {
        fontSize: 13,
        color: [52, 73, 94],
        maxWidth: contentWidth - 30
      });
    }
  }
};

export const addClientSection = (doc: jsPDF, service: Service, startY: number): number => {
  const margin = 20;
  const pageWidth = 210;
  const contentWidth = pageWidth - (margin * 2);
  let currentY = startY;

  // Título da seção
  currentY = addText(doc, 'INFORMAÇÕES DO CLIENTE', margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [41, 128, 185]
  });

  // Linha divisória
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 15;

  // Fundo da seção
  doc.setFillColor(248, 249, 250);
  doc.roundedRect(margin, currentY, contentWidth, 60, 5, 5, 'F');

  currentY += 15;

  // Informações em grid
  const leftCol = margin + 15;
  const rightCol = margin + (contentWidth / 2);
  let leftY = currentY;
  let rightY = currentY;

  if (service.client) {
    leftY = addText(doc, `Cliente: ${sanitizeText(service.client)}`, leftCol, leftY, {
      fontSize: 11,
      color: [52, 73, 94]
    });
    leftY += 5;
  }

  if (service.location) {
    rightY = addText(doc, `Local: ${sanitizeText(service.location)}`, rightCol, rightY, {
      fontSize: 11,
      color: [52, 73, 94]
    });
    rightY += 5;
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

  return Math.max(leftY, rightY) + 15;
};

export const addPhotosSection = async (doc: jsPDF, service: Service, startY: number): Promise<number> => {
  if (!service.photos || service.photos.length === 0) return startY;

  const margin = 20;
  const pageWidth = 210;
  let currentY = checkPageBreak(doc, startY, 60);

  currentY = addText(doc, `REGISTRO FOTOGRÁFICO (${service.photos.length} fotos)`, margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [41, 128, 185]
  });

  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
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
        
        // Borda da imagem
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.rect(xPosition - 2, currentY - 2, imageWidth + 4, imageHeight + 4);
        
        doc.addImage(processedImage, imageFormat, xPosition, currentY, imageWidth, imageHeight);
        currentY += imageHeight + 15;
      } else {
        // Placeholder melhorado
        doc.setDrawColor(189, 195, 199);
        doc.setFillColor(248, 249, 250);
        const boxWidth = 120;
        const boxHeight = 80;
        const boxX = (pageWidth - boxWidth) / 2;
        doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 5, 5, 'FD');
        
        addText(doc, 'IMAGEM NÃO DISPONÍVEL', boxX + (boxWidth / 2), currentY + (boxHeight / 2), {
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

  return currentY;
};

export const addSignaturesSection = async (doc: jsPDF, service: Service, startY: number): Promise<number> => {
  if (!service.signatures || (!service.signatures.client && !service.signatures.technician)) {
    return startY;
  }

  const margin = 20;
  const pageWidth = 210;
  let currentY = checkPageBreak(doc, startY, 120);

  currentY = addText(doc, 'ASSINATURAS', margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [41, 128, 185]
  });

  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);
  doc.line(margin, currentY, pageWidth - margin, currentY);
  currentY += 25;

  // --- NOVA LÓGICA DE CÁLCULO ---
  const sigWidth = 75; // Largura de cada caixa de assinatura
  const sigHeight = 40; // Altura de cada caixa de assinatura
  const spacing = 15; // Espaçamento entre as caixas
  const totalSignaturesWidth = (sigWidth * 2) + spacing;
  const startX = (pageWidth - totalSignaturesWidth) / 2; // Ponto X inicial para centralizar o conjunto

  const leftColumnX = startX;
  const rightColumnX = startX + sigWidth + spacing;
  
const drawSignature = async (
    type: 'CLIENTE' | 'TÉCNICO',
    signatureData: string | undefined,
    name: string | undefined,
    columnX: number
  ) => {
    if (!signatureData) return;

    // Título (CLIENTE ou TÉCNICO)
    addText(doc, type, columnX + (sigWidth / 2), currentY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [52, 73, 94],
      align: 'center'
    });

    try {
      const processedSignature = await processImage(signatureData);
      if (processedSignature) {
        const imageY = currentY + 15;
        
        // Borda da assinatura
        doc.setDrawColor(189, 195, 199);
        doc.setLineWidth(0.5);
        doc.rect(columnX - 2, imageY - 2, sigWidth + 4, sigHeight + 4, 'S');
        
        // Imagem da assinatura
        doc.addImage(processedSignature, 'PNG', columnX, imageY, sigWidth, sigHeight);
      }
    } catch (error) {
      console.error(`[PDF] Erro ao processar assinatura do ${type}:`, error);
    }

    // Nome abaixo da assinatura
    addText(doc, sanitizeText(name || 'N/A'), columnX + (sigWidth / 2), currentY + 70, {
      fontSize: 10,
      color: [127, 140, 141],
      align: 'center'
    });
  };

  // Desenha as duas assinaturas
  await drawSignature('CLIENTE', service.signatures.client, service.client, leftColumnX);
  await drawSignature('TÉCNICO', service.signatures.technician, service.technician?.name, rightColumnX);

  return currentY + 85;
};
