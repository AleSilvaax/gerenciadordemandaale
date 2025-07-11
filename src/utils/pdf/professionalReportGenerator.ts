
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';
import { addText, sanitizeText, checkPageBreak } from './pdfHelpers';
import { createCoverPage, addClientSection, addPhotosSection, addSignaturesSection } from './pdfSections';
import { logger } from '@/utils/loggingService';

const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const footerY = pageHeight - 15;

  // Linha separadora
  doc.setDrawColor(189, 195, 199);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  // Informações do rodapé
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(127, 140, 141);
  doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY);
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
};

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    logger.info('Iniciando geração do relatório profissional', { serviceId: service.id });
    
    const doc = new jsPDF();
    const margin = 20;

    // === PÁGINA DE CAPA ===
    createCoverPage(doc, service);
    doc.addPage();
    let currentY = 30;

    // === DADOS DO CLIENTE ===
    currentY = addClientSection(doc, service, currentY);
    currentY += 10;

    // === DESCRIÇÃO DO SERVIÇO ===
    if (service.description) {
      currentY = checkPageBreak(doc, currentY, 40);
      currentY = addText(doc, 'DESCRIÇÃO DO SERVIÇO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(margin, currentY, 210 - margin, currentY);
      currentY += 15;

      currentY = addText(doc, sanitizeText(service.description), margin, currentY, {
        fontSize: 11,
        color: [52, 73, 94],
        maxWidth: 170
      });
      currentY += 20;
    }

    // === CHECKLIST TÉCNICO ===
    if (service.customFields && service.customFields.length > 0) {
      currentY = checkPageBreak(doc, currentY, 60);
      currentY = addText(doc, 'CHECKLIST TÉCNICO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(margin, currentY, 210 - margin, currentY);
      currentY += 15;

      const tableData = service.customFields.map((field: CustomField) => [
        sanitizeText(field.label || 'Campo'),
        sanitizeText(field.value?.toString() || 'N/A')
      ]);

      autoTable(doc, {
        head: [['Item', 'Status/Valor']],
        body: tableData,
        startY: currentY,
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: [248, 249, 250],
        },
        didDrawPage: (data) => {
          const pageHeight = doc.internal.pageSize.getHeight();
          const footerY = pageHeight - 15;
          doc.setDrawColor(189, 195, 199);
          doc.line(margin, footerY - 5, doc.internal.pageSize.getWidth() - margin, footerY - 5);
          doc.setFontSize(8);
          doc.setTextColor(127, 140, 141);
          doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY);
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // === REGISTRO FOTOGRÁFICO ===
    currentY = await addPhotosSection(doc, service, currentY);

    // === HISTÓRICO DE COMUNICAÇÃO ===
    if (service.messages && service.messages.length > 0) {
      currentY = checkPageBreak(doc, currentY, 60);
      currentY = addText(doc, 'HISTÓRICO DE COMUNICAÇÃO', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(margin, currentY, 210 - margin, currentY);
      currentY += 15;

      service.messages.slice(0, 5).forEach((message, index) => {
        currentY = checkPageBreak(doc, currentY, 30);
        
        currentY = addText(doc, `${index + 1}. ${sanitizeText(message.message)}`, margin, currentY, {
          fontSize: 10,
          color: [52, 73, 94],
          maxWidth: 170
        });
        
        currentY = addText(doc, `Por: ${sanitizeText(message.senderName)} - ${formatDate(message.timestamp)}`, margin + 10, currentY, {
          fontSize: 8,
          color: [127, 140, 141],
          maxWidth: 160
        });
        currentY += 5;
      });
      currentY += 15;
    }

    // === AVALIAÇÃO DO CLIENTE ===
    if (service.feedback) {
      currentY = checkPageBreak(doc, currentY, 40);
      currentY = addText(doc, 'AVALIAÇÃO DO CLIENTE', margin, currentY, {
        fontSize: 16,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      doc.setDrawColor(41, 128, 185);
      doc.setLineWidth(1);
      doc.line(margin, currentY, 210 - margin, currentY);
      currentY += 15;

      if (service.feedback.clientRating) {
        currentY = addText(doc, `Nota: ${service.feedback.clientRating}/5`, margin, currentY, {
          fontSize: 12,
          fontStyle: 'bold',
          color: [52, 73, 94]
        });
      }

      if (service.feedback.clientComment) {
        currentY = addText(doc, `Comentário: ${sanitizeText(service.feedback.clientComment)}`, margin, currentY, {
          fontSize: 11,
          color: [52, 73, 94],
          maxWidth: 170
        });
      }
      currentY += 15;
    }

    // === ASSINATURAS ===
    currentY = await addSignaturesSection(doc, service, currentY);

    // === ADICIONAR RODAPÉ COM NÚMERO TOTAL DE PÁGINAS ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const footerY = doc.internal.pageSize.getHeight() - 15;
      
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }

    const fileName = `relatorio_servico_${sanitizeText(service.number || service.id.substring(0, 8))}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    logger.info('Relatório profissional gerado com sucesso', { fileName });

  } catch (error) {
    logger.error('Erro ao gerar relatório profissional', { error: error instanceof Error ? error.message : 'Erro desconhecido' });
    throw new Error('Erro ao gerar relatório PDF profissional: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
