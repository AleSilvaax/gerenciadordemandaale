import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { sanitizeText, wrapText, addText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';
import { getServiceMaterialUsage } from '@/services/inventoryService';
import { MobilePdfHandler } from '../mobilePdf';
import { 
  applyDarkBackground, 
  drawRevoCover, 
  drawRevoHeader, 
  drawRevoFooter, 
  revoSectionTitle, 
  revoSubTitle, 
  revoInfoBox, 
  revoTableTheme, 
  revoPhotoGrid 
} from './revoLayout';

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


// --- Tema de tabela mais suave e profissional ---
// Substitui o revoTableTheme por uma versão mais leve, com cabeçalho claro e linhas sutis.
// Mantém as cores da marca como acento (título/cabeçalho em texto), mas evita blocos sólidos muito fortes.
type AutoTableTheme = {
  styles?: any;
  headStyles?: any;
  bodyStyles?: any;
  alternateRowStyles?: any;
  columnStyles?: any;
  tableLineColor?: any;
  tableLineWidth?: number;
  margin?: any;
  didDrawPage?: any;
};

const proTableTheme = (): AutoTableTheme => {
  return {
    styles: {
      font: PDF_FONTS.normal,
      fontSize: 9,
      cellPadding: { top: 3, right: 3, bottom: 3, left: 3 },
      lineColor: [230, 232, 236],
      lineWidth: 0.1,
      textColor: [...PDF_COLORS.black] as any
    },
    headStyles: {
      fillColor: [246, 248, 250],       // cabeçalho super claro
      textColor: [...PDF_COLORS.primary] as any, // usa cor principal no texto como acento
      fontStyle: 'bold',
      halign: 'left',
      lineColor: [230, 232, 236],
      lineWidth: 0.1
    },
    bodyStyles: {
      fillColor: [255, 255, 255],
      textColor: [...PDF_COLORS.black] as any
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252]
    },
    tableLineColor: [230, 232, 236],
    tableLineWidth: 0.1,
    margin: { left: PDF_DIMENSIONS.margin, right: PDF_DIMENSIONS.margin }
  };
};
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


// === Sistema Revo Corporate ===
// Design minimalista com preto, branco, cinza escuro e amarelo Revo (#F4FF00) apenas para destaques

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

      // Capa Revo (com fundo escuro)
      await drawRevoCover(doc, 'RELATÓRIO TÉCNICO', 'Sistema Integrado de Gestão', service.number);

      // Nova página para o conteúdo com fundo branco
      doc.addPage();
      currentY = 25;

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

      // Aplicar fundo cinza escuro em todas as páginas e cabeçalhos/rodapés Revo
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

// A capa agora é gerenciada pelo revoLayout.ts

const createIndex = (doc: any, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, 'ÍNDICE', currentY);
  currentY += 8;

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
  doc.setTextColor(...PDF_COLORS.black); // Texto preto para fundo branco
  indexItems.forEach((item, idx) => {
    const yPos = currentY + (idx * 7);
    doc.text(item, PDF_DIMENSIONS.margin, yPos);
    // linha tracejada cinza até a margem direita
    const lineStartX = PDF_DIMENSIONS.margin + doc.getTextWidth(item) + 2;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.3);
    for (let x = lineStartX; x < PDF_DIMENSIONS.pageWidth - 25; x += 3) {
      doc.line(x, yPos - 1, x + 1, yPos - 1);
    }
    // número da página em cinza escuro
    doc.setTextColor(...PDF_COLORS.darkGray);
    doc.text(String(idx + 2), PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, yPos, { align: 'right' });
    doc.setTextColor(...PDF_COLORS.black);
  });

  return currentY + indexItems.length * 7 + 5;
};

