import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { sanitizeText, wrapText, addText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';
import { defaultTableTheme } from './pdfLayout';
import { getServiceMaterialUsage } from '@/services/inventoryService';

/**
 * Correções e melhorias (não alterei a API externa):
 * - Removi pontos extraneous (ex.: `.PDF_COLORS`) que causavam erros de runtime
 * - Padronizei chamadas a setFillColor / setTextColor / setDrawColor usando spread ...PDF_COLORS.*
 * - Corrigi usos incorretos de spread em defaultTableTheme (usando ...defaultTableTheme(...))
 * - Adicionei `cleanStringForPdf` e `formatForPdf` para remover null-bytes/encoding ruins e normalizar texto
 * - Criei `safeAddText` (substitui todas as chamadas a addText dentro deste arquivo) para garantir que todo texto
 *   passe por sanitização antes de ir para o PDF
 * - Hierarquia tipográfica consistente: Título (20–22), Seção (16), Subtítulo (12–13), Corpo (10–11)
 * - “Respiro” entre seções padronizado (spacingY = 8–14mm conforme bloco)
 * - Índice com estilo e divisores
 * - Tabelas com tema clean (listras leves, cabeçalho destacado, padding consistente)
 * - Caixas para Comunicações e Feedback (card com sombra simulada e barra à esquerda)
 * - Assinaturas lado a lado com placeholders
 * - Grade responsiva de fotos (2 ou 3 por linha, com título)
 * - Cabeçalho e rodapé em todas as páginas (menos capa), com número de página e data
 * - Evitei quebras abruptas usando checkPageBreak em todos os blocos longos
 */

// ============= Utils de sanitização =============
const cleanStringForPdf = (input: any): string => {
  if (input === undefined || input === null) return '';
  let s = String(input);
  // remove null-bytes e caracteres invisíveis mais comuns
  s = s.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '');
  // remove marca BOM, se houver
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

// ============= Gerador principal =============
export const generateProfessionalServiceReport = async (service: Service): Promise<void> => {
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

  // Salvar
  const fileName = `OS_${formatForPdf(service.number || 'N_A')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

const createProfessionalCover = async (doc: any, service: Service): Promise<number> => {
  // Fundo
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 120, 'F');

  // Gradiente decorativo secundário
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(0, 100, PDF_DIMENSIONS.pageWidth, 20, 'F');

  // Bloco branco (conteúdo da capa)
  doc.setFillColor(255, 255, 255);
  doc.rect(PDF_DIMENSIONS.margin, 40, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin * 2, 70, 'F');

  // Faixa accent mais destacada
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 115, PDF_DIMENSIONS.pageWidth, 8, 'F');

  // Elementos geométricos decorativos
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.circle(180, 25, 15, 'F');
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(170, 35, 30, 3, 'F');

  // Logo modernizado (fallbacks mantidos)
  try {
    const logo = await processImage('/logo.svg');
    if (logo) {
      doc.addImage(logo, 'PNG', PDF_DIMENSIONS.margin, 15, 20, 20);
    } else {
      doc.setFillColor(...PDF_COLORS.white);
      doc.rect(PDF_DIMENSIONS.margin, 15, 20, 20, 'F');
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(PDF_DIMENSIONS.margin + 10, 25, 6, 'F');
    }
  } catch (e) {
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(PDF_DIMENSIONS.margin, 15, 20, 20, 'F');
  }

  // Título da capa
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(22);
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  safeAddText(doc, 'RELATÓRIO TÉCNICO', PDF_DIMENSIONS.margin + 10, 60);

  doc.setFontSize(14);
  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.secondary);
  safeAddText(doc, 'Sistema Integrado de Gestão', PDF_DIMENSIONS.margin + 10, 68);

  // Número da OS e título
  doc.setFontSize(12);
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  safeAddText(doc, `OS #${formatForPdf(service.number || '-')}`, PDF_DIMENSIONS.margin + 10, 80);
  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  safeAddText(doc, formatForPdf(service.title || '—'), PDF_DIMENSIONS.margin + 10, 86);

  // Resumo executivo (card)
  const cardX = PDF_DIMENSIONS.margin + 10;
  const cardW = PDF_DIMENSIONS.pageWidth - cardX - PDF_DIMENSIONS.margin - 10;
  const cardY = 92;
  const cardH = 30;

  // Sombra simulada
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(cardX, cardY, cardW, cardH, 2, 2, 'F');
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.6);
  doc.line(cardX, cardY, cardX, cardY + cardH);

  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.primary);
  safeAddText(doc, 'RESUMO EXECUTIVO', cardX + 4, cardY + 7);

  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setFontSize(10);
  doc.setTextColor(...PDF_COLORS.secondary);

  const resumo = [
    [`Demanda:`, formatForPdf(service.title || '-')],
    [`Cliente:`, formatForPdf(service.client?.name || service.client_name || '-')],
    [`Localização:`, formatForPdf(service.location || '-')],
    [`Tipo:`, formatForPdf(service.serviceType || service.type || '-')],
    [`Status:`, formatForPdf(service.status || '-')],
    [`Prioridade:`, formatForPdf(service.priority || '-')],
  ];

  let y = cardY + 13;
  const col1X = cardX + 4;
  const col2X = cardX + cardW / 2;
  const lineH = 5.4;
  resumo.forEach((pair, idx) => {
    const destX = idx % 2 === 0 ? col1X : col2X;
    if (idx % 2 === 0 && idx > 0) y += lineH; // pular linha a cada 2 itens
    doc.setFont(PDF_FONTS.normal, 'bold' as any);
    safeAddText(doc, pair[0], destX, y);
    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    safeAddText(doc, pair[1], destX + 24, y);
  });

  return 130; // fim da capa
};

