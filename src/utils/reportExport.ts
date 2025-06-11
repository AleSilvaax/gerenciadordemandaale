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

// Export services to Excel format
export const exportServicesToExcel = (services: Service[]): void => {
  // In a real app, this would use a library like xlsx or exceljs
  // For now, we'll just log that this would create an Excel file
  console.log("Exportando para Excel...", services);
  alert("Funcionalidade de exportação para Excel será implementada em breve.");
};

// Export services to PDF
export const exportServicesToPDF = (services: Service[]): void => {
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
    service.id,
    service.title,
    service.client || "N/A",
    service.status === "pendente" ? "Pendente" : 
    service.status === "concluido" ? "Concluído" : "Cancelado",
    service.date ? formatDateBR(service.date) : "N/A",
    service.technician.name
  ]);
  
  // Add table to document
  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: 35,
    styles: { fontSize: 8, cellPadding: 3 },
    headStyles: { fillColor: [75, 58, 172] }
  });
  
  // Add summary
  const totalServices = services.length;
  const pendingServices = services.filter(s => s.status === "pendente").length;
  const completedServices = services.filter(s => s.status === "concluido").length;
  const canceledServices = services.filter(s => s.status === "cancelado").length;
  
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  
  doc.text(`Total de Demandas: ${totalServices}`, 14, finalY);
  doc.text(`Pendentes: ${pendingServices}`, 14, finalY + 7);
  doc.text(`Concluídas: ${completedServices}`, 14, finalY + 14);
  doc.text(`Canceladas: ${canceledServices}`, 14, finalY + 21);
  
  // Save the PDF
  doc.save("relatorio-demandas.pdf");
};

// Export statistics to PDF
export const exportStatisticsToPDF = (services: Service[]): void => {
  const doc = new jsPDF();
  
  // Add title
  doc.setFontSize(20);
  doc.text("Relatório de Estatísticas", 105, 15, { align: "center" });
  
  // Add date
  doc.setFontSize(10);
  doc.text(`Gerado em: ${formatDateBR(new Date())}`, 105, 25, { align: "center" });
  
  // Add summary statistics
  const totalServices = services.length;
  const pendingServices = services.filter(s => s.status === "pendente").length;
  const completedServices = services.filter(s => s.status === "concluido").length;
  const canceledServices = services.filter(s => s.status === "cancelado").length;
  
  const inspectionServices = services.filter(s => s.serviceType === "Vistoria").length;
  const installationServices = services.filter(s => s.serviceType === "Instalação").length;
  
  // Group by month
  const monthlyData = Array(12).fill(0);
  services.forEach(service => {
    if (service.date) {
      const date = new Date(service.date);
      monthlyData[date.getMonth()]++;
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
      ["Pendentes", pendingServices.toString(), `${((pendingServices / totalServices) * 100).toFixed(1)}%`],
      ["Concluídas", completedServices.toString(), `${((completedServices / totalServices) * 100).toFixed(1)}%`],
      ["Canceladas", canceledServices.toString(), `${((canceledServices / totalServices) * 100).toFixed(1)}%`],
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
      ["Vistoria", inspectionServices.toString(), `${((inspectionServices / totalServices) * 100).toFixed(1)}%`],
      ["Instalação", installationServices.toString(), `${((installationServices / totalServices) * 100).toFixed(1)}%`],
      ["Outros", (totalServices - inspectionServices - installationServices).toString(), 
       `${(((totalServices - inspectionServices - installationServices) / totalServices) * 100).toFixed(1)}%`]
    ],
    startY: (doc as any).lastAutoTable.finalY + 15,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [75, 58, 172] }
  });
  
  // Add monthly table
  const monthlyRows = months.map((month, index) => [
    month,
    monthlyData[index].toString(),
    `${((monthlyData[index] / totalServices) * 100).toFixed(1)}%`
  ]);
  
  autoTable(doc, {
    head: [["Mês", "Demandas", "Percentual"]],
    body: monthlyRows,
    startY: (doc as any).lastAutoTable.finalY + 15,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [75, 58, 172] }
  });
  
  // Save the PDF
  doc.save("estatisticas-demandas.pdf");
};
