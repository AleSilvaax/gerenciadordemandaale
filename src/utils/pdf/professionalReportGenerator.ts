// ARQUIVO COMPLETO E CORRIGIDO: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, CustomField, TeamMember } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- Funções Auxiliares de Desenho ---

const addHeader = (doc: jsPDF) => {
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(45, 52, 54);
  doc.text("Relatório de Serviço", doc.internal.pageSize.getWidth() / 2, 20, { align: 'center' });
  doc.setDrawColor(223, 230, 233);
  doc.line(20, 25, doc.internal.pageSize.getWidth() - 20, 25);
};

const addFooter = (doc: jsPDF, pageNum: number, totalPages: number) => {
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(8);
  doc.setTextColor(178, 190, 195);
  doc.text(`Página ${pageNum} de ${totalPages}`, doc.internal.pageSize.getWidth() / 2, pageHeight - 10, { align: 'center' });
};

const addSectionTitle = (doc: jsPDF, title: string, y: number) => {
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(title, 20, y);
  return y + 10;
};

// --- Função Principal de Geração de PDF ---

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório V3 para: ${service.id}`, 'PDF');
    
    const doc = new jsPDF();
    let currentY = 40;

    // --- Seção 1: Informações Gerais ---
    autoTable(doc, {
      startY: currentY,
      head: [['Ordem de Serviço', 'Cliente', 'Status', 'Data']],
      body: [[
        service.number || 'N/A',
        service.client || 'N/A',
        service.status,
        new Date(service.creationDate || Date.now()).toLocaleDateString('pt-BR')
      ]],
      theme: 'striped',
      headStyles: { fillColor: [44, 62, 80] },
    });
    currentY = (doc as any).lastAutoTable.finalY + 20;

    // --- Seção 2: Descrição e Localização ---
    currentY = addSectionTitle(doc, "Descrição do Serviço", currentY);
    let descriptionLines = doc.splitTextToSize(service.description || 'Nenhuma descrição fornecida.', doc.internal.pageSize.getWidth() - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(descriptionLines, 20, currentY);
    currentY += descriptionLines.length * 5 + 15;
    
    currentY = addSectionTitle(doc, "Localização", currentY);
    let addressLines = doc.splitTextToSize(`${service.location || ''}\n${service.address || ''}`, doc.internal.pageSize.getWidth() - 40);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(80);
    doc.text(addressLines, 20, currentY);
    currentY += addressLines.length * 5 + 20;

    // --- Seção 3: Checklist Técnico (Campos Personalizados) ---
    if (service.customFields && service.customFields.length > 0) {
      if (currentY > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); currentY = 40; }
      currentY = addSectionTitle(doc, "Checklist Técnico", currentY);
      autoTable(doc, {
        startY: currentY,
        head: [['Item', 'Valor/Status']],
        body: service.customFields.map(f => [f.label, typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : f.value?.toString() || 'N/A']),
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80] },
      });
      currentY = (doc as any).lastAutoTable.finalY + 20;
    }

    // --- Seção 4: Registro Fotográfico ---
    if (photos && photos.length > 0) {
      if (currentY > doc.internal.pageSize.getHeight() - 80) { doc.addPage(); currentY = 40; }
      currentY = addSectionTitle(doc, `Registro Fotográfico (${photos.length})`, currentY);
      
      const photoWidth = 80;
      const photoHeight = 80;
      const gap = 15;
      let x = 20;

      for (const photo of photos) {
        if (x + photoWidth > doc.internal.pageSize.getWidth() - 20) {
          x = 20;
          currentY += photoHeight + gap + 10; // +10 para o título
        }
        if (currentY + photoHeight > doc.internal.pageSize.getHeight() - 30) {
          doc.addPage();
          currentY = 40;
        }

        try {
            // Usar um proxy de CORS se necessário, ou garantir que o Supabase Storage permita acesso anônimo
            doc.addImage(photo.url, 'JPEG', x, currentY, photoWidth, photoHeight);
            doc.setFontSize(8);
            doc.setTextColor(100);
            // Agora usamos o título da foto que recebemos!
            doc.text(photo.title || 'Sem título', x + photoWidth / 2, currentY + photoHeight + 7, { align: 'center' });
        } catch (e) {
            doc.text('Erro foto', x, currentY + photoHeight / 2);
        }
        x += photoWidth + gap;
      }
      currentY += photoHeight + gap + 20;
    }
    
    // --- Seção 5: Assinaturas ---
    if (service.signatures?.client || service.signatures?.technician) {
        if (currentY > doc.internal.pageSize.getHeight() - 120) { doc.addPage(); currentY = 40; }
        currentY = addSectionTitle(doc, "Assinaturas", currentY);
        const sigWidth = 100;
        const sigHeight = 50;

        // Assinatura do Cliente
        if (service.signatures.client) {
            doc.addImage(service.signatures.client, 'PNG', 20, currentY, sigWidth, sigHeight);
            doc.setDrawColor(150);
            doc.line(20, currentY + sigHeight + 2, 20 + sigWidth, currentY + sigHeight + 2);
            // Agora usamos o nome do cliente do objeto service!
            doc.text(service.client || 'Cliente', 20 + sigWidth / 2, currentY + sigHeight + 12, { align: 'center' });
        }

        // Assinatura do Técnico
        if (service.signatures.technician) {
            doc.addImage(service.signatures.technician, 'PNG', 120, currentY, sigWidth, sigHeight);
            doc.setDrawColor(150);
            doc.line(120, currentY + sigHeight + 2, 120 + sigWidth, currentY + sigHeight + 2);
            // Usamos o nome do primeiro técnico associado
            doc.text(service.technicians?.[0]?.name || 'Técnico', 120 + sigWidth / 2, currentY + sigHeight + 12, { align: 'center' });
        }
    }

    // --- Finalização: Adiciona cabeçalhos e rodapés ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addHeader(doc);
      addFooter(doc, i, pageCount);
    }
    
    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório V3 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar relatório V3: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar relatório PDF V3: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