// ============= Índice =============
const createIndex = (doc: any, startY: number): number => {
  let y = startY;

  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setTextColor(...PDF_COLORS.primary);
  safeAddText(doc, 'ÍNDICE', PDF_DIMENSIONS.margin, y);

  y += 6;
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(PDF_DIMENSIONS.margin, y, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, y);
  y += 4;

  const items = [
    '1. Informações Gerais',
    '2. Detalhes do Cliente',
    '3. Materiais Utilizados',
    '4. Cronograma e Status',
    '5. Técnico Responsável',
    '6. Campos Técnicos',
    '7. Comunicações',
    '8. Feedback',
    '9. Assinaturas',
    '10. Anexos Fotográficos',
  ];

  doc.setFontSize(11);
  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.secondary);

  items.forEach((txt, i) => {
    safeAddText(doc, txt, PDF_DIMENSIONS.margin, y);
    y += 6;
  });

  return y + 4;
};

// ============= Informações Gerais =============
const createServiceOverview = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = sectionTitle(doc, '1. INFORMAÇÕES GERAIS', currentY);

  const info = [
    ['Número da OS:', formatForPdf(service.number || '-')],
    ['Título:', formatForPdf(service.title || '-')],
    ['Tipo de Serviço:', formatForPdf(service.serviceType || service.type || '-')],
    ['Prioridade:', formatForPdf(service.priority || '-')],
    ['Status Atual:', formatForPdf(service.status || '-')],
    ['Localização:', formatForPdf(service.location || '-')],
  ];

  drawDefinitionList(doc, info, currentY + 4);
  
  // Descrição do Serviço (bloco com quebra)
  const descTitleY = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 6 : currentY + 22;
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setFontSize(12);
  doc.setTextColor(...PDF_COLORS.primary);
  safeAddText(doc, 'Descrição do Serviço:', PDF_DIMENSIONS.margin, descTitleY);

  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setFontSize(11);
  doc.setTextColor(...PDF_COLORS.secondary);

  const desc = formatForPdf(service.description || '-');
  const wrapped = doc.splitTextToSize(desc, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin * 2);
  safeAddText(doc, wrapped, PDF_DIMENSIONS.margin, descTitleY + 6);

  return descTitleY + 6 + wrapped.length * 5 + 4;
};

// ============= Detalhes do Cliente =============
const createClientDetails = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = sectionTitle(doc, '2. DETALHES DO CLIENTE', currentY);

  const info = [
    ['Nome/Razão Social', formatForPdf(service.client?.name || service.client_name || '-')],
    ['Endereço', formatForPdf(service.client?.address || service.address || '-')],
    ['Cidade', formatForPdf(service.client?.city || service.city || '-')],
    ['Local do Serviço', formatForPdf(service.location || '-')],
  ];

  drawTable(doc, ['Campo', 'Informação'], info, currentY + 4);
  return (doc as any).lastAutoTable.finalY + 8;
};

