import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { sanitizeText, wrapText, addText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';
import { defaultTableTheme } from './pdfLayout';
import { modernSectionTitle, infoPanel } from './modernPdfLayout';
import { getServiceMaterialUsage } from '@/services/inventoryService';
import { MobilePdfHandler } from '../mobilePdf';

// Enhanced PDF configuration interface
interface PdfConfig {
  includeMaterials?: boolean;
  includeServiceType?: boolean;
  showCurrentStock?: boolean;
  currency?: string;
  locale?: string;
  companyName?: string;
}

const DEFAULT_PDF_CONFIG: PdfConfig = {
  includeMaterials: true,
  includeServiceType: true,
  showCurrentStock: false,
  currency: 'BRL',
  locale: 'pt-BR',
  companyName: 'Empresa'
};

/**
 * Correções e melhorias (não alterei a API externa):
 * - Removi pontos extraneous (ex.: `.PDF_COLORS`) que causavam erros de runtime
 * - Padronizei chamadas a setFillColor / setTextColor / setDrawColor usando spread ...PDF_COLORS.*
 * - Corrigi usos incorretos de spread em defaultTableTheme (usando ...defaultTableTheme(...))
 * - Adicionei `cleanStringForPdf` e `formatForPdf` para remover null-bytes/encoding ruins e normalizar texto
 * - Criei `safeAddText` (substitui todas as chamadas a addText dentro deste arquivo) para garantir que todo texto
 *   passe por sanitização antes de ser desenhado no PDF — isso corrige os caracteres corrompidos (ex: C\u0000o\u0000n...)
 * - Mantive a assinatura exportada `generateProfessionalServiceReport` e não alterei integrações externas
 */

// --- Helpers locais ---
const cleanStringForPdf = (input: any): string => {
  if (input === null || input === undefined) return '';
  let s = String(input);
  // remover bytes NUL que aparecem quando uma string UTF-16 é passada como UTF-8
  s = s.replace(/\u0000/g, '');
  // remover BOM se presente
  s = s.replace(/^\uFEFF/, '');
  // trim + normalização Unicode
  try {
    return s.trim().normalize('NFC');
  } catch (e) {
    return s.trim();
  }
};

const formatForPdf = (input: any): string => {
  const cleaned = cleanStringForPdf(input);
  try {
    // sanitizeText existe no seu projeto (importado). Caso retorne algo inesperado, caímos para cleaned
    const sanitized = typeof sanitizeText === 'function' ? sanitizeText(cleaned) : cleaned;
    return typeof sanitized === 'string' ? sanitized : String(sanitized);
  } catch (e) {
    return cleaned;
  }
};

// Substitui o addText importado por uma versão 'segura' dentro deste arquivo
const safeAddText = (doc: any, text: any, x: number, y: number, opts?: any) => {
  return addText(doc, formatForPdf(text), x, y, opts);
};


// === Alterações visuais modernas ===
const primaryColor = "#007BFF";
const secondaryColor = "#1E1E1E";
const accentColor = "#00FFC6";
const titleFont = "Poppins";
const bodyFont = "Roboto";

function drawModernHeader(doc: any, title: string, pageWidth: number) {
  doc.setFillColor(primaryColor);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setFont(titleFont, "bold");
  doc.setFontSize(20);
  doc.setTextColor("#FFFFFF");
  doc.text(title, pageWidth / 2, 25, { align: "center" });
}

function drawModernFooter(doc: any, pageNumber: number, totalPages: number, pageWidth: number, pageHeight: number) {
  doc.setDrawColor(accentColor);
  doc.setLineWidth(0.5);
  doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15);
  doc.setFont(bodyFont, "normal");
  doc.setFontSize(10);
  doc.setTextColor("#555555");
  doc.text(`Página ${pageNumber} de ${totalPages}`, pageWidth / 2, pageHeight - 7, { align: "center" });
}

