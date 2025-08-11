import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service } from '@/types/serviceTypes';
import { PDF_COLORS, PDF_DIMENSIONS, PDF_FONTS } from './pdfConstants';
import { sanitizeText, wrapText, addText, checkPageBreak } from './pdfHelpers';
import { processImage } from './imageProcessor';
import { defaultTableTheme } from './pdfLayout';

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
  const fileName = `OS_${service.number}_${new Date().toISOString().slice(0, 10)}.pdf`;
  doc.save(fileName);
};

const createProfessionalCover = async (doc: jsPDF, service: Service): Promise<number> => {
  // Fundo gradiente mais moderno - duas cores principais
  doc.setFillColor(...PDF_COLORS.primary);
  doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 120, 'F');
  
  // Gradiente decorativo secundário
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(0, 100, PDF_DIMENSIONS.pageWidth, 20, 'F');
  
  // Faixa accent mais destacada
  doc.setFillColor(...PDF_COLORS.accent);
  doc.rect(0, 115, PDF_DIMENSIONS.pageWidth, 8, 'F');
  
  // Elementos geométricos decorativos
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.circle(180, 25, 15, 'F');
  doc.setFillColor(...PDF_COLORS.primaryLight);
  doc.rect(170, 35, 30, 3, 'F');
  
  // Logo modernizado
  try {
    const logo = await processImage('/logo.svg');
    if (logo) {
      doc.addImage(logo, 'PNG', PDF_DIMENSIONS.margin, 15, 20, 20);
    } else {
      // Fallback - logo simples geométrico
      doc.setFillColor(...PDF_COLORS.white);
      doc.rect(PDF_DIMENSIONS.margin, 15, 20, 20, 'F');
      doc.setFillColor(...PDF_COLORS.accent);
      doc.circle(PDF_DIMENSIONS.margin + 10, 25, 6, 'F');
    }
  } catch (e) {
    // Logo fallback mais elaborado
    doc.setFillColor(...PDF_COLORS.white);
    doc.rect(PDF_DIMENSIONS.margin, 15, 20, 20, 'F');
    doc.setFillColor(...PDF_COLORS.accent);
    doc.circle(PDF_DIMENSIONS.margin + 10, 25, 6, 'F');
  }
  
  // Título principal mais impactante
  doc.setFontSize(32);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(255, 255, 255);
  doc.text('RELATÓRIO TÉCNICO', PDF_DIMENSIONS.pageWidth / 2, 45, { align: 'center' });
  
  // Subtítulo com mais estilo
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, 'normal');
  doc.text('Sistema Integrado de Gestão', PDF_DIMENSIONS.pageWidth / 2, 62, { align: 'center' });
  
  // Badge OS mais visível
  doc.setFillColor(...PDF_COLORS.accentLight);
  doc.roundedRect(65, 75, 80, 12, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(`OS #${service.number || 'N/A'}`, PDF_DIMENSIONS.pageWidth / 2, 83, { align: 'center' });
  
  // Card principal de informações mais moderno
  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(25, 135, 160, 130, 8, 8, 'F');
  
  // Sombra simulada do card
  doc.setFillColor(...PDF_COLORS.mediumGray);
  doc.roundedRect(27, 137, 160, 130, 8, 8, 'F');
  doc.setFillColor(...PDF_COLORS.white);
  doc.roundedRect(25, 135, 160, 130, 8, 8, 'F');
  
  // Borda decorativa do card
  doc.setDrawColor(...PDF_COLORS.accent);
  doc.setLineWidth(0.8);
  doc.roundedRect(25, 135, 160, 130, 8, 8, 'S');
  
  // Header do card com background
  doc.setFillColor(...PDF_COLORS.lightGray);
  doc.roundedRect(25, 135, 160, 25, 8, 8, 'F');
  doc.rect(25, 152, 160, 8, 'F'); // Complemento para deixar quadrado embaixo
  
  // Título do card
  doc.setTextColor(...PDF_COLORS.primary);
  doc.setFontSize(18);
  doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
  doc.text('RESUMO EXECUTIVO', 105, 150, { align: 'center' });
  
  // Informações organizadas em duas colunas
  let infoY = 175;
  const leftCol = 35;
  const rightCol = 115;
  
  const leftInfo = [
    ['Demanda:', sanitizeText(service.title)],
    ['Cliente:', sanitizeText(service.client)],
    ['Localização:', sanitizeText(service.location)],
  ];
  
  const rightInfo = [
    ['Tipo:', sanitizeText(service.serviceType)],
    ['Status:', getStatusText(service.status)],
    ['Prioridade:', service.priority || 'Normal'],
  ];
  
  doc.setFontSize(10);
  
  // Coluna esquerda
  leftInfo.forEach(([label, value]) => {
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(label, leftCol, infoY);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.text);
    const wrappedValue = doc.splitTextToSize(value, 70);
    doc.text(wrappedValue, leftCol, infoY + 6);
    infoY += 18;
  });
  
  // Coluna direita
  infoY = 175;
  rightInfo.forEach(([label, value]) => {
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(...PDF_COLORS.secondary);
    doc.text(label, rightCol, infoY);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.text);
    const wrappedValue = doc.splitTextToSize(value, 70);
    doc.text(wrappedValue, rightCol, infoY + 6);
    infoY += 18;
  });
  
  // Data de criação e prazo com ícones
  doc.setFillColor(...PDF_COLORS.accent);
  doc.circle(leftCol, 235, 3, 'F');
  doc.setTextColor(...PDF_COLORS.text);
  doc.setFontSize(9);
  doc.text(`Criado: ${formatDate(service.creationDate)}`, leftCol + 8, 237);
  
  if (service.dueDate) {
    doc.setFillColor(...PDF_COLORS.warning);
    doc.circle(rightCol, 235, 3, 'F');
    doc.text(`Prazo: ${formatDate(service.dueDate)}`, rightCol + 8, 237);
  }
  
  // Rodapé da capa mais elegante
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.textLight);
  doc.text(`Documento gerado automaticamente em ${formatDate(new Date().toISOString())}`, 105, 280, { align: 'center' });
  
  return 290;
};

