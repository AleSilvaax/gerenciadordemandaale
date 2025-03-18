
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Service } from '@/types/service';

// Generate PDF from service data
export const generatePDF = (service: Service): boolean => {
  try {
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text(`Relatório de Vistoria - ${service.title}`, 14, 22);
    
    // Add details
    doc.setFontSize(12);
    doc.text(`ID: ${service.id}`, 14, 32);
    doc.text(`Status: ${service.status === 'concluido' ? 'Concluído' : service.status === 'pendente' ? 'Pendente' : 'Cancelado'}`, 14, 38);
    doc.text(`Local: ${service.location}`, 14, 44);
    
    // Add technicians
    const techniciansText = service.technicians.length > 0
      ? service.technicians.map(tech => tech.name).join(", ")
      : "Não atribuído";
    doc.text(`Técnicos: ${techniciansText}`, 14, 50);
    
    // Add report data
    doc.setFontSize(14);
    doc.text('Dados do Relatório', 14, 60);
    
    const reportData = service.reportData;
    
    autoTable(doc, {
      startY: 65,
      head: [['Campo', 'Valor']],
      body: [
        ['Cliente', reportData.client],
        ['Endereço', reportData.address],
        ['Cidade', reportData.city],
        ['Executado por', reportData.executedBy],
        ['Data de instalação', reportData.installationDate],
        ['Modelo', reportData.modelNumber],
        ['Número de série (Novo)', reportData.serialNumberNew],
        ['Número de série (Antigo)', reportData.serialNumberOld],
        ['Nome homologado', reportData.homologatedName],
        ['Atende NBR 17019', reportData.compliesWithNBR17019 ? 'Sim' : 'Não'],
        ['Instalação homologada', reportData.homologatedInstallation ? 'Sim' : 'Não'],
        ['Requer ajuste', reportData.requiredAdjustment ? 'Sim' : 'Não'],
        ['Descrição do ajuste', reportData.adjustmentDescription],
        ['Garantia válida', reportData.validWarranty ? 'Sim' : 'Não'],
        ['Disjuntor de entrada', reportData.circuitBreakerEntry],
        ['Disjuntor do carregador', reportData.chargerCircuitBreaker],
        ['Bitola do cabo', reportData.cableGauge],
        ['Status do carregador', reportData.chargerStatus],
        ['Comentários técnicos', reportData.technicalComments],
      ],
    });
    
    // Save PDF to browser memory
    // The data will be saved in PDF format and ready to download later
    (window as any).generatedPDF = doc;
    
    return true;
  } catch (error) {
    console.error('Erro ao gerar PDF:', error);
    return false;
  }
};

// Download the previously generated PDF
export const downloadPDF = (service: Service): void => {
  try {
    const doc = (window as any).generatedPDF;
    
    if (!doc) {
      // If PDF doesn't exist, generate it
      const generated = generatePDF(service);
      if (!generated) {
        throw new Error('Falha ao gerar PDF');
      }
    }
    
    // Download PDF
    const doc2 = (window as any).generatedPDF;
    doc2.save(`Relatório_${service.id}_${service.title}.pdf`);
  } catch (error) {
    console.error('Erro ao baixar PDF:', error);
  }
};
