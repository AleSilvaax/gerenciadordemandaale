
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';
import { addText, sanitizeText, checkPageBreak } from './pdfHelpers';
import { createCoverPage, addClientSection, addPhotosSection, addSignaturesSection } from './pdfSections';

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    console.log('[PDF] Iniciando geração do relatório profissional');
    
    const doc = new jsPDF();
    const pageWidth = 210;
    const pageHeight = 297;
    const margin = 20;
    const contentWidth = pageWidth - (margin * 2);

    // === PÁGINA DE CAPA ===
    createCoverPage(doc, service);

    // === NOVA PÁGINA - CONTEÚDO ===
    doc.addPage();
    let currentY = 30;

    // === DADOS DO CLIENTE ===
    currentY = addClientSection(doc, service, currentY);
    currentY += 20;

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
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      // Fundo da descrição
      const descHeight = Math.max(40, service.description.length / 8);
      doc.setFillColor(248, 249, 250);
      doc.roundedRect(margin, currentY, contentWidth, descHeight, 5, 5, 'F');

      currentY += 10;
      currentY = addText(doc, sanitizeText(service.description), margin + 15, currentY, {
        fontSize: 11,
        color: [52, 73, 94],
        maxWidth: contentWidth - 30
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
        marginBottom: 35, // Garante que a tabela não chegue perto do rodapé
        styles: {
          fontSize: 10,
          cellPadding: 5,
          lineColor: [189, 195, 199],
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
          0: { cellWidth: 90 },
          1: { cellWidth: 80 }
        },
        margin: { left: margin, right: margin }
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
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      service.messages.forEach((message) => {
        currentY = checkPageBreak(doc, currentY, 30);

        // Fundo da mensagem
        doc.setFillColor(248, 249, 250);
        const msgHeight = Math.max(25, message.message.length / 10);
        doc.roundedRect(margin, currentY, contentWidth, msgHeight, 3, 3, 'F');

        currentY += 8;

        // Data e remetente
        currentY = addText(doc, `${sanitizeText(message.senderName)} - ${formatDate(message.timestamp || new Date().toISOString())}`, margin + 10, currentY, {
          fontSize: 10,
          fontStyle: 'bold',
          color: [41, 128, 185]
        });

        // Mensagem
        currentY = addText(doc, sanitizeText(message.message), margin + 10, currentY, {
          fontSize: 10,
          color: [52, 73, 94],
          maxWidth: contentWidth - 20
        });

        currentY += 15;
      });

      currentY += 10;
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
      doc.line(margin, currentY, pageWidth - margin, currentY);
      currentY += 15;

      // Fundo da avaliação
      doc.setFillColor(248, 249, 250);
      const feedbackHeight = service.feedback.clientComment ? 50 : 30;
      doc.roundedRect(margin, currentY, contentWidth, feedbackHeight, 5, 5, 'F');

      currentY += 10;

      currentY = addText(doc, `Avaliação: ${service.feedback.clientRating}/5 estrelas`, margin + 15, currentY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [41, 128, 185]
      });

      if (service.feedback.clientComment) {
        currentY = addText(doc, `Comentário: ${sanitizeText(service.feedback.clientComment)}`, margin + 15, currentY, {
          fontSize: 10,
          color: [52, 73, 94],
          maxWidth: contentWidth - 30
        });
      }

      currentY += 20;
    }

    // === ASSINATURAS ===
    currentY = await addSignaturesSection(doc, service, currentY);

    // === RODAPÉ EM TODAS AS PÁGINAS ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Garantir que o rodapé não sobreponha o conteúdo
      const footerY = pageHeight - 20;
      
      // Linha separadora do rodapé
      doc.setDrawColor(189, 195, 199);
      doc.setLineWidth(0.5);
      doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
      
      // Informações do rodapé
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(127, 140, 141);
      doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin - 30, footerY);
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