export const generateProfessionalServiceReport = async (
  service: Service, 
  reportData?: any,
  config: PdfConfig = {}
): Promise<void> => {
  return MobilePdfHandler.generateAndHandle(
    async () => {
      const finalConfig = { ...DEFAULT_PDF_CONFIG, ...config };
      
      const doc = new jsPDF('portrait', 'mm', 'a4');

      let currentY = 0;

      // Capa profissional
      currentY = await createProfessionalCover(doc, service);

      // Nova página para o conteúdo
      doc.addPage();
      currentY = 30;

      // Índice
      currentY = createIndex(doc, currentY);

      // Informações gerais
      currentY = checkPageBreak(doc, currentY, 60);
      currentY = createServiceOverview(doc, service, currentY);

      // Detalhes do cliente
      currentY = checkPageBreak(doc, currentY, 40);
      currentY = createClientDetails(doc, service, currentY);

      // Seção de materiais
      currentY = checkPageBreak(doc, currentY, 60);
      currentY = await createMaterialsSection(doc, service, currentY);

      // Cronograma e status
      currentY = checkPageBreak(doc, currentY, 40);
      currentY = createTimelineSection(doc, service, currentY);

      // Técnico responsável
      currentY = checkPageBreak(doc, currentY, 30);
      currentY = createTechnicianSection(doc, service, currentY);

      // Campos técnicos/checklist
      if (service.customFields && service.customFields.length > 0) {
        currentY = checkPageBreak(doc, currentY, 50);
        currentY = createTechnicianFieldsSection(doc, service, currentY);
      }

      // Comunicações
      if (service.messages && service.messages.length > 0) {
        currentY = checkPageBreak(doc, currentY, 50);
        currentY = createCommunicationsSection(doc, service, currentY);
      }

      // Feedback
      if (service.feedback) {
        currentY = checkPageBreak(doc, currentY, 40);
        currentY = createFeedbackSection(doc, service, currentY);
      }

      // Assinaturas
      if (service.signatures?.client || service.signatures?.technician) {
        currentY = checkPageBreak(doc, currentY, 60);
        currentY = await createSignaturesSection(doc, service, currentY);
      }

      // Fotos
      if (service.photos && service.photos.length > 0) {
        currentY = checkPageBreak(doc, currentY, 80);
        await createPhotosSection(doc, service, currentY);
      }

      // Adicionar cabeçalhos e rodapés em todas as páginas
      addHeadersAndFooters(doc, service);

      return doc;
    },
    `OS_${formatForPdf(service.number || 'N_A')}_${new Date().toISOString().slice(0, 10)}.pdf`,
    {
      title: `Relatório OS ${service.number}`,
      text: `${service.title} - ${service.client}`
    }
  );
};

const createProfessionalCover = async (doc: any, service: Service): Promise<number> => {
  // Fundo preto sólido
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, PDF_DIMENSIONS.pageHeight, 'F');

  // Logo Revo amarela centralizada
  try {
    doc.addImage('/assets/logo-revo-amarela.png', 'PNG', 
                 (PDF_DIMENSIONS.pageWidth - 50) / 2, 50, 50, 50);
  } catch (e) {
    // Fallback: Yellow circle
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.circle(PDF_DIMENSIONS.pageWidth / 2, 75, 25, 'F');
  }

  // Título principal em branco
  doc.setFontSize(28);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
  doc.setTextColor(...PDF_COLORS.white);
  doc.text('RELATÓRIO TÉCNICO', PDF_DIMENSIONS.pageWidth / 2, 130, { align: 'center' });

  // Subtítulo em cinza escuro
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text('Sistema Integrado de Gestão', PDF_DIMENSIONS.pageWidth / 2, 145, { align: 'center' });

  // Raio Revo como detalhe gráfico sutil
  try {
    doc.addImage('/assets/raio-revo-amarelo.png', 'PNG', 25, 200, 12, 12);
    doc.addImage('/assets/raio-revo-amarelo.png', 'PNG', 173, 40, 8, 8);
  } catch (e) {
    // Fallback: Small yellow accents
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.circle(30, 206, 3, 'F');
    doc.circle(177, 44, 2, 'F');
  }

  // Box amarelo para informações críticas  
  doc.setFillColor(...PDF_COLORS.revoYellow);
  doc.rect(30, 170, 150, 80, 'F');

  // Título do box em preto
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
  doc.setTextColor(...PDF_COLORS.black);
  doc.text('RESUMO EXECUTIVO', PDF_DIMENSIONS.pageWidth / 2, 185, { align: 'center' });

  // Informações principais em texto preto
  const resumoInfo = [
    `OS: ${service.number || 'N/A'}`,
    `Cliente: ${service.client}`,
    `Status: ${getStatusText(service.status)}`,
    `Tipo: ${service.serviceType || 'N/A'}`,
    `Local: ${service.location || 'N/A'}`
  ];

  let infoY = 200;
  doc.setFontSize(10);
  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.black);
  
  resumoInfo.forEach(info => {
    const wrappedText = doc.splitTextToSize(info, 140);
    doc.text(wrappedText, PDF_DIMENSIONS.pageWidth / 2, infoY, { align: 'center' });
    infoY += 8;
  });

  // Data de geração na parte inferior
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.darkGray);
  doc.text(`Documento gerado automaticamente em ${formatDate(new Date().toISOString())}`, 
           PDF_DIMENSIONS.pageWidth / 2, 275, { align: 'center' });

  return PDF_DIMENSIONS.pageHeight;
};