const createIndex = (doc: jsPDF, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, 'ÍNDICE', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 18,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  currentY += 10;
  
  const indexItems = [
    '1. Informações Gerais',
    '2. Detalhes do Cliente',
    '3. Cronograma e Status',
    '4. Técnico Responsável',
    '5. Campos Técnicos',
    '6. Comunicações',
    '7. Feedback',
    '8. Assinaturas',
    '9. Anexos Fotográficos'
  ];
  
  indexItems.forEach((item, index) => {
    currentY = addText(doc, item, PDF_DIMENSIONS.margin + 10, currentY, {
      fontSize: 10,
      color: [...PDF_COLORS.text] as [number, number, number]
    });
    currentY += 2;
  });
  
  return currentY + 20;
};

const createServiceOverview = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  // Título da seção
  currentY = addText(doc, '1. INFORMAÇÕES GERAIS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  currentY += 5;
  
  // Caixa de destaque
  doc.setFillColor(...PDF_COLORS.lightGray);
  doc.rect(PDF_DIMENSIONS.margin - 5, currentY - 5, 170, 60, 'F');
  
  doc.setDrawColor(...PDF_COLORS.border);
  doc.rect(PDF_DIMENSIONS.margin - 5, currentY - 5, 170, 60, 'S');
  
  // Informações principais
  const overview = [
    ['Número da OS:', service.number || 'N/A'],
    ['Título:', service.title],
    ['Tipo de Serviço:', service.serviceType || 'Não especificado'],
    ['Prioridade:', service.priority || 'Normal'],
    ['Status Atual:', getStatusText(service.status)],
    ['Localização:', service.location || 'Não informado']
  ];
  
  overview.forEach(([label, value]) => {
    currentY = addText(doc, `${label} ${value}`, PDF_DIMENSIONS.margin, currentY, {
      fontSize: 10,
      color: [...PDF_COLORS.text] as [number, number, number]
    });
    currentY += 3;
  });
  
  currentY += 15;
  
  // Descrição
  if (service.description) {
    currentY = addText(doc, 'Descrição do Serviço:', PDF_DIMENSIONS.margin, currentY, {
      fontSize: 12,
      fontStyle: 'bold',
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    
    currentY = addText(doc, service.description, PDF_DIMENSIONS.margin, currentY, {
      fontSize: 10,
      color: [...PDF_COLORS.text] as [number, number, number],
      maxWidth: 160
    });
  }
  
  return currentY + 10;
};

const createClientDetails = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '2. DETALHES DO CLIENTE', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  // Tabela de informações do cliente
  const clientData = [
    ['Nome/Razão Social', service.client || 'Não informado'],
    ['Endereço', service.address || 'Não informado'],
    ['Cidade', service.city || 'Não informada'],
    ['Local do Serviço', service.location || 'Não informado']
  ];
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Campo', 'Informação']],
    body: clientData,
    ...defaultTableTheme('primary'),
    theme: 'grid',
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
};

const createTimelineSection = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '3. CRONOGRAMA E STATUS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  const timelineData = [
    ['Criação', formatDate(service.creationDate), '✓ Concluído'],
    ['Atribuição', service.technicians?.[0] ? 'Técnico atribuído' : 'Aguardando', service.technicians?.[0] ? '✓ Concluído' : '○ Pendente'],
    ['Execução', getExecutionStatus(service.status), getExecutionIcon(service.status)],
    ['Finalização', service.status === 'concluido' ? 'Serviço finalizado' : 'Aguardando', service.status === 'concluido' ? '✓ Concluído' : '○ Pendente']
  ];
  
  autoTable(doc, {
    startY: currentY + 5,
    head: [['Etapa', 'Detalhes', 'Status']],
    body: timelineData,
    ...defaultTableTheme('accent'),
    theme: 'striped',
  });
  
  return (doc as any).lastAutoTable.finalY + 10;
};

