
import { Service, TeamMember } from "@/data/mockData";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Background image for cover page (green forest scene)
const BACKGROUND_IMAGE = "/public/lovable-uploads/f79bbcd5-4a5b-4289-a624-206b123e134f.png";

// Function to create a new jsPDF instance with consistent styling
const createPdfDocument = () => {
  const pdf = new jsPDF();
  
  // Set default font
  pdf.setFont("helvetica");
  
  return pdf;
};

// Generate the cover page
const generateCoverPage = (pdf: any, service: Service) => {
  // Try to add background image
  try {
    pdf.addImage(BACKGROUND_IMAGE, 'PNG', 0, 0, 210, 297);
  } catch (error) {
    console.error("Error adding background image:", error);
    
    // If background image fails, use a solid color background
    pdf.setFillColor(30, 30, 30);
    pdf.rect(0, 0, 210, 297, "F");
  }
  
  // Add semi-transparent overlay for better text readability
  pdf.setFillColor(0, 0, 0);
  pdf.setGlobalAlpha(0.6);
  pdf.rect(0, 0, 210, 297, "F");
  pdf.setGlobalAlpha(1);
  
  // Add date
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  const date = new Date().toLocaleDateString("pt-BR");
  pdf.text(`${date}`, 20, 30);
  
  // Add technician name
  pdf.setTextColor(255, 240, 0);
  pdf.text(`${service.technician.name}`, 20, 40);
  
  // Add title
  pdf.setFontSize(40);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RELATÓRIO", 20, 120);
  
  // Add different second line based on service phase
  const phaseText = service.reportData?.servicePhase === "inspection" ? "DE VISTORIA" : "DE INSTALAÇÃO";
  pdf.text(phaseText, 20, 145);
  
  // Add client and service number
  pdf.setFontSize(14);
  pdf.setTextColor(255, 240, 0);
  pdf.text("DESTINO", 20, 260);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Cliente ${service.reportData?.client || ""}`, 20, 270);
  
  pdf.setTextColor(255, 240, 0);
  pdf.text("N° DA NOTA", 150, 260);
  pdf.setTextColor(255, 255, 255);
  pdf.text(service.id, 150, 270);
};

// Generate the technicians page
const generateTechniciansPage = (pdf: any, service: Service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("TÉCNICOS", 20, 40);
  pdf.setTextColor(255, 240, 0);
  pdf.text("RESPONSÁVEIS", 20, 55);
  
  // Try to add technician photo if available
  try {
    if (service.technician.avatar) {
      pdf.addImage(service.technician.avatar, 'JPEG', 20, 80, 50, 50);
    }
  } catch (error) {
    console.error("Error adding technician photo:", error);
  }
  
  // Add technician info
  pdf.setFontSize(18);
  pdf.setTextColor(255, 240, 0);
  pdf.text(`${service.technician.name}`, 80, 100);
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Eletricista instalador", 80, 110);
};

// Generate the service description page
const generateDescriptionPage = (pdf: any, service: Service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DESCRIÇÃO DO", 20, 40);
  pdf.setTextColor(255, 240, 0);
  
  // Different title based on service phase
  const phaseText = service.reportData?.servicePhase === "inspection" ? "LEVANTAMENTO" : "SERVIÇO";
  pdf.text(phaseText, 20, 55);
  
  // Add service description
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  
  const description = service.reportData?.technicalComments || 
    `Referente à ${service.reportData?.servicePhase === "inspection" ? "vistoria" : "instalação"} de carregador veicular do cliente ${service.reportData?.client || service.title}.`;
  
  // Split long text to fit page
  const lines = pdf.splitTextToSize(description, 170);
  pdf.text(lines, 20, 80);
  
  // Add photos if they exist
  if (service.photos && service.photos.length > 0) {
    try {
      let yPos = 120;
      for (let i = 0; i < Math.min(2, service.photos.length); i++) {
        pdf.addImage(service.photos[i], 'JPEG', 20, yPos, 170, 50);
        yPos += 60;
      }
    } catch (error) {
      console.error("Error adding photos to PDF:", error);
      pdf.text("(Fotos disponíveis no relatório original)", 20, 150);
    }
  } else {
    pdf.setFontSize(10);
    pdf.text("(Sem fotos disponíveis)", 20, 150);
  }
};

// Generate technical details page based on service phase
const generateDetailsPage = (pdf: any, service: Service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DETALHES", 20, 40);
  pdf.setTextColor(255, 240, 0);
  pdf.text("TÉCNICOS", 20, 55);
  
  // Add service details in a table-like format
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  
  let yPos = 80;
  const xPos1 = 20;
  const xPos2 = 100;
  const lineHeight = 10;
  
  // Add client details for both types
  const commonDetails = [
    { label: "Cliente:", value: service.reportData?.client || "" },
    { label: "Endereço:", value: service.reportData?.address || "" },
    { label: "Cidade:", value: service.reportData?.city || "" },
  ];
  
  // Add phase-specific details
  if (service.reportData?.servicePhase === "inspection") {
    // Inspection details
    const inspectionDetails = [
      ...commonDetails,
      { label: "Data da Vistoria:", value: service.reportData?.inspectionDate || "" },
      { label: "Tensão do local:", value: service.reportData?.voltage || "" },
      { label: "Tipo de alimentação:", value: service.reportData?.supplyType || "" },
      { label: "Distância até ponto:", value: service.reportData?.installationDistance || "" },
      { label: "Obstáculos no percurso:", value: service.reportData?.installationObstacles || "" },
      { label: "Possui quadro existente:", value: service.reportData?.existingPanel ? "Sim" : "Não" },
    ];
    
    inspectionDetails.forEach(item => {
      pdf.setTextColor(255, 240, 0);
      pdf.text(item.label, xPos1, yPos);
      pdf.setTextColor(255, 255, 255);
      pdf.text(item.value, xPos2, yPos);
      yPos += lineHeight;
    });
    
    // Add panel details if existing panel is true
    if (service.reportData?.existingPanel) {
      yPos += lineHeight/2;
      pdf.setTextColor(255, 240, 0);
      pdf.text("Detalhes do quadro:", xPos1, yPos);
      yPos += lineHeight;
      
      pdf.setTextColor(255, 255, 255);
      pdf.text(`- Tipo: ${service.reportData?.panelType || ""}`, xPos1 + 10, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Amperagem: ${service.reportData?.panelAmps || ""}`, xPos1 + 10, yPos);
      yPos += lineHeight;
    }
    
    // Add grounding system
    yPos += lineHeight/2;
    pdf.setTextColor(255, 240, 0);
    pdf.text("Sistema de aterramento:", xPos1, yPos);
    yPos += lineHeight;
    
    pdf.setTextColor(255, 255, 255);
    pdf.text(service.reportData?.groundingSystem || "Não especificado", xPos1 + 10, yPos);
  } else {
    // Installation details
    const installationDetails = [
      ...commonDetails,
      { label: "Data da Instalação:", value: service.reportData?.installationDate || "" },
      { label: "Marca e Modelo:", value: service.reportData?.modelNumber || "" },
      { label: "Número de Série:", value: service.reportData?.serialNumberNew || "" },
      { label: "Potência do carregador:", value: service.reportData?.chargerLoad || "" },
      { label: "Bitola do cabo:", value: service.reportData?.cableGauge || "" },
      { label: "Disjuntor do carregador:", value: service.reportData?.chargerCircuitBreaker || "" },
      { label: "Status do carregador:", value: service.reportData?.chargerStatus || "" }
    ];
    
    installationDetails.forEach(item => {
      pdf.setTextColor(255, 240, 0);
      pdf.text(item.label, xPos1, yPos);
      pdf.setTextColor(255, 255, 255);
      pdf.text(item.value, xPos2, yPos);
      yPos += lineHeight;
    });
    
    // Add compliance information
    yPos += 10;
    pdf.setTextColor(255, 240, 0);
    pdf.text("Conformidade:", xPos1, yPos);
    pdf.setTextColor(255, 255, 255);
    
    yPos += lineHeight;
    pdf.text(`- Instalação atende NBR17019: ${service.reportData?.compliesWithNBR17019 ? "Sim" : "Não"}`, xPos1, yPos);
    
    yPos += lineHeight;
    pdf.text(`- Realizada com homologado: ${service.reportData?.homologatedInstallation ? "Sim" : "Não"}`, xPos1, yPos);
    
    yPos += lineHeight;
    pdf.text(`- Garantia procede: ${service.reportData?.validWarranty ? "Sim" : "Não"}`, xPos1, yPos);
    
    yPos += lineHeight;
    pdf.text(`- Foi necessário adequação: ${service.reportData?.requiredAdjustment ? "Sim" : "Não"}`, xPos1, yPos);
    
    if (service.reportData?.requiredAdjustment && service.reportData?.adjustmentDescription) {
      yPos += lineHeight;
      pdf.text("Descrição da adequação:", xPos1, yPos);
      
      yPos += lineHeight;
      const adjustmentLines = pdf.splitTextToSize(service.reportData.adjustmentDescription, 170);
      pdf.text(adjustmentLines, xPos1, yPos);
    }
  }
};