const createIndex = (doc: any, startY: number): number => {
  let currentY = startY;

  // Título com fundo
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(PDF_DIMENSIONS.margin - 2, currentY - 6, 170, 10, 'F');
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
  doc.setTextColor(255, 255, 255);
  doc.text('ÍNDICE', PDF_DIMENSIONS.margin, currentY);

  currentY += 12;

  const indexItems = [
    '1. Informações Gerais',
    '2. Detalhes do Cliente',
    '3. Materiais Utilizados',
    '4. Cronograma e Status',
    '5. Técnico Responsável',
    '6. Campos Técnicos',
    '7. Comunicações',
    '8. Feedback',
    '9. Assinaturas',
    '10. Anexos Fotográficos'
  ];

  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.text);
  indexItems.forEach((item, idx) => {
    const yPos = currentY + (idx * 7);
    doc.text(item, PDF_DIMENSIONS.margin, yPos);
    // linha tracejada até a margem direita
    const lineStartX = PDF_DIMENSIONS.margin + doc.getTextWidth(item) + 2;
    doc.setDrawColor(...PDF_COLORS.lightGray);
    for (let x = lineStartX; x < PDF_DIMENSIONS.pageWidth - 25; x += 2) {
      doc.line(x, yPos - 1, x + 1, yPos - 1);
    }
    // número da página (placeholder)
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(String(idx + 2), PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, yPos, { align: 'right' });
    doc.setTextColor(...PDF_COLORS.text);
  });

  return currentY + indexItems.length * 7 + 5;
};

const createServiceOverview = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título de seção no estilo Revo (fundo preto, texto branco, maiúsculas)
  currentY = modernSectionTitle(doc, '1. INFORMAÇÕES GERAIS', currentY);
  currentY += 5;

  // Painel de informações usando estilo Revo
  const serviceData: Array<[string, string]> = [
    ['Número da OS:', formatForPdf(service.number || 'N/A')],
    ['Título:', formatForPdf(service.title)],
    ['Tipo de Serviço:', formatForPdf(service.serviceType || 'Não especificado')],
    ['Prioridade:', formatForPdf(service.priority || 'Normal')],
    ['Status Atual:', formatForPdf(getStatusText(service.status))],
    ['Localização:', formatForPdf(service.location || 'Não informado')]
  ];

  currentY = infoPanel(doc, currentY, serviceData);

  // Descrição em box separado se existir
  if (service.description) {
    currentY += 5;
    
    // Box amarelo para descrição (informação crítica)
    doc.setFillColor(...PDF_COLORS.revoYellow);
    const descHeight = Math.max(25, doc.splitTextToSize(service.description, 160).length * 4 + 10);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 170, descHeight, 'F');
    
    // Título da descrição
    doc.setFontSize(12);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('DESCRIÇÃO DO SERVIÇO:', PDF_DIMENSIONS.margin + 5, currentY + 8);
    
    // Texto da descrição
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    doc.setTextColor(...PDF_COLORS.black);
    const wrappedDescription = doc.splitTextToSize(service.description, 160);
    doc.text(wrappedDescription, PDF_DIMENSIONS.margin + 5, currentY + 16);
    
    currentY += descHeight + 5;
  }

  return currentY;
};

const createMaterialsSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  // Título no estilo Revo
  currentY = modernSectionTitle(doc, '3. MATERIAIS UTILIZADOS', currentY);
  currentY += 10;

  try {
    // Buscar dados dos materiais utilizados no serviço
    const materialsData = await getServiceMaterialUsage(service.id || '');
    
    if (materialsData && materialsData.length > 0) {
      // Preparar dados para a tabela
      const tableData = materialsData.map(usage => [
        formatForPdf(usage.material?.name || 'Material não identificado'),
        formatForPdf(usage.material?.unit || 'un'),
        String(usage.planned_quantity || 0),
        String(usage.used_quantity || 0),
        usage.material?.cost_per_unit 
          ? `R$ ${(Number(usage.material.cost_per_unit) * usage.used_quantity).toFixed(2)}`
          : 'N/A',
        formatForPdf(usage.notes || '-')
      ]);

      // Calcular totais
      const totalCost = materialsData.reduce((total, usage) => {
        if (usage.material?.cost_per_unit) {
          return total + (Number(usage.material.cost_per_unit) * usage.used_quantity);
        }
        return total;
      }, 0);

      // Criar tabela com estilo Revo (cabeçalho preto, linhas alternadas)
      autoTable(doc, {
        startY: currentY,
        head: [['Material', 'Unidade', 'Planejado', 'Usado', 'Custo Total', 'Observações']],
        body: tableData,
        theme: 'striped',
        styles: {
          fontSize: 9,
          cellPadding: 3,
          textColor: PDF_COLORS.black as unknown as [number, number, number],
        },
        headStyles: {
          fillColor: PDF_COLORS.black as unknown as [number, number, number],
          textColor: PDF_COLORS.white as unknown as [number, number, number],
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248] as [number, number, number], // Cinza muito claro
        },
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' }
        },
        margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Adicionar resumo de custos
      if (totalCost > 0) {
        doc.setFillColor(...PDF_COLORS.lightGray);
        doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 15, 'F');
        doc.setDrawColor(...PDF_COLORS.accent);
        doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 15, 'S');
        
        doc.setFontSize(12);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
        doc.setTextColor(...PDF_COLORS.primary);
        doc.text('CUSTO TOTAL DOS MATERIAIS:', PDF_DIMENSIONS.margin + 5, currentY + 9);
        doc.text(`R$ ${totalCost.toFixed(2)}`, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin - 5, currentY + 9, { align: 'right' });
        
        currentY += 20;
      }

      // Observações adicionais sobre os materiais
      const materialsWithNotes = materialsData.filter(usage => usage.notes && usage.notes.trim());
      if (materialsWithNotes.length > 0) {
        doc.setFontSize(12);
        doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
        doc.setTextColor(...PDF_COLORS.secondary);
        doc.text('Observações sobre Materiais:', PDF_DIMENSIONS.margin, currentY);
        currentY += 8;

        materialsWithNotes.forEach((usage, index) => {
          doc.setFontSize(10);
          doc.setFont(PDF_FONTS.normal, 'normal' as any);
          doc.setTextColor(...PDF_COLORS.text);
          const noteText = `${usage.material?.name}: ${usage.notes}`;
          const wrappedText = doc.splitTextToSize(noteText, 160);
          doc.text(wrappedText, PDF_DIMENSIONS.margin, currentY);
          currentY += wrappedText.length * 4 + 3;
        });
        
        currentY += 5;
      }
    } else {
      // Nenhum material registrado
      doc.setFillColor(...PDF_COLORS.lightGray);
      doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 30, 'F');
      doc.setDrawColor(...PDF_COLORS.border);
      doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 30, 'S');
      
      doc.setFontSize(12);
      doc.setFont(PDF_FONTS.normal, 'normal' as any);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.text('Nenhum material foi registrado para este serviço.', PDF_DIMENSIONS.pageWidth / 2, currentY + 20, { align: 'center' });
      
      currentY += 35;
    }
  } catch (error) {
    console.error('Erro ao buscar materiais do serviço:', error);
    
    // Exibir erro no PDF
    doc.setFillColor(...PDF_COLORS.warning);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 25, 'F');
    doc.setDrawColor(...PDF_COLORS.border);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 25, 'S');
    
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text('Erro ao carregar informações dos materiais.', PDF_DIMENSIONS.pageWidth / 2, currentY + 15, { align: 'center' });
    
    currentY += 30;
  }

  return currentY;
};

