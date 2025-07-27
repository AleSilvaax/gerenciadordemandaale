// ARQUIVO COMPLETO E FINAL V8.0: src/utils/pdf/professionalReportGenerator.ts

import { jsPDF } from 'jspdf';
import { Service, Photo, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- PALETA DE DESIGN E ESTILOS ---
const THEME_COLOR = '#1E50A0';      // Azul corporativo
const HEADING_COLOR = '#2D3436';   // Cinza escuro para títulos
const BODY_TEXT_COLOR = '#636E72';  // Cinza médio para textos
const BORDER_COLOR = '#E0E0E0';     // Cinza claro para bordas
const PAGE_MARGIN = '50px';

export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório de Design V8 para: ${service.id}`, 'PDF');
    
    // Constrói o conteúdo do checklist técnico
    const checklistHtml = (service.customFields && service.customFields.length > 0)
      ? `
        <div class="section-title">Checklist Técnico</div>
        <table>
          <thead>
            <tr><th>Item</th><th>Valor / Status</th></tr>
          </thead>
          <tbody>
            ${service.customFields.map(field => `
              <tr>
                <td>${field.label}</td>
                <td>${typeof field.value === 'boolean' ? (field.value ? 'Sim' : 'Não') : (field.value || 'N/A')}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      `
      : '';

    // Constrói a grade de fotos
    const photosHtml = (photos && photos.length > 0)
      ? `
        <div class="section-title">Registro Fotográfico</div>
        <div class="photo-grid">
          ${photos.map(photo => `
            <div class="photo-item">
              <img src="${photo.url}" alt="${photo.title || ''}">
              <p>${photo.title || ''}</p>
            </div>
          `).join('')}
        </div>
      `
      : '';

    // Constrói a seção de assinaturas (com verificação de segurança)
    const signaturesHtml = (service.signatures?.client || service.signatures?.technician)
      ? `
        <div class="section-title">Assinaturas</div>
        <div class="signature-container">
          ${service.signatures.client ? `
            <div class="signature-block">
              <img src="${service.signatures.client}" alt="Assinatura do Cliente">
              <div class="signature-line"></div>
              <p>${service.client || 'Cliente'}</p>
            </div>
          ` : ''}
          ${service.signatures.technician ? `
            <div class="signature-block">
              <img src="${service.signatures.technician}" alt="Assinatura do Técnico">
              <div class="signature-line"></div>
              <p>${(service.technicians && service.technicians.length > 0 && service.technicians[0].name) || 'Técnico'}</p>
            </div>
          ` : ''}
        </div>
      `
      : '';

    // Monta o documento HTML completo
    const htmlString = `
      <html>
      <head>
        <meta charset="UTF-8">
        <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;700&display=swap" rel="stylesheet">
        <style>
          body { font-family: 'Roboto', sans-serif; margin: 0; color: ${BODY_TEXT_COLOR}; font-size: 10pt; }
          .page { padding: ${PAGE_MARGIN}; position: relative; min-height: 90vh; page-break-after: always; }
          .page:last-child { page-break-after: auto; }
          .cover {
            background-color: ${THEME_COLOR};
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
            padding: ${PAGE_MARGIN};
          }
          .cover h1 { font-size: 42pt; margin: 0; font-weight: 700; }
          .cover h2 { font-size: 18pt; margin: 10px 0; font-weight: 300; border-top: 1px solid rgba(255,255,255,0.5); border-bottom: 1px solid rgba(255,255,255,0.5); padding: 10px 0; }
          .cover .info { position: absolute; bottom: 50px; text-align: center; width: 100%; font-size: 9pt; }
          .section-title { font-size: 16pt; font-weight: 700; color: ${HEADING_COLOR}; margin-top: 30px; margin-bottom: 15px; border-bottom: 2px solid ${THEME_COLOR}; padding-bottom: 8px; }
          .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 20px; }
          .two-col p { margin: 0 0 8px 0; }
          .two-col strong { color: ${HEADING_COLOR}; }
          table { width: 100%; border-collapse: collapse; margin-top: 15px; }
          th, td { border: 1px solid ${BORDER_COLOR}; padding: 10px; text-align: left; }
          th { background-color: ${HEADING_COLOR}; color: white; font-weight: 700; }
          tr:nth-child(even) { background-color: #F8F9FA; }
          .photo-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; page-break-inside: avoid; }
          .photo-item img { width: 100%; border: 1px solid ${BORDER_COLOR}; border-radius: 4px; }
          .photo-item p { font-size: 8pt; text-align: center; margin-top: 5px; color: ${BODY_TEXT_COLOR}; }
          .signature-container { display: flex; justify-content: space-around; margin-top: 40px; page-break-inside: avoid; }
          .signature-block { text-align: center; }
          .signature-block img { max-width: 200px; max-height: 100px; }
          .signature-line { border-top: 1px solid ${HEADING_COLOR}; margin-top: 5px; }
          .signature-block p { font-size: 10pt; margin-top: 5px; color: ${HEADING_COLOR}; }
        </style>
      </head>
      <body>