// ============= Materiais =============
const createMaterialsSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;

  currentY = sectionTitle(doc, '3. MATERIAIS UTILIZADOS', currentY);

  // Busca detalhamento do uso
  let usage = [] as Array<{ material: any; planned_quantity: number; used_quantity: number; notes?: string }>;
  try {
    usage = await getServiceMaterialUsage(service.id!);
  } catch (e) {
    // fallback para dados dentro do próprio service
    usage = (service.materials || []).map((m: any) => ({
      material: m,
      planned_quantity: Number(m.planned || m.qtd_plan || 0),
      used_quantity: Number(m.used || m.qtd_used || 0),
      notes: m.notes || m.observations || '',
    }));
  }

  const tableData = usage.map((u) => {
    const unit = u.material?.unit || 'un';
    const costTotal = (Number(u.material?.cost_per_unit) || 0) * Number(u.used_quantity || 0);
    return [
      formatForPdf(u.material?.name || '-'),
      formatForPdf(unit),
      String(u.planned_quantity ?? 0),
      String(u.used_quantity ?? 0),
      costTotal ? `R$ ${costTotal.toFixed(2)}` : 'N/A',
      formatForPdf(u.notes || '-')
    ];
  });

  // Somatório do custo total (se disponível)
  const totalCost = usage.reduce((total, usage) => {
    if (usage.material?.cost_per_unit) {
      return total + (Number(usage.material.cost_per_unit) * usage.used_quantity);
    }
    return total;
  }, 0);

  // Criar tabela de materiais
  autoTable(doc, {
    startY: currentY,
    head: [['Material', 'Unidade', 'Planejado', 'Usado', 'Custo Total', 'Observações']],
    body: tableData,
    ...defaultTableTheme('accent'),
    theme: 'striped',
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [...PDF_COLORS.tableStripe] as [number, number, number],
    },
  });

  let y = (doc as any).lastAutoTable.finalY + 4;

  // Total
  if (totalCost) {
    doc.setFont(PDF_FONTS.normal, 'bold' as any);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFontSize(11);
    safeAddText(doc, `Total de Materiais: R$ ${totalCost.toFixed(2)}`, PDF_DIMENSIONS.margin, y);
    y += 6;
  }

  return y + 2;
};

// ============= Cronograma =============
const createTimelineSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = sectionTitle(doc, '4. CRONOGRAMA E STATUS', currentY);

  const steps: Array<[string, string, string]> = [
    ['Criação', formatDate(service.created_at), 'Concluído'],
    ['Atribuição', formatForPdf(service.technician ? 'Técnico atribuído' : '—'), 'Concluído'],
    ['Execução', formatForPdf(service.status_detail || 'Em execução'), service.status || '—'],
    ['Finalização', formatForPdf(service.finished_at ? formatDate(service.finished_at) : 'Aguardando'), formatForPdf(service.is_done ? 'Concluído' : 'Pendente')],
  ];

  drawTable(doc, ['Etapa', 'Detalhes', 'Status'], steps, currentY + 4);
  return (doc as any).lastAutoTable.finalY + 8;
};

// ============= Técnico Responsável =============
const createTechnicianSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = sectionTitle(doc, '5. TÉCNICO RESPONSÁVEL', currentY);

  const info = [
    ['Nome', formatForPdf(service.technician?.name || service.technician_name || 'Não informado')],
    ['Função', formatForPdf(service.technician?.role || service.technician_role || 'tecnico')],
    ['Email', formatForPdf(service.technician?.email || service.technician_email || 'Não informado')],
    ['Telefone', formatForPdf(service.technician?.phone || service.technician_phone || 'Não informado')],
  ];

  drawTable(doc, ['Campo', 'Informação'], info, currentY + 4);
  return (doc as any).lastAutoTable.finalY + 8;
};

