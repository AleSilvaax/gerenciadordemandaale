import jsPDF from 'jspdf';
import { Service } from '@/types/serviceTypes';
import { applyDarkBackground, drawRevoHeader, drawRevoFooter } from './revoLayout';

/**
 * Adiciona cabeçalhos e rodapés Revo (fundo já aplicado automaticamente)
 */
export const addRevoHeadersAndFooters = async (doc: jsPDF, service: Service): Promise<void> => {
  const pageCount = doc.getNumberOfPages();

  // Adicionar cabeçalhos Revo em todas as páginas (exceto capa)
  for (let i = 2; i <= pageCount; i++) {
    doc.setPage(i);
    await drawRevoHeader(doc, `OS #${service.number} - ${service.title || 'RELATÓRIO TÉCNICO'}`);
  }

  // Adicionar rodapés Revo
  drawRevoFooter(doc, 1); // 1 = pular capa
};