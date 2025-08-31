import jsPDF from 'jspdf';
import { Service } from '@/types/serviceTypes';
import { applyDarkBackground, drawRevoHeader, drawRevoFooter } from './revoLayout';

/**
 * Aplica fundo cinza escuro em todas as páginas e adiciona cabeçalhos/rodapés Revo
 */
export const addRevoHeadersAndFooters = async (doc: jsPDF, service: Service): Promise<void> => {
  const pageCount = doc.getNumberOfPages();

  // Aplicar fundo cinza escuro em todas as páginas (exceto capa)
  for (let i = 2; i <= pageCount; i++) {
    applyDarkBackground(doc, i);
  }

  // Adicionar cabeçalhos Revo em todas as páginas (exceto capa)
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    await drawRevoHeader(doc, `OS #${service.number} - ${service.title || 'RELATÓRIO TÉCNICO'}`);
  }

  // Adicionar rodapés Revo
  drawRevoFooter(doc, 1); // 1 = pular capa
};