// ARQUIVO ATUALIZADO E COMPLETO: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, CustomField } from '@/types/serviceTypes'; // Seus tipos existentes
import { logger } from '@/utils/loggingService'; // Seu serviço de log

// --- FUNÇÕES AUXILIARES DE DESENHO ---

// Função para adicionar o cabeçalho em todas as páginas
const addHeader = (doc: jsPDF, service: Service) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // Tente adicionar um logo (se você tiver a URL, pode carregar a imagem)
  // Por enquanto, vamos usar um placeholder de texto
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(40, 40, 40);
  doc.text("Sua Empresa", margin, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text("Relatório de Serviço", pageWidth - margin, 15, { align: 'right' });
  doc.text(`OS: ${service.number || service.id}`, pageWidth - margin, 22, { align: 'right' });
};

// Função para adicionar o rodapé em todas as páginas
const addFooter = (doc: jsPDF, pageNumber: number, totalPages: number) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const footerY = doc.internal.pageSize.getHeight() - 15;

  doc.setDrawColor(220, 220, 220);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text(`Relatório gerado em: ${new Date().toLocaleDateString('pt-BR')}`, margin, footerY);
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth - margin, footerY, { align: 'right' });
};

// --- FUNÇÃO PRINCIPAL ---

export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
  try {
    logger.info(`Iniciando geração do relatório V2 para serviço: ${service.id}`, 'PDF');
    
    const doc = new jsPDF('p', 'pt', 'a4'); // Usando 'pt' para mais controle, e 'a4' como padrão
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40; // Margem de ~1.4cm
    let currentY = 80; // Posição inicial do conteúdo, abaixo do cabeçalho

    // --- SEÇÃO 1: RESUMO (CLIENTE E SERVIÇO) ---
    doc.setFontSize(11);
    doc.setTextColor(30, 30, 30);
    doc.setFont('helvetica', 'normal');

    // Coluna da Esquerda: Dados do Cliente
    doc.setFont('helvetica', 'bold');
    doc.text("DADOS DO CLIENTE", margin, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 15;
    doc.text(`Cliente: ${service.client || 'Não informado'}`, margin, currentY);
    currentY += 15;
    doc.text(`Local: ${service.location || 'Não informado'}`, margin, currentY);
    currentY += 15;
    
    // Usando autoTable para formatar o endereço que pode ter várias linhas
    autoTable(doc, {
        body: [[`Endereço: ${service.address || 'Não informado'}`]],
        startY: currentY,
        theme: 'plain',
        styles: { fontSize: 11, cellPadding: 0 },
        margin: { left: margin }
    });
    currentY = (doc as any).lastAutoTable.finalY;

    // Coluna da Direita: Dados do Serviço
    currentY = 80; // Reseta o Y para alinhar com a coluna da esquerda
    const rightColumnX = pageWidth / 2 + 20;
    doc.setFont('helvetica', 'bold');
    doc.text("DADOS DO SERVIÇO", rightColumnX, currentY);
    doc.setFont('helvetica', 'normal');
    currentY += 15;
    doc.text(`Status: ${service.status || 'Não informado'}`, rightColumnX, currentY);
    currentY += 15;
    doc.text(`Tipo de Serviço: ${service.serviceType || 'Não informado'}`, rightColumnX, currentY);
    currentY += 15;
    doc.text(`Técnico: ${service.technicians?.map(t => t.name).join(', ') || 'Não atribuído'}`, rightColumnX, currentY);
    currentY = (doc as any).lastAutoTable.finalY + 30; // Pega a maior altura entre as duas colunas
    
    // --- SEÇÃO 2: DESCRIÇÃO DO SERVIÇO ---
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text("Descrição do Serviço", margin, currentY);
    currentY += 20;
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    const descriptionLines = doc.splitTextToSize(service.description || 'Nenhuma descrição fornecida.', pageWidth - margin * 2);
    doc.text(descriptionLines, margin, currentY);
    currentY += descriptionLines.length * 12 + 30;


    // --- SEÇÃO 3: CHECKLIST TÉCNICO (CAMPOS PERSONALIZADOS) ---
    if (service.customFields && service.customFields.length > 0) {
      // Verifica se precisa de uma nova página
      if (currentY > doc.internal.pageSize.getHeight() - 200) {
        doc.addPage();
        currentY = 80;
      }

      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text("Checklist Técnico", margin, currentY);
      currentY += 20;
      
      const tableData = service.customFields.map((field: CustomField) => [
        field.label || 'Campo',
        // Converte valores booleanos para 'Sim'/'Não' para ficar mais legível
        typeof field.value === 'boolean' ? (field.value ? 'Sim' : 'Não') : (field.value?.toString() || 'N/A')
      ]);

      autoTable(doc, {
        head: [['Item', 'Status / Valor']],
        body: tableData,
        startY: currentY,
        theme: 'grid',
        headStyles: { fillColor: [52, 73, 94] },
        styles: { fontSize: 10, cellPadding: 5 },
      });
      currentY = (doc as any).lastAutoTable.finalY + 30;
    }


    // --- SEÇÃO 4: REGISTRO FOTOGRÁFICO ---
    if (service.photos && service.photos.length > 0) {
        doc.addPage();
        currentY = 80;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Registro Fotográfico", margin, currentY);
        currentY += 20;

        const photoSize = (pageWidth - margin * 2 - 20) / 2; // Tamanho para 2 fotos por linha com um espaço
        const photoMargin = 20;
        let photoX = margin;

        for (let i = 0; i < service.photos.length; i++) {
            const photoUrl = service.photos[i];
            
            // Verifica se precisa de uma nova página
            if (currentY + photoSize > doc.internal.pageSize.getHeight() - 60) {
                doc.addPage();
                currentY = 80;
            }

            try {
                // Para carregar imagens da web, precisamos de um truque de CORS
                // Esta é uma implementação simplificada. Pode ser necessário um proxy para CORS.
                const response = await fetch(photoUrl);
                const blob = await response.blob();
                const reader = new FileReader();
                await new Promise<void>(resolve => {
                    reader.onload = () => {
                        doc.addImage(reader.result as string, 'JPEG', photoX, currentY, photoSize, photoSize);
                        
                        // Alterna a posição da foto
                        if ((i + 1) % 2 === 0) {
                            currentY += photoSize + photoMargin;
                            photoX = margin;
                        } else {
                            photoX += photoSize + photoMargin;
                        }
                        resolve();
                    };
                    reader.readAsDataURL(blob);
                });

            } catch(e) {
                doc.text(`Erro ao carregar foto ${i+1}`, photoX, currentY + photoSize / 2);
            }
        }
        currentY += 30;
    }

    // --- SEÇÃO 5: ASSINATURAS ---
    if (service.signatures?.client || service.signatures?.technician) {
        doc.addPage();
        currentY = 80;

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text("Assinaturas", margin, currentY);
        currentY += 50;

        const signatureY = currentY;
        const signatureWidth = 150;
        const signatureHeight = 75;

        // Assinatura do Cliente
        if (service.signatures.client) {
            doc.addImage(service.signatures.client, 'PNG', margin, signatureY, signatureWidth, signatureHeight);
            doc.line(margin, signatureY + signatureHeight + 5, margin + signatureWidth, signatureY + signatureHeight + 5);
            doc.text("Assinatura do Cliente", margin, signatureY + signatureHeight + 20);
        }

        // Assinatura do Técnico
        if (service.signatures.technician) {
            const techX = pageWidth - margin - signatureWidth;
            doc.addImage(service.signatures.technician, 'PNG', techX, signatureY, signatureWidth, signatureHeight);
            doc.line(techX, signatureY + signatureHeight + 5, techX + signatureWidth, signatureY + signatureHeight + 5);
            doc.text("Assinatura do Técnico", techX, signatureY + signatureHeight + 20);
        }
    }


    // --- FINALIZAÇÃO: Adiciona cabeçalho e rodapé em todas as páginas ---
    const pageCount = doc.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      addHeader(doc, service);
      addFooter(doc, i, pageCount);
    }

    const fileName = `Relatorio_OS_${service.number || service.id.substring(0, 6)}.pdf`;
    doc.save(fileName);
    logger.info(`Relatório V2 gerado: ${fileName}`, 'PDF');

  } catch (error) {
    logger.error(`Erro ao gerar relatório V2: ${error instanceof Error ? error.message : 'Erro desconhecido'}`, 'PDF');
    throw new Error('Erro ao gerar relatório PDF V2: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
  }
};
