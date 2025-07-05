
import { jsPDF } from "jspdf";
import autoTable from 'jspdf-autotable';
import { Service } from "@/types/serviceTypes";
import { formatDate } from "./formatters";

// Helper to format date to Brazilian format
const formatDateBR = (date: Date | string): string => {
  if (!date) return "N/A";
  
  if (typeof date === 'string') {
    date = new Date(date);
  }
  
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// Function to create CSV content
const createCSVContent = (services: Service[]): string => {
  const headers = ['ID', 'Título', 'Cliente', 'Status', 'Data', 'Técnico', 'Localização', 'Prioridade'];
  const csvRows = [headers.join(',')];

  services.forEach(service => {
    const row = [
      service.id,
      `"${service.title.replace(/"/g, '""')}"`,
      `"${(service.client || 'N/A').replace(/"/g, '""')}"`,
      service.status === "pendente" ? "Pendente" : 
      service.status === "concluido" ? "Concluído" : "Cancelado",
      service.date ? formatDateBR(service.date) : "N/A",
      `"${service.technician.name.replace(/"/g, '""')}"`,
      `"${service.location.replace(/"/g, '""')}"`,
      service.priority || "N/A"
    ];
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
};

// Function to download file
const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export services to CSV
export const exportServicesToCSV = (services: Service[]): void => {
  try {
    console.log('[EXPORT] Exportando para CSV...', services.length, 'serviços');
    const csvContent = createCSVContent(services);
    const filename = `demandas_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
    console.log('[EXPORT] CSV exportado com sucesso:', filename);
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar CSV:', error);
    throw new Error('Erro ao exportar arquivo CSV');
  }
};

// Export services to Excel format (CSV with Excel compatibility)
export const exportServicesToExcel = (services: Service[]): void => {
  try {
    console.log('[EXPORT] Exportando para Excel...', services.length, 'serviços');
    
    // Add BOM for Excel UTF-8 compatibility
    const BOM = '\uFEFF';
    const csvContent = createCSVContent(services);
    const excelContent = BOM + csvContent;
    
    const filename = `demandas_${new Date().toISOString().slice(0, 10)}.csv`;
    downloadFile(excelContent, filename, 'text/csv;charset=utf-8;');
    console.log('[EXPORT] Excel exportado com sucesso:', filename);
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar Excel:', error);
    throw new Error('Erro ao exportar arquivo Excel');
  }
};

// Export services to PDF
export const exportServicesToPDF = (services: Service[]): void => {
  try {
    console.log('[EXPORT] Exportando para PDF...', services.length, 'serviços');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Relatório de Demandas", 105, 15, { align: "center" });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Gerado em: ${formatDateBR(new Date())}`, 105, 25, { align: "center" });
    
    // Create table
    const tableColumn = ["ID", "Título", "Cliente", "Status", "Data", "Técnico"];
    const tableRows = services.map(service => [
      service.id.substring(0, 8) + '...',
      service.title.length > 20 ? service.title.substring(0, 20) + '...' : service.title,
      service.client || "N/A",
      service.status === "pendente" ? "Pendente" : 
      service.status === "concluido" ? "Concluído" : "Cancelado",
      service.date ? formatDateBR(service.date) : "N/A",
      service.technician.name.length > 15 ? service.technician.name.substring(0, 15) + '...' : service.technician.name
    ]);
    
    // Add table to document
    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 35,
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [75, 58, 172] },
      columnStyles: {
        0: { cellWidth: 25 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { cellWidth: 25 },
        5: { cellWidth: 30 }
      }
    });
    
    // Add summary
    const totalServices = services.length;
    const pendingServices = services.filter(s => s.status === "pendente").length;
    const completedServices = services.filter(s => s.status === "concluido").length;
    const canceledServices = services.filter(s => s.status === "cancelado").length;
    
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    
    doc.setFontSize(12);
    doc.text("RESUMO ESTATÍSTICO", 14, finalY);
    doc.setFontSize(10);
    doc.text(`Total de Demandas: ${totalServices}`, 14, finalY + 10);
    doc.text(`Pendentes: ${pendingServices}`, 14, finalY + 17);
    doc.text(`Concluídas: ${completedServices}`, 14, finalY + 24);
    doc.text(`Canceladas: ${canceledServices}`, 14, finalY + 31);
    
    // Save the PDF
    const filename = `relatorio-demandas_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    console.log('[EXPORT] PDF exportado com sucesso:', filename);
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar PDF:', error);
    throw new Error('Erro ao exportar arquivo PDF');
  }
};

// Export statistics to PDF
export const exportStatisticsToPDF = (services: Service[]): void => {
  try {
    console.log('[EXPORT] Exportando estatísticas para PDF...', services.length, 'serviços');
    
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(20);
    doc.text("Relatório de Estatísticas", 105, 15, { align: "center" });
    
    // Add date
    doc.setFontSize(10);
    doc.text(`Gerado em: ${formatDateBR(new Date())}`, 105, 25, { align: "center" });
    
    // Calculate statistics
    const totalServices = services.length;
    const pendingServices = services.filter(s => s.status === "pendente").length;
    const completedServices = services.filter(s => s.status === "concluido").length;
    const canceledServices = services.filter(s => s.status === "cancelado").length;
    
    const inspectionServices = services.filter(s => s.serviceType === "Vistoria").length;
    const installationServices = services.filter(s => s.serviceType === "Instalação").length;
    const otherServices = totalServices - inspectionServices - installationServices;
    
    // Group by month
    const monthlyData = Array(12).fill(0);
    services.forEach(service => {
      if (service.date) {
        const date = new Date(service.date);
        if (!isNaN(date.getTime())) {
          monthlyData[date.getMonth()]++;
        }
      }
    });
    
    const months = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    
    // Add status table
    autoTable(doc, {
      head: [["Status", "Quantidade", "Percentual"]],
      body: [
        ["Pendentes", pendingServices.toString(), totalServices > 0 ? `${((pendingServices / totalServices) * 100).toFixed(1)}%` : "0%"],
        ["Concluídas", completedServices.toString(), totalServices > 0 ? `${((completedServices / totalServices) * 100).toFixed(1)}%` : "0%"],
        ["Canceladas", canceledServices.toString(), totalServices > 0 ? `${((canceledServices / totalServices) * 100).toFixed(1)}%` : "0%"],
        ["Total", totalServices.toString(), "100%"]
      ],
      startY: 35,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [75, 58, 172] }
    });
    
    // Add type table
    autoTable(doc, {
      head: [["Tipo de Serviço", "Quantidade", "Percentual"]],
      body: [
        ["Vistoria", inspectionServices.toString(), totalServices > 0 ? `${((inspectionServices / totalServices) * 100).toFixed(1)}%` : "0%"],
        ["Instalação", installationServices.toString(), totalServices > 0 ? `${((installationServices / totalServices) * 100).toFixed(1)}%` : "0%"],
        ["Outros", otherServices.toString(), totalServices > 0 ? `${((otherServices / totalServices) * 100).toFixed(1)}%` : "0%"]
      ],
      startY: (doc as any).lastAutoTable.finalY + 15,
      styles: { fontSize: 10 },
      headStyles: { fillColor: [75, 58, 172] }
    });
    
    // Add monthly table
    const monthlyRows = months.map((month, index) => [
      month,
      monthlyData[index].toString(),
      totalServices > 0 ? `${((monthlyData[index] / totalServices) * 100).toFixed(1)}%` : "0%"
    ]);
    
    autoTable(doc, {
      head: [["Mês", "Demandas", "Percentual"]],
      body: monthlyRows,
      startY: (doc as any).lastAutoTable.finalY + 15,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [75, 58, 172] }
    });
    
    // Save the PDF
    const filename = `estatisticas-demandas_${new Date().toISOString().slice(0, 10)}.pdf`;
    doc.save(filename);
    console.log('[EXPORT] Estatísticas PDF exportado com sucesso:', filename);
  } catch (error) {
    console.error('[EXPORT] Erro ao exportar estatísticas PDF:', error);
    throw new Error('Erro ao exportar estatísticas PDF');
  }
};
