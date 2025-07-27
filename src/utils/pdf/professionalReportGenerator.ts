import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service, Photo, User } from '@/types/serviceTypes';
import { logger } from '@/utils/loggingService';

// --- CONFIGURAÇÕES DE DESIGN ---
const FONT_LINK = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;500;700&display=swap';
const THEME_COLOR_START = '#1e3a8a'; // azul escuro
const THEME_COLOR_END = '#3b82f6';   // azul claro
const TEXT_COLOR = '#333333';
const BORDER_COLOR = '#e5e7eb';
const PAGE_MARGIN = '40px';

/**
 * Gera o relatório completo usando template HTML/CSS para máxima flexibilidade de layout.
 */
export const generateProfessionalServiceReport = async (
  service: Service,
  photos: Photo[],
  user: User
): Promise<void> => {
  try {
    logger.info(`Gerando Relatório Profissional para: ${service.id}`, 'PDF');
    const doc = new jsPDF('p', 'pt', 'a4');

    // Template HTML com gradientes, grids e tipografia Poppins
    const html = `
      <html>
      <head>
        <meta charset="UTF-8"/>
        <link href="${FONT_LINK}" rel="stylesheet"/>
        <style>
          body {
            font-family: 'Poppins', sans-serif;
            margin: ${PAGE_MARGIN};
            color: ${TEXT_COLOR};
            line-height: 1.4;
          }
          .cover {
            background: linear-gradient(135deg, ${THEME_COLOR_START}, ${THEME_COLOR_END});
            color: #fff;
            height: 100vh;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: flex-start;
            padding: 0 ${PAGE_MARGIN};
          }
          .cover h1 {
            font-size: 64pt;
            margin: 0;
            font-weight: 700;
          }
          .cover h2 {
            font-size: 28pt;
            margin: 16px 0;
            font-weight: 500;
          }
          .cover .info {
            font-size: 12pt;
            margin-top: 24px;
            display: flex;
            gap: 24px;
          }
          .section-title {
            font-size: 20pt;
            margin-top: 48px;
            margin-bottom: 16px;
            padding-bottom: 4px;
            border-bottom: 4px solid ${THEME_COLOR_END};
            font-weight: 500;
          }
          .two-col {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 32px;
            margin-top: 16px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 16px;
          }
          th, td {
            border: 1px solid ${BORDER_COLOR};
            padding: 12px;
            font-size: 10pt;
          }
          th {
            background-color: ${THEME_COLOR_START};
            color: #fff;
            font-weight: 500;
          }
          .photo-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
            gap: 12px;
            margin-top: 16px;
          }
          .photo-grid img {
            width: 100%;
            height: auto;
            border: 1px solid ${BORDER_COLOR};
            border-radius: 8px;
            object-fit: cover;
          }
          .signature {
            display: flex;
            justify-content: space-between;
            margin-top: 48px;
          }
          .sig-block {
            text-align: center;
            font-size: 10pt;
          }
          .footer {
            position: fixed;
            bottom: ${PAGE_MARGIN};
            width: calc(100% - 2*${PAGE_MARGIN});
            text-align: center;
            font-size: 8pt;
            color: #888;
          }
        </style>
      </head>
      <body>

        <!-- CAPA -->
        <div class="cover">
          <h1>RELATÓRIO DE SERVIÇO</h1>
          <h2>${service.title}</h2>
          <div class="info">
            <div><strong>Cliente:</strong> ${service.client || 'N/A'}</div>
            <div><strong>OS:</strong> ${service.number || 'N/A'}</div>
            <div><strong>Data:</strong> ${new Date().toLocaleDateString('pt-BR')}</div>
          </div>
        </div>

        <!-- RESUMO DA DEMANDA -->
        <div class="section-title">Resumo da Demanda</div>
        <div class="two-col">
          <div>
            <p><strong>Cliente:</strong> ${service.client || 'N/A'}</p>
            <p><strong>Local:</strong> ${service.location || 'N/A'}</p>
            <p><strong>Endereço:</strong> ${service.address || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Status:</strong> ${service.status}</p>
            <p><strong>Tipo:</strong> ${service.serviceType || 'N/A'}</p>
            <p><strong>Técnico(s):</strong> ${(service.technicians?.map(t => t.name).join(', ') || 'Nenhum')}</p>
          </div>
        </div>

        <!-- CHECKLIST TÉCNICO -->
        ${service.customFields?.length ? `
        <div class="section-title">Checklist Técnico</div>
        <table>
          <thead><tr><th>Item</th><th>Status</th></tr></thead>
          <tbody>
            ${service.customFields.map(f => `<tr><td>${f.label}</td><td>${typeof f.value === 'boolean' ? (f.value ? 'Sim' : 'Não') : f.value}</td></tr>`).join('')}
          </tbody>
        </table>
        ` : ''}

        <!-- REGISTRO FOTOGRÁFICO -->
        ${photos?.length ? `
        <div class="section-title">Registro Fotográfico</div>
        <div class="photo-grid">
          ${photos.map(p => `<figure><img src="${p.url}" alt="${p.title || ''}"/><figcaption style="font-size:8pt; text-align:center;">${p.title || ''}</figcaption></figure>`).join('')}
        </div>
        ` : ''}

        <!-- ASSINATURAS -->
        ${(service.signatures?.client || service.signatures?.technician) ? `
        <div class="section-title">Assinaturas</div>
        <div class="signature">
          ${service.signatures.client ? `<div class="sig-block"><img src="${service.signatures.client}" width="200" height="100"/><div>${service.client || 'Cliente'}</div></div>` : ''}
          ${service.signatures.technician ? `<div class="sig-block"><img src="${service.signatures.technician}" width="200" height="100"/><div>${(service.technicians?.[0]?.name) || 'Técnico'}</div></div>` : ''}
        </div>
        ` : ''}

        <!-- RODAPÉ -->
        <div class="footer">Página <span class="pageNumber"></span> de <span class="totalPages"></span></div>
      </body>
      </html>
    `;

    // Renderiza HTML/CSS no PDF
    await doc.html(html, {
      callback: (doc) => {
        const fileName = `Relatorio_OS_${service.number || service.id.substring(0,6)}.pdf`;
        doc.save(fileName);
        logger.info(`Relatório gerado: ${fileName}`, 'PDF');
      },
      x: 0,
      y: 0,
      autoPaging: 'text',
      html2canvas: { scale: 0.7 }
    });

  } catch (error) {
    logger.error(`Erro ao gerar PDF: ${error instanceof Error ? error.message : 'Desconhecido'}`, 'PDF');
    throw new Error('Falha ao gerar PDF: ' + (error instanceof Error ? error.message : 'Desconhecido'));
  }
};
