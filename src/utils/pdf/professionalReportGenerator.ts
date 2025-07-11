// Em: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes';
import { formatDate } from '@/utils/formatters';
import { addText, sanitizeText, checkPageBreak } from './pdfHelpers';
import { createCoverPage, addClientSection, addPhotosSection, addSignaturesSection } from './pdfSections';

// --- NOVA FUNÇÃO PARA O RODAPÉ ---
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
    console.log('[PDF] Iniciando geração do relatório profissional');
    
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
      // ... (código da descrição continua o mesmo)
      currentY = checkPageBreak(doc, currentY, 40);
      currentY = addText(doc, 'DESCRIÇÃO DO SERVIÇO', /* ... */);
      // ...
      currentY += 20;
    }

    // === CHECKLIST TÉCNICO (COM A CORREÇÃO) ===
    if (service.customFields && service.customFields.length > 0) {
      currentY = checkPageBreak(doc, currentY, 60);
      currentY = addText(doc, 'CHECKLIST TÉCNICO', /* ... */);
      currentY += 15;

      const tableData = service.customFields.map(/* ... */);

      autoTable(doc, {
        head: [['Item', 'Status/Valor']],
        body: tableData,
        startY: currentY,
        // O hook didDrawPage garante que o rodapé seja adicionado a cada página criada pela tabela
        didDrawPage: (data) => {
          // Note que ainda não sabemos o total de páginas, então adicionamos o rodapé sem o total
          const pageHeight = doc.internal.pageSize.getHeight();
          const footerY = pageHeight - 15;
          doc.setDrawColor(189, 195, 199);
          doc.line(margin, footerY - 5, doc.internal.pageSize.getWidth() - margin, footerY - 5);
          doc.setFontSize(8);
          doc.setTextColor(127, 140, 141);
          doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY);
        },
        // A margem inferior garante que a tabela não escreva sobre a área do rodapé
        marginBottom: 30, 
      });

      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // === REGISTRO FOTOGRÁFICO ===
    currentY = await addPhotosSection(doc, service, currentY);

    // === HISTÓRICO DE COMUNICAÇÃO ===
    if (service.messages && service.messages.length > 0) {
       // ... (código do histórico continua o mesmo) ...
    }

    // === AVALIAÇÃO DO CLIENTE ===
    if (service.feedback) {
       // ... (código do feedback continua o mesmo) ...
    }

    // === ASSINATURAS ===
    currentY = await addSignaturesSection(doc, service, currentY);

    // === ADICIONAR RODAPÉ COM NÚMERO TOTAL DE PÁGINAS (AGORA NO FINAL) ===
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      const pageWidth = doc.internal.pageSize.getWidth();
      const footerY = doc.internal.pageSize.getHeight() - 15;
      
      // Adiciona apenas o número da página, o resto já foi desenhado
      doc.setFontSize(8);
      doc.setTextColor(127, 140, 141);
      doc.text(`Página ${i} de ${pageCount}`, pageWidth - margin, footerY, { align: 'right' });
    }

    const fileName = `relatorio_servico_${sanitizeText(service.number || service.id.substring(0, 8))}_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(fileName);

    console.log('[PDF] Relatório profissional gerado com sucesso:', fileName);

  } catch (error) {
    console.error('[PDF] Erro ao gerar relatório profissional:', error);
    throw new Error('Erro ao gerar relatório PDF profissional: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