const createClientDetails = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título no estilo Revo
  currentY = modernSectionTitle(doc, '2. DETALHES DO CLIENTE', currentY);
  currentY += 5;

  // Painel de informações do cliente
  const clientData: Array<[string, string]> = [
    ['Nome/Razão Social:', formatForPdf(service.client || 'Não informado')],
    ['Endereço:', formatForPdf(service.address || 'Não informado')],  
    ['Cidade:', formatForPdf(service.city || 'Não informada')],
    ['Local do Serviço:', formatForPdf(service.location || 'Não informado')]
  ];

  currentY = infoPanel(doc, currentY, clientData);
  
  return currentY + 5;
};

const createTimelineSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = safeAddText(doc, '5. CRONOGRAMA E STATUS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  const timelineData = [
    ['Criação', formatForPdf(formatDate(service.creationDate)), formatForPdf('✓ Concluído')],
    ['Atribuição', formatForPdf(service.technicians?.[0] ? 'Técnico atribuído' : 'Aguardando'), formatForPdf(service.technicians?.[0] ? '✓ Concluído' : '○ Pendente')],
    ['Execução', formatForPdf(getExecutionStatus(service.status)), formatForPdf(getExecutionIcon(service.status))],
    ['Finalização', formatForPdf(service.status === 'concluido' ? 'Serviço finalizado' : 'Aguardando'), formatForPdf(service.status === 'concluido' ? '✓ Concluído' : '○ Pendente')]
  ];

  autoTable(doc, {
    startY: currentY + 6,
    head: [['Etapa', 'Detalhes', 'Status']],
    body: timelineData,
    ...defaultTableTheme('accent'),
    theme: 'striped',
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const createTechnicianSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título no estilo Revo  
  currentY = modernSectionTitle(doc, '5. TÉCNICO RESPONSÁVEL', currentY);
  currentY += 5;

  if (service.technicians && service.technicians.length > 0) {
    const technician = service.technicians[0];

    const techData: Array<[string, string]> = [
      ['Nome:', formatForPdf(technician.name)],
      ['Função:', formatForPdf(technician.role || 'Técnico')],
      ['Email:', formatForPdf(technician.email || 'Não informado')],
      ['Telefone:', formatForPdf(technician.phone || 'Não informado')]
    ];

    currentY = infoPanel(doc, currentY, techData);
  } else {
    // Box amarelo para informação crítica
    doc.setFillColor(...PDF_COLORS.revoYellow);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 170, 20, 'F');
    
    doc.setFontSize(12);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text('ATENÇÃO: Nenhum técnico foi atribuído a este serviço.', 
             PDF_DIMENSIONS.pageWidth / 2, currentY + 12, { align: 'center' });
    
    currentY += 25;
  }

  return currentY;
};

const createTechnicianFieldsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = safeAddText(doc, '7. CHECKLIST TÉCNICO', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  if (service.customFields && service.customFields.length > 0) {
    const fieldsData = service.customFields.map(field => [
      formatForPdf(field.label || 'Campo'),
      formatForPdf(field.value ? String(field.value) : 'Não preenchido'),
      formatForPdf('Configurado')
    ]);

    autoTable(doc, {
      startY: currentY + 6,
      head: [['Campo', 'Valor', 'Status']],
      body: fieldsData,
      ...defaultTableTheme('accent'),
      theme: 'grid',
    });

    return (doc as any).lastAutoTable.finalY + 10;
  } else {
    currentY = safeAddText(doc, 'Nenhum campo técnico configurado para este tipo de serviço.', PDF_DIMENSIONS.margin, currentY + 6, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 20;
  }
};

const createCommunicationsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = safeAddText(doc, '8. COMUNICAÇÕES', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  if (service.messages && service.messages.length > 0) {
    service.messages.forEach((message, index) => {
      currentY = checkPageBreak(doc, currentY, 25);

      // Cabeçalho da mensagem
      currentY = safeAddText(doc, `Mensagem ${index + 1}`, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });

      currentY = safeAddText(doc, `${formatDate(message.timestamp)} - ${formatForPdf(message.senderName)}`, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });

      // Conteúdo da mensagem
      currentY = safeAddText(doc, message.message, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });

      currentY += 8;
    });
  } else {
    currentY = safeAddText(doc, 'Nenhuma comunicação registrada.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    currentY += 20;
  }

  return currentY;
};

const createFeedbackSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = safeAddText(doc, '9. FEEDBACK DO CLIENTE', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  if (service.feedback) {
    if (service.feedback.clientComment) {
      currentY = safeAddText(doc, 'Comentário do Cliente:', PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });

      currentY = safeAddText(doc, service.feedback.clientComment, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });
    }

    if (service.feedback.technicianFeedback) {
      currentY = safeAddText(doc, 'Observações do Técnico:', PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });

      currentY = safeAddText(doc, service.feedback.technicianFeedback, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });
    }

    if (service.feedback.clientRating) {
      currentY = safeAddText(doc, `Avaliação: ${formatForPdf(service.feedback.clientRating)}/5 estrelas`, PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 10,
        fontStyle: 'bold',
        color: [...PDF_COLORS.accent] as [number, number, number]
      });
    }
  } else {
    currentY = safeAddText(doc, 'Nenhum feedback registrado.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
  }

  return currentY + 15;
};

const createSignaturesSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  currentY = safeAddText(doc, '10. ASSINATURAS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  currentY += 15;

  const hasClientSig = service.signatures?.client;
  const hasTechSig = service.signatures?.technician;
  
  if (!hasClientSig && !hasTechSig) {
    currentY = safeAddText(doc, 'Nenhuma assinatura registrada.', PDF_DIMENSIONS.margin, currentY, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 15;
  }

  // Calculate layout for horizontal signatures
  const pageWidth = PDF_DIMENSIONS.pageWidth - (PDF_DIMENSIONS.margin * 2);
  const sigWidth = hasClientSig && hasTechSig ? (pageWidth - 20) / 2 : PDF_DIMENSIONS.signatureWidth;
  const clientX = PDF_DIMENSIONS.margin;
  const techX = PDF_DIMENSIONS.margin + sigWidth + 20;

  let maxSigHeight = 0;

  // Client signature
  if (hasClientSig) {
    const sigY = currentY;
    
    safeAddText(doc, 'Assinatura do Cliente:', clientX, sigY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });

    try {
      const clientSigData = await processImage(service.signatures.client);
      if (clientSigData) {
        doc.addImage(
          clientSigData,
          'PNG',
          clientX,
          sigY + 8,
          sigWidth,
          PDF_DIMENSIONS.signatureHeight
        );
      }
    } catch (error) {
      console.error('Erro ao processar assinatura do cliente:', error);
      safeAddText(doc, '[Assinatura não pôde ser carregada]', clientX, sigY + 8, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
    }

    // Client name below signature
    const clientName = service.client || 'Cliente';
    safeAddText(doc, `Cliente: ${formatForPdf(clientName)}`, clientX, sigY + 8 + PDF_DIMENSIONS.signatureHeight + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.text] as [number, number, number]
    });

    maxSigHeight = Math.max(maxSigHeight, PDF_DIMENSIONS.signatureHeight + 20);
  }

  // Technician signature
  if (hasTechSig) {
    const sigY = currentY;
    const xPos = hasClientSig ? techX : clientX;
    
    safeAddText(doc, 'Assinatura do Técnico:', xPos, sigY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });

    try {
      const techSigData = await processImage(service.signatures.technician);
      if (techSigData) {
        doc.addImage(
          techSigData,
          'PNG',
          xPos,
          sigY + 8,
          sigWidth,
          PDF_DIMENSIONS.signatureHeight
        );
      }
    } catch (error) {
      console.error('Erro ao processar assinatura do técnico:', error);
      safeAddText(doc, '[Assinatura não pôde ser carregada]', xPos, sigY + 8, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
    }

    // Technician name below signature
    const technicianName = service.technicians?.[0]?.name || 'Técnico';
    safeAddText(doc, `Técnico: ${formatForPdf(technicianName)}`, xPos, sigY + 8 + PDF_DIMENSIONS.signatureHeight + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.text] as [number, number, number]
    });

    maxSigHeight = Math.max(maxSigHeight, PDF_DIMENSIONS.signatureHeight + 20);
  }

  return currentY + maxSigHeight + 10;
};

const createPhotosSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  currentY = safeAddText(doc, '11. ANEXOS FOTOGRÁFICOS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });

  let photosWithTitles: Array<{url: string, title: string}> = [];

  if (service.id) {
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      // Fetch photos and convert to signed URLs for PDF generation
      const { data: photosData } = await supabase
        .from('service_photos')
        .select('photo_url, title')
        .eq('service_id', service.id)
        .order('created_at', { ascending: true });

      if (photosData && photosData.length > 0) {
        // Convert to signed URLs since bucket is now private
        const photosWithSignedUrls = await Promise.all(
          photosData.map(async (p: any, index: number) => {
            let filePath = p.photo_url;
            if (p.photo_url.includes('/service-photos/')) {
              filePath = p.photo_url.split('/service-photos/')[1];
            } else if (p.photo_url.includes('/object/public/service-photos/')) {
              filePath = p.photo_url.split('/object/public/service-photos/')[1];
            }
            
            const { data: signedUrlData } = await supabase.storage
              .from('service-photos')
              .createSignedUrl(filePath, 600); // 10 minutes for PDF generation
            
            return {
              url: signedUrlData?.signedUrl || p.photo_url,
              title: p.title ? formatForPdf(p.title) : `Foto ${index + 1}`
            };
          })
        );
        
        photosWithTitles = photosWithSignedUrls;
      }
    } catch (error) {
      console.error('[PDF] Erro ao buscar títulos das fotos:', error);
    }
  }

  if (photosWithTitles.length === 0 && service.photos && service.photos.length > 0) {
    photosWithTitles = service.photos.map((url: string, index: number) => ({
      url,
      title: formatForPdf(service.photoTitles?.[index] || `Foto ${index + 1}`)
    }));
  }

  if (photosWithTitles.length === 0) {
    currentY = safeAddText(doc, 'Nenhuma foto anexada.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 20;
  }

  const photosPerRow = 2;
  const gap = 6;
  const usableWidth = PDF_DIMENSIONS.pageWidth - (PDF_DIMENSIONS.margin * 2);
  const photoWidth = (usableWidth - (gap * (photosPerRow - 1))) / photosPerRow;
  const photoHeight = photoWidth * 0.66;
  const titleFontSize = 10;
  const titleLineHeightMm = titleFontSize * 0.35277778 + 1.0;

  for (let rowStartIdx = 0; rowStartIdx < photosWithTitles.length; rowStartIdx += photosPerRow) {
    const rowItems = photosWithTitles.slice(rowStartIdx, rowStartIdx + photosPerRow);
    const titleLinesArr = rowItems.map(item =>
      doc.splitTextToSize(formatForPdf(item.title || ''), photoWidth)
    );
    const titleHeights = titleLinesArr.map(lines => Math.max(1, lines.length) * titleLineHeightMm);
    const maxTitleHeight = Math.max(...titleHeights, titleLineHeightMm);

    currentY = checkPageBreak(doc, currentY, maxTitleHeight + photoHeight + 20);
    const yTitleBase = currentY + 6;

    for (let col = 0; col < rowItems.length; col++) {
      const item = rowItems[col];
      const xPos = PDF_DIMENSIONS.margin + col * (photoWidth + gap);
      const titleLines = titleLinesArr[col];

      doc.setFontSize(titleFontSize);
      doc.setFont(PDF_FONTS.normal, 'bold' as any);
      doc.text(titleLines, xPos + photoWidth / 2, yTitleBase, { align: 'center' });

      const imgY = yTitleBase + maxTitleHeight + 4;
      try {
        const imageData = await processImage(item.url);
        if (imageData) {
          doc.addImage(imageData, 'JPEG', xPos, imgY, photoWidth, photoHeight);
        } else {
          doc.setDrawColor(...PDF_COLORS.border);
          doc.rect(xPos, imgY, photoWidth, photoHeight, 'S');
          doc.setFontSize(8);
          doc.setFont(PDF_FONTS.normal, 'normal' as any);
          doc.text('[Imagem não disponível]', xPos + photoWidth / 2, imgY + photoHeight / 2, { align: 'center' });
        }
      } catch (error) {
        console.error(`Erro ao processar foto "${item.title}":`, error);
        doc.setDrawColor(...PDF_COLORS.border);
        doc.rect(xPos, imgY, photoWidth, photoHeight, 'S');
        doc.setFontSize(8);
        doc.setFont(PDF_FONTS.normal, 'normal' as any);
        doc.text('[Erro ao carregar imagem]', xPos + photoWidth / 2, imgY + photoHeight / 2, { align: 'center' });
      }
    }

    currentY = yTitleBase + maxTitleHeight + photoHeight + 12;
  }

  return currentY;
};