// ============= Campos técnicos (Checklist) =============
const createTechnicianFieldsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;

  currentY = sectionTitle(doc, '6. CHECKLIST TÉCNICO', currentY);

  const fields = (service.customFields || []).map((f: any) => ([
    formatForPdf(f?.label || f?.name || '-'),
    formatForPdf(f?.type || '-'),
    formatForPdf(
      f?.type === 'boolean' ? (f?.value ? 'true' : 'false') : f?.value ?? '-'
    ),
    formatForPdf(f?.status || 'Configurado'),
  ]));

  const fieldsData = fields.length ? fields : [];

  if (fieldsData.length) {
    autoTable(doc, {
      startY: currentY + 6,
      head: [['Campo', 'Tipo', 'Valor', 'Status']],
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
    return currentY + 10;
  }
};

// ============= Comunicações =============
const createCommunicationsSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;
  currentY = sectionTitle(doc, '7. COMUNICAÇÕES', currentY);

  const messages = (service.messages || []).map((m: any, idx: number) => ({
    author: m.author || m.user_name || `Mensagem ${idx + 1}`,
    role: m.role || m.user_role || '-',
    text: formatForPdf(m.text || m.message || ''),
    created_at: m.created_at || m.date || new Date().toISOString(),
  }));

  if (!messages.length) {
    safeAddText(doc, 'Nenhuma comunicação registrada.', PDF_DIMENSIONS.margin, currentY + 4);
    return currentY + 10;
  }

  const cardX = PDF_DIMENSIONS.margin;
  const cardW = PDF_DIMENSIONS.pageWidth - 2 * PDF_DIMENSIONS.margin;

  messages.forEach((msg, i) => {
    currentY = checkPageBreak(doc, currentY, 24);

    // Card
    doc.setFillColor(255, 255, 255);
    doc.setDrawColor(...PDF_COLORS.border);
    doc.setLineWidth(0.3);
    doc.roundedRect(cardX, currentY + 2, cardW, 20, 2, 2, 'S');

    // Barra à esquerda
    doc.setFillColor(...PDF_COLORS.accent);
    doc.rect(cardX, currentY + 2, 2, 20, 'F');

    // Conteúdo
    doc.setFont(PDF_FONTS.normal, 'bold' as any);
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    safeAddText(doc, `${formatForPdf(msg.author)} — ${formatForPdf(msg.role)}`, cardX + 4, currentY + 8);

    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.secondary);
    safeAddText(doc, formatDate(msg.created_at), cardX + 4, currentY + 13);

    const wrapped = doc.splitTextToSize(msg.text, cardW - 8);
    safeAddText(doc, wrapped, cardX + 4, currentY + 18);

    currentY += 22 + Math.max(0, (wrapped.length - 1)) * 4.2;
  });

  return currentY + 4;
};

// ============= Feedback =============
const createFeedbackSection = (doc: any, service: Service, startY: number): number => {
  let currentY = startY;
  currentY = sectionTitle(doc, '8. FEEDBACK DO CLIENTE', currentY);

  const cardX = PDF_DIMENSIONS.margin;
  const cardW = PDF_DIMENSIONS.pageWidth - 2 * PDF_DIMENSIONS.margin;
  const cardH = 22;

  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(cardX, currentY + 2, cardW, cardH, 2, 2, 'S');
  
  // Barra à esquerda
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(cardX, currentY + 2, 2, cardH, 'F');

  const rating = service.feedback?.rating || service.feedback_rating || null;
  const comment = formatForPdf(service.feedback?.comment || service.feedback_comment || '');
  const techObs = formatForPdf(service.feedback?.technician_note || service.feedback_technician_note || '');

  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(11);
  safeAddText(doc, 'Comentário do Cliente:', cardX + 4, currentY + 8);

  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.setFontSize(10);
  const wrapC = doc.splitTextToSize(comment || '—', cardW - 8);
  safeAddText(doc, wrapC, cardX + 4, currentY + 13);

  let y = currentY + 13 + wrapC.length * 4.2 + 2;

  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(11);
  safeAddText(doc, 'Observações do Técnico:', cardX + 4, y);

  doc.setFont(PDF_FONTS.normal, 'normal' as any);
  doc.setTextColor(...PDF_COLORS.secondary);
  doc.setFontSize(10);
  const wrapT = doc.splitTextToSize(techObs || '—', cardW - 8);
  safeAddText(doc, wrapT, cardX + 4, y + 5);

  y += 5 + wrapT.length * 4.2;

  if (rating) {
    doc.setFont(PDF_FONTS.normal, 'bold' as any);
    doc.setTextColor(...PDF_COLORS.primary);
    doc.setFontSize(11);
    safeAddText(doc, `Avaliação: ${rating}/5`, cardX + 4, y + 4);
    y += 6;
  }

  return y + 4;
};