export function generatePDF(service: Service): boolean {
  console.log("Generating PDF for service:", service.id);
  
  // Show toast indicating PDF is being generated
  toast.info("Gerando relatório...", {
    description: "Por favor aguarde enquanto o relatório é gerado."
  });
  
  try {
    // Create PDF document
    const pdf = createPdfDocument();
    
    // Generate cover page
    generateCoverPage(pdf, service);
    
    // Add technicians page
    pdf.addPage();
    generateTechniciansPage(pdf, service);
    
    // Add description page
    pdf.addPage();
    generateDescriptionPage(pdf, service);
    
    // Add technical details page
    pdf.addPage();
    generateDetailsPage(pdf, service);
    
    // Simulate a delay to show loading (in a real app this wouldn't be needed)
    setTimeout(() => {
      // In a real app, we would use pdf.save() to trigger download
      console.log("PDF generated successfully for service:", service.id);
      
      // Offer PDF for download
      pdf.save(`relatório-${service.reportData?.servicePhase === "inspection" ? "vistoria" : "instalação"}-${service.id}.pdf`);
      
      // Show success toast after PDF is ready
      toast.success("Relatório gerado com sucesso", {
        description: `O PDF para ${service.reportData?.servicePhase === "inspection" ? "vistoria" : "instalação"} ${service.id} foi gerado e baixado automaticamente.`
      });
    }, 500);
    
    return true;
  } catch (error) {
    console.error("Error generating PDF:", error);
    
    toast.error("Erro ao gerar o relatório", {
      description: "Ocorreu um erro ao gerar o PDF. Por favor, tente novamente."
    });
    
    return false;
  }
}

export function downloadPDF(service: Service): void {
  generatePDF(service);
}