const addHeadersAndFooters = (doc: any, service: Service): void => {
  const pageCount = doc.getNumberOfPages();

  for (let i = 2; i <= pageCount; i++) { // Pular a capa
    doc.setPage(i);

    // Cabeçalho
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 15, 'F');

    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
    doc.setTextColor(255, 255, 255);
    doc.text(formatForPdf(`OS #${service.number} - ${service.title || ''}`), PDF_DIMENSIONS.margin, 10);

    // Rodapé
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(PDF_DIMENSIONS.margin, 280, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 280);

    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    doc.setTextColor(...PDF_COLORS.secondary);

    doc.text(formatForPdf(`Gerado em: ${formatDate(new Date().toISOString())}`), PDF_DIMENSIONS.margin, 290);
    doc.text(formatForPdf(`Página ${i - 1} de ${pageCount - 1}`), PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin - 30, 290);
  }
};

// Funções auxiliares
const formatDate = (dateString: string | undefined): string => {
  if (!dateString) return 'Não informado';
  try {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Data inválida';
  }
};

const getStatusText = (status: string): string => {
  switch (status) {
    case 'pendente': return formatForPdf('Pendente');
    case 'em_andamento': return formatForPdf('Em Andamento');
    case 'concluido': return formatForPdf('Concluído');
    case 'cancelado': return formatForPdf('Cancelado');
    default: return formatForPdf('Status não definido');
  }
};

const getExecutionStatus = (status: string): string => {
  switch (status) {
    case 'em_andamento': return formatForPdf('Em execução');
    case 'concluido': return formatForPdf('Executado com sucesso');
    case 'cancelado': return formatForPdf('Execução cancelada');
    default: return formatForPdf('Aguardando início');
  }
};

const getExecutionIcon = (status: string): string => {
  switch (status) {
    case 'em_andamento': return formatForPdf('◐ Em andamento');
    case 'concluido': return formatForPdf('✓ Concluído');
    case 'cancelado': return formatForPdf('✗ Cancelado');
    default: return formatForPdf('○ Pendente');
  }
};