const createTechnicianSection = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '4. TÉCNICO RESPONSÁVEL', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  if (service.technicians && service.technicians.length > 0) {
    const technician = service.technicians[0];
    
    const techData = [
      ['Nome', technician.name],
      ['Função', technician.role || 'Técnico'],
      ['Email', technician.email || 'Não informado'],
      ['Telefone', technician.phone || 'Não informado']
    ];
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Campo', 'Informação']],
      body: techData,
      ...defaultTableTheme('secondary'),
      theme: 'grid',
    });
    
    return (doc as any).lastAutoTable.finalY + 10;
  } else {
    currentY = addText(doc, 'Nenhum técnico foi atribuído a este serviço.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 20;
  }
};

const createTechnicianFieldsSection = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '5. CHECKLIST TÉCNICO', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  if (service.customFields && service.customFields.length > 0) {
    const fieldsData = service.customFields.map(field => [
      field.label || 'Campo',
      field.type || 'texto',
      field.value ? String(field.value) : 'Não preenchido',
      'Configurado'
    ]);
    
    autoTable(doc, {
      startY: currentY + 5,
      head: [['Campo', 'Tipo', 'Valor', 'Status']],
      body: fieldsData,
      ...defaultTableTheme('accent'),
      theme: 'grid',
    });
    
    return (doc as any).lastAutoTable.finalY + 10;
  } else {
    currentY = addText(doc, 'Nenhum campo técnico configurado para este tipo de serviço.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    return currentY + 20;
  }
};