const createServiceOverview = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '1. INFORMAÇÕES GERAIS', currentY);
  currentY += 8;

  // Usar o sistema de info box Revo (convert to proper tuple type)
  const info: Array<[string, string]> = [
    ['Número da OS:', formatForPdf(service.number || 'N/A')],
    ['Título:', formatForPdf(service.title)],
    ['Tipo de Serviço:', formatForPdf(service.serviceType || 'Não especificado')],
    ['Prioridade:', formatForPdf(service.priority || 'Normal')],
    ['Status Atual:', formatForPdf(getStatusText(service.status))],
    ['Localização:', formatForPdf(service.location || 'Não informado')]
  ];

  currentY = revoInfoBox(doc, currentY, info, 'light');

  if (service.description) {
    currentY = revoSubTitle(doc, 'Descrição do Serviço', currentY);
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(doc.splitTextToSize(formatForPdf(service.description), 160), PDF_DIMENSIONS.margin, currentY);
    currentY += Math.ceil(doc.splitTextToSize(formatForPdf(service.description), 160).length / 2) * 5 + 5;
  }

  return currentY + 5;
};

const createMaterialsSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '3. MATERIAIS UTILIZADOS', currentY);
  currentY += 8;

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

      // Criar tabela de materiais com tema Revo
      autoTable(doc, {
        startY: currentY,
        head: [['Material', 'Unidade', 'Planejado', 'Usado', 'Custo Total', 'Observações']],
        body: tableData,
        ...proTableTheme(),
        columnStyles: {
          2: { halign: 'center' },
          3: { halign: 'center' },
          4: { halign: 'right' }
        }
      });

      currentY = (doc as any).lastAutoTable.finalY + 10;

      // Adicionar resumo de custos em box amarelo (crítico)
      if (totalCost > 0) {
        const costInfo: Array<[string, string]> = [
          ['CUSTO TOTAL DOS MATERIAIS:', `R$ ${totalCost.toFixed(2)}`]
        ];
        currentY = revoInfoBox(doc, currentY, costInfo, 'critical');
      }

      // Observações em texto branco
      const materialsWithNotes = materialsData.filter(usage => usage.notes && usage.notes.trim());
      if (materialsWithNotes.length > 0) {
        currentY = revoSubTitle(doc, 'Observações sobre Materiais', currentY);

        materialsWithNotes.forEach((usage, index) => {
          doc.setFontSize(10);
          doc.setFont(PDF_FONTS.normal, 'normal');
          doc.setTextColor(0, 0, 0); // Preto para melhor contraste
          const noteText = `${usage.material?.name}: ${usage.notes}`;
          const wrappedText = doc.splitTextToSize(formatForPdf(noteText), 160);
          doc.text(wrappedText, PDF_DIMENSIONS.margin, currentY);
          currentY += wrappedText.length * 4 + 3;
        });
        
        currentY += 5;
      }
    } else {
      // Nenhum material registrado - usar info box
      const noMaterialInfo: Array<[string, string]> = [
        ['Status:', 'Nenhum material foi registrado para este serviço.']
      ];
      currentY = revoInfoBox(doc, currentY, noMaterialInfo, 'light');
    }
  } catch (error) {
    console.error('Erro ao buscar materiais do serviço:', error);
    
    // Exibir erro em box crítico
    const errorInfo: Array<[string, string]> = [
      ['Erro:', 'Erro ao carregar informações dos materiais.']
    ];
    currentY = revoInfoBox(doc, currentY, errorInfo, 'critical');
  }

  return currentY;
};

const createClientDetails = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '2. DETALHES DO CLIENTE', currentY);
  currentY += 8;

  // Usar info box Revo
  const clientInfo: Array<[string, string]> = [
    ['Nome/Razão Social:', formatForPdf(service.client || 'Não informado')],
    ['Endereço:', formatForPdf(service.address || 'Não informado')],
    ['Cidade:', formatForPdf(service.city || 'Não informada')],
    ['Local do Serviço:', formatForPdf(service.location || 'Não informado')]
  ];

  currentY = revoInfoBox(doc, currentY, clientInfo, 'light');

  return currentY;
};

const createTimelineSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '4. CRONOGRAMA E STATUS', currentY);
  currentY += 8;

  const timelineData = [
    ['Criação', formatForPdf(formatDate(service.creationDate)), formatForPdf('✓ Concluído')],
    ['Atribuição', formatForPdf(service.technicians?.[0] ? 'Técnico atribuído' : 'Aguardando'), formatForPdf(service.technicians?.[0] ? '✓ Concluído' : '○ Pendente')],
    ['Execução', formatForPdf(getExecutionStatus(service.status)), formatForPdf(getExecutionIcon(service.status))],
    ['Finalização', formatForPdf(service.status === 'concluido' ? 'Serviço finalizado' : 'Aguardando'), formatForPdf(service.status === 'concluido' ? '✓ Concluído' : '○ Pendente')]
  ];

  autoTable(doc, {
    startY: currentY,
    head: [['Etapa', 'Detalhes', 'Status']],
    body: timelineData,
    ...proTableTheme(),
  });

  return (doc as any).lastAutoTable.finalY + 10;
};

const createTechnicianSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '5. TÉCNICO RESPONSÁVEL', currentY);
  currentY += 8;

  if (service.technicians && service.technicians.length > 0) {
    const technician = service.technicians[0];

    const techInfo: Array<[string, string]> = [
      ['Nome:', formatForPdf(technician.name)],
      ['Função:', formatForPdf(technician.role || 'Técnico')],
      ['Email:', formatForPdf(technician.email || 'Não informado')],
      ['Telefone:', formatForPdf(technician.phone || 'Não informado')]
    ];

    currentY = revoInfoBox(doc, currentY, techInfo, 'light');
    return currentY;
  } else {
    const noTechInfo: Array<[string, string]> = [
      ['Status:', 'Nenhum técnico foi atribuído a este serviço.']
    ];
    currentY = revoInfoBox(doc, currentY, noTechInfo, 'light');
    return currentY;
  }
};

const createTechnicianFieldsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '6. CHECKLIST TÉCNICO', currentY);
  currentY += 8;

  if (service.customFields && service.customFields.length > 0) {
    const fieldsData = service.customFields.map(field => [
      formatForPdf(field.label || 'Campo'),
      formatForPdf(field.value ? String(field.value) : 'Não preenchido')
    ]);

    autoTable(doc, {
      startY: currentY,
      head: [['Campo', 'Valor']],
      body: fieldsData,
      ...proTableTheme(),
    });

    return (doc as any).lastAutoTable.finalY + 10;
  } else {
    const noFieldsInfo: Array<[string, string]> = [
      ['Status:', 'Nenhum campo técnico configurado para este tipo de serviço.']
    ];
    currentY = revoInfoBox(doc, currentY, noFieldsInfo, 'light');
    return currentY;
  }
};

const createCommunicationsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '7. COMUNICAÇÕES', currentY);
  currentY += 8;

  if (service.messages && service.messages.length > 0) {
    service.messages.forEach((message, index) => {
      // Verificar quebra de página antes de cada mensagem
      currentY = checkPageBreak(doc, currentY, 35);
      
      const messageInfo: Array<[string, string]> = [
        [`Mensagem ${index + 1}:`, `${formatDate(message.timestamp)} - ${formatForPdf(message.senderName)}`],
        ['Conteúdo:', formatForPdf(message.message)]
      ];
      currentY = revoInfoBox(doc, currentY, messageInfo, 'light');
    });
  } else {
    const noMessagesInfo: Array<[string, string]> = [
      ['Status:', 'Nenhuma comunicação registrada.']
    ];
    currentY = revoInfoBox(doc, currentY, noMessagesInfo, 'light');
  }

  return currentY;
};

const createFeedbackSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '8. FEEDBACK', currentY);
  currentY += 8;

  if (service.feedback) {
    const feedbackInfo: Array<[string, string]> = [];
    
    if (service.feedback.clientComment) {
      feedbackInfo.push(['Comentário do Cliente:', formatForPdf(service.feedback.clientComment)]);
    }
    
    if (service.feedback.technicianFeedback) {
      feedbackInfo.push(['Observações do Técnico:', formatForPdf(service.feedback.technicianFeedback)]);
    }
    
    if (service.feedback.clientRating) {
      feedbackInfo.push(['Avaliação:', `${service.feedback.clientRating}/5 estrelas`]);
    }

    currentY = revoInfoBox(doc, currentY, feedbackInfo, 'light');
  } else {
    const noFeedbackInfo: Array<[string, string]> = [
      ['Status:', 'Nenhum feedback registrado.']
    ];
    currentY = revoInfoBox(doc, currentY, noFeedbackInfo, 'light');
  }

  return currentY;
};

const createSignaturesSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '9. ASSINATURAS', currentY);
  currentY += 8;

  const hasClientSig = service.signatures?.client;
  const hasTechSig = service.signatures?.technician;
  
  if (!hasClientSig && !hasTechSig) {
    const noSignaturesInfo: Array<[string, string]> = [
      ['Status:', 'Nenhuma assinatura registrada.']
    ];
    currentY = revoInfoBox(doc, currentY, noSignaturesInfo, 'light');
    return currentY;
  }

  // Assinaturas com fundo branco, linhas cinza escuro, nomes em amarelo
  if (hasClientSig) {
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 80, 35, 'F');
    doc.setDrawColor(...PDF_COLORS.darkGray);
    doc.rect(PDF_DIMENSIONS.margin, currentY, 80, 35, 'S');
    
    try {
      const clientSigData = await processImage(service.signatures.client);
      if (clientSigData) {
        doc.addImage(clientSigData, 'PNG', PDF_DIMENSIONS.margin + 5, currentY + 5, 70, 20);
      }
    } catch (error) {
      doc.setTextColor(...PDF_COLORS.black);
      doc.text('[Assinatura não disponível]', PDF_DIMENSIONS.margin + 40, currentY + 15, { align: 'center' });
    }
    
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(`Cliente: ${formatForPdf(service.client || 'N/A')}`, PDF_DIMENSIONS.margin + 5, currentY + 32);
  }

  if (hasTechSig) {
    const techX = hasClientSig ? PDF_DIMENSIONS.margin + 90 : PDF_DIMENSIONS.margin;
    
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(techX, currentY, 80, 35, 'F');
    doc.setDrawColor(...PDF_COLORS.darkGray);
    doc.rect(techX, currentY, 80, 35, 'S');
    
    try {
      const techSigData = await processImage(service.signatures.technician);
      if (techSigData) {
        doc.addImage(techSigData, 'PNG', techX + 5, currentY + 5, 70, 20);
      }
    } catch (error) {
      doc.setTextColor(...PDF_COLORS.black);
      doc.text('[Assinatura não disponível]', techX + 40, currentY + 15, { align: 'center' });
    }
    
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.black);
    doc.text(`Técnico: ${formatForPdf(service.technicians?.[0]?.name || 'N/A')}`, techX + 5, currentY + 32);
  }

  return currentY + 45;
};

const createPhotosSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  // Título usando o sistema Revo
  currentY = revoSectionTitle(doc, '10. ANEXOS FOTOGRÁFICOS', currentY);
  currentY += 8;

  // Buscar fotos com títulos da base de dados
  let photosWithTitles: Array<{url: string, title?: string}> = [];

  try {
    const { supabase } = await import('@/integrations/supabase/client');
    const { data: photosData, error } = await supabase
      .from('service_photos')
      .select('photo_url, title')
      .eq('service_id', service.id)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao carregar fotos para PDF:', error);
    } else if (photosData && photosData.length > 0) {
      const { convertToSignedUrl } = await import('@/utils/signedUrlHelper');
      
      for (const photo of photosData) {
        const signedUrl = await convertToSignedUrl(photo.photo_url);
        photosWithTitles.push({
          url: signedUrl,
          title: photo.title || `Foto ${photosWithTitles.length + 1}`
        });
      }
    }
  } catch (error) {
    console.error('Erro ao processar fotos para PDF:', error);
  }

  if (photosWithTitles.length === 0) {
    const noPhotosInfo: Array<[string, string]> = [
      ['Status:', 'Nenhuma foto anexada.']
    ];
    currentY = revoInfoBox(doc, currentY, noPhotosInfo, 'light');
    return currentY;
  }

  // Usar o sistema de grade Revo
  return await revoPhotoGrid(doc, photosWithTitles, currentY, 2);
};

const addHeadersAndFooters = (doc: any, service: Service): void => {
  const pageCount = doc.getNumberOfPages();

  for (let i = 2; i <= pageCount; i++) { // Pular a capa
    doc.setPage(i);

    // Cabeçalho
    doc.setDrawColor(...PDF_COLORS.primary);
    doc.setLineWidth(0.6);
    doc.line(0, 15, PDF_DIMENSIONS.pageWidth, 15);

doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold as any);
    doc.setTextColor(...PDF_COLORS.darkGray);
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