// ============= Assinaturas =============
const createSignaturesSection = async (doc: any, service: Service, startY: number): Promise<number> => {
  let currentY = startY;
  currentY = sectionTitle(doc, '9. ASSINATURAS', currentY);

  const boxW = (PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin * 2 - 8) / 2;
  const boxH = 30;
  const y = currentY + 4;
  const x1 = PDF_DIMENSIONS.margin;
  const x2 = x1 + boxW + 8;

  // Cliente
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(x1, y, boxW, boxH, 2, 2, 'S');
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(10);
  safeAddText(doc, 'Assinatura do Cliente', x1 + 4, y + 6);

  try {
    const signClient = service.signatures?.client
      ? await processImage(service.signatures.client)
      : null;
    if (signClient) {
      doc.addImage(signClient, 'PNG', x1 + 4, y + 8, boxW - 8, 12);
    } else {
      doc.setFont(PDF_FONTS.normal, 'normal' as any);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.setFontSize(9);
      safeAddText(doc, '[Aguardando assinatura]', x1 + 4, y + 16);
    }
  } catch {}

  // Técnico
  doc.setDrawColor(...PDF_COLORS.border);
  doc.roundedRect(x2, y, boxW, boxH, 2, 2, 'S');
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(10);
  safeAddText(doc, 'Assinatura do Técnico', x2 + 4, y + 6);

  try {
    const signTech = service.signatures?.technician
      ? await processImage(service.signatures.technician)
      : null;
    if (signTech) {
      doc.addImage(signTech, 'PNG', x2 + 4, y + 8, boxW - 8, 12);
    } else {
      doc.setFont(PDF_FONTS.normal, 'normal' as any);
      doc.setTextColor(...PDF_COLORS.secondary);
      doc.setFontSize(9);
      safeAddText(doc, '[Aguardando assinatura]', x2 + 4, y + 16);
    }
  } catch {}

  return y + boxH + 6;
};

// ============= Fotos (grid 2–3 col) =============
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
      const { data: photosData } = await supabase
        .from('service_photos')
        .select('photo_url, title')
        .eq('service_id', service.id)
        .order('created_at', { ascending: true });

      if (photosData && photosData.length > 0) {
        photosWithTitles = photosData.map((p: any, index: number) => ({
          url: p.photo_url,
          title: p.title ? formatForPdf(p.title) : `Foto ${index + 1}`
        }));
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

  const photosPerRow = photosWithTitles.length > 3 ? 3 : 2;
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

    currentY += maxTitleHeight + 4 + photoHeight + 8;
  }

  return currentY + 4;
};

// ============= Cabeçalho e rodapé =============
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
    doc.setLineWidth(0.2);
    doc.line(PDF_DIMENSIONS.margin, 288, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 288);

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
    const d = new Date(dateString);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${mi}`;
  } catch {
    return String(dateString);
  }
};

const sectionTitle = (doc: any, title: string, y: number): number => {
  doc.setFont(PDF_FONTS.normal, 'bold' as any);
  doc.setFontSize(16);
  doc.setTextColor(...PDF_COLORS.primary);
  safeAddText(doc, title, PDF_DIMENSIONS.margin, y);

  // Divider
  doc.setDrawColor(...PDF_COLORS.border);
  doc.setLineWidth(0.2);
  doc.line(PDF_DIMENSIONS.margin, y + 2, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, y + 2);

  return y + 6;
};

const drawDefinitionList = (doc: any, pairs: Array<[string, string]>, startY: number) => {
  const labelW = 40;
  const lineH = 5.2;
  let y = startY;

  pairs.forEach(([label, value]) => {
    doc.setFont(PDF_FONTS.normal, 'bold' as any);
    doc.setFontSize(11);
    doc.setTextColor(...PDF_COLORS.primary);
    safeAddText(doc, label, PDF_DIMENSIONS.margin, y);

    doc.setFont(PDF_FONTS.normal, 'normal' as any);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.setFontSize(11);

    const maxW = PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin * 2 - labelW - 2;
    const wrapped = doc.splitTextToSize(value, maxW);
    safeAddText(doc, wrapped, PDF_DIMENSIONS.margin + labelW, y);

    y += Math.max(lineH, wrapped.length * 4.2);
  });

  return y + 2;
};

const drawTable = (doc: any, head: string[], body: (string[])[], startY: number) => {
  autoTable(doc, {
    startY,
    head: [head],
    body,
    ...defaultTableTheme('accent'),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [...PDF_COLORS.tableStripe] as [number, number, number],
    },
  });
};