const createCommunicationsSection = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '6. COMUNICAÇÕES', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  if (service.messages && service.messages.length > 0) {
    service.messages.forEach((message, index) => {
      currentY = checkPageBreak(doc, currentY, 25);
      
      // Cabeçalho da mensagem
      currentY = addText(doc, `Mensagem ${index + 1}`, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 11,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
      
      currentY = addText(doc, `${formatDate(message.timestamp)} - ${message.senderName}`, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
      
      // Conteúdo da mensagem
      currentY = addText(doc, message.message, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });
      
      currentY += 5;
    });
  } else {
    currentY = addText(doc, 'Nenhuma comunicação registrada.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    currentY += 20;
  }
  
  return currentY;
};

const createFeedbackSection = (doc: jsPDF, service: Service, startY: number): number => {
  let currentY = startY;
  
  currentY = addText(doc, '7. FEEDBACK DO CLIENTE', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  if (service.feedback) {
    if (service.feedback.clientComment) {
      currentY = addText(doc, 'Comentário do Cliente:', PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
      
      currentY = addText(doc, service.feedback.clientComment, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });
    }
    
    if (service.feedback.technicianFeedback) {
      currentY = addText(doc, 'Observações do Técnico:', PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 12,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
      
      currentY = addText(doc, service.feedback.technicianFeedback, PDF_DIMENSIONS.margin, currentY, {
        fontSize: 10,
        color: [...PDF_COLORS.text] as [number, number, number],
        maxWidth: 160
      });
    }
    
    if (service.feedback.clientRating) {
      currentY = addText(doc, `Avaliação: ${service.feedback.clientRating}/5 estrelas`, PDF_DIMENSIONS.margin, currentY + 5, {
        fontSize: 10,
        fontStyle: 'bold',
        color: [...PDF_COLORS.accent] as [number, number, number]
      });
    }
  } else {
    currentY = addText(doc, 'Nenhum feedback registrado.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
  }
  
  return currentY + 15;
};

const createSignaturesSection = async (doc: jsPDF, service: Service, startY: number): Promise<number> => {
  let currentY = startY;
  
  currentY = addText(doc, '8. ASSINATURAS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  currentY += 10;
  
  // Assinatura do cliente
  if (service.signatures?.client) {
    currentY = addText(doc, 'Assinatura do Cliente:', PDF_DIMENSIONS.margin, currentY, {
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
          PDF_DIMENSIONS.margin,
          currentY,
          PDF_DIMENSIONS.signatureWidth,
          PDF_DIMENSIONS.signatureHeight
        );
      }
    } catch (error) {
      console.error('Erro ao processar assinatura do cliente:', error);
      currentY = addText(doc, '[Assinatura não pôde ser carregada]', PDF_DIMENSIONS.margin, currentY, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
    }
    
    currentY += PDF_DIMENSIONS.signatureHeight + 5;
  }
  
  // Assinatura do técnico
  if (service.signatures?.technician) {
    currentY = addText(doc, 'Assinatura do Técnico:', PDF_DIMENSIONS.margin, currentY, {
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
          PDF_DIMENSIONS.margin,
          currentY,
          PDF_DIMENSIONS.signatureWidth,
          PDF_DIMENSIONS.signatureHeight
        );
      }
    } catch (error) {
      console.error('Erro ao processar assinatura do técnico:', error);
      currentY = addText(doc, '[Assinatura não pôde ser carregada]', PDF_DIMENSIONS.margin, currentY, {
        fontSize: 9,
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
    }
    
    currentY += PDF_DIMENSIONS.signatureHeight + 5;
  }
  
  if (!service.signatures?.client && !service.signatures?.technician) {
    currentY = addText(doc, 'Nenhuma assinatura registrada.', PDF_DIMENSIONS.margin, currentY, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    currentY += 15;
  }
  
  return currentY;
};

const createPhotosSection = async (doc: jsPDF, service: Service, startY: number): Promise<number> => {
  let currentY = startY;
  
  currentY = addText(doc, '9. ANEXOS FOTOGRÁFICOS', PDF_DIMENSIONS.margin, currentY, {
    fontSize: 16,
    fontStyle: 'bold',
    color: [...PDF_COLORS.primary] as [number, number, number]
  });
  
  // Buscar fotos com títulos da tabela service_photos
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
        photosWithTitles = photosData.map((p, index) => ({
          url: p.photo_url,
          title: p.title || `Foto ${index + 1}`
        }));
        console.log('[PDF] Fotos com títulos carregadas:', photosWithTitles.length);
      }
    } catch (error) {
      console.error('[PDF] Erro ao buscar títulos das fotos:', error);
    }
  }
  
  // Fallback para o campo photos do service se não encontrou na tabela
  if (photosWithTitles.length === 0 && service.photos && service.photos.length > 0) {
    photosWithTitles = service.photos.map((url, index) => ({
      url,
      title: service.photoTitles?.[index] || `Foto ${index + 1}`
    }));
  }
  
  if (photosWithTitles.length > 0) {
    // Layout horizontal - 2 fotos por linha
    let photosPerRow = 2;
    let photoWidth = (PDF_DIMENSIONS.pageWidth - (PDF_DIMENSIONS.margin * 2) - 10) / photosPerRow;
    let photoHeight = photoWidth * 0.75;
    
    for (let i = 0; i < photosWithTitles.length; i++) {
      if (i % photosPerRow === 0) {
        currentY = checkPageBreak(doc, currentY, photoHeight + 30);
        currentY += 10;
      }
      
      const col = i % photosPerRow;
      const xPos = PDF_DIMENSIONS.margin + (col * (photoWidth + 5));
      const photo = photosWithTitles[i];
      
      // Título da foto - usar o título personalizado
      currentY = addText(doc, `${photo.title}:`, xPos, currentY, {
        fontSize: 10,
        fontStyle: 'bold',
        color: [...PDF_COLORS.secondary] as [number, number, number]
      });
      
      try {
        const imageData = await processImage(photo.url);
        if (imageData) {
          doc.addImage(
            imageData,
            'JPEG',
            xPos,
            currentY + 5,
            photoWidth,
            photoHeight
          );
        } else {
          // Placeholder para foto não carregada
          doc.setDrawColor(...PDF_COLORS.border);
          doc.rect(xPos, currentY + 5, photoWidth, photoHeight, 'S');
          
          addText(doc, '[Imagem não disponível]', xPos + 5, currentY + photoHeight / 2, {
            fontSize: 8,
            color: [...PDF_COLORS.secondary] as [number, number, number]
          });
        }
      } catch (error) {
        console.error(`Erro ao processar foto "${photo.title}":`, error);
        // Placeholder para erro
        doc.setDrawColor(...PDF_COLORS.border);
        doc.rect(xPos, currentY + 5, photoWidth, photoHeight, 'S');
        
        addText(doc, '[Erro ao carregar imagem]', xPos + 5, currentY + photoHeight / 2, {
          fontSize: 8,
          color: [...PDF_COLORS.secondary] as [number, number, number]
        });
      }
      
      if (col === photosPerRow - 1 || i === photosWithTitles.length - 1) {
        currentY += photoHeight + 15;
      }
    }
  } else {
    currentY = addText(doc, 'Nenhuma foto anexada.', PDF_DIMENSIONS.margin, currentY + 5, {
      fontSize: 10,
      color: [...PDF_COLORS.secondary] as [number, number, number]
    });
    currentY += 20;
  }
  
  return currentY;
};

const addHeadersAndFooters = (doc: jsPDF, service: Service): void => {
  const pageCount = doc.getNumberOfPages();
  
  for (let i = 2; i <= pageCount; i++) { // Pular a capa
    doc.setPage(i);
    
    // Cabeçalho
    doc.setFillColor(...PDF_COLORS.primary);
    doc.rect(0, 0, PDF_DIMENSIONS.pageWidth, 15, 'F');
    
    doc.setFontSize(10);
    doc.setFont(PDF_FONTS.normal, PDF_FONTS.bold);
    doc.setTextColor(255, 255, 255);
    doc.text(`OS #${service.number} - ${sanitizeText(service.title)}`, PDF_DIMENSIONS.margin, 10);
    
    // Rodapé
    doc.setDrawColor(...PDF_COLORS.border);
    doc.line(PDF_DIMENSIONS.margin, 280, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin, 280);
    
    doc.setFontSize(8);
    doc.setFont(PDF_FONTS.normal, 'normal');
    doc.setTextColor(...PDF_COLORS.secondary);
    
    doc.text(`Gerado em: ${formatDate(new Date().toISOString())}`, PDF_DIMENSIONS.margin, 290);
    doc.text(`Página ${i - 1} de ${pageCount - 1}`, PDF_DIMENSIONS.pageWidth - PDF_DIMENSIONS.margin - 30, 290);
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
    case 'pendente': return 'Pendente';
    case 'em_andamento': return 'Em Andamento';
    case 'concluido': return 'Concluído';
    case 'cancelado': return 'Cancelado';
    default: return 'Status não definido';
  }
};

const getExecutionStatus = (status: string): string => {
  switch (status) {
    case 'em_andamento': return 'Em execução';
    case 'concluido': return 'Executado com sucesso';
    case 'cancelado': return 'Execução cancelada';
    default: return 'Aguardando início';
  }
};

const getExecutionIcon = (status: string): string => {
  switch (status) {
    case 'em_andamento': return '◐ Em andamento';
    case 'concluido': return '✓ Concluído';
    case 'cancelado': return '✗ Cancelado';
    default: return '○ Pendente';
  }
};