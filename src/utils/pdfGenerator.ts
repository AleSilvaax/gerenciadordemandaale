
import { Service } from "@/types/serviceTypes";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Background image for cover page (modern car charging station)
const BACKGROUND_IMAGE = "/lovable-uploads/e58ff3e8-39f6-4a65-bb06-64492bc943b0.png"; // Updated reference to the car charger image
// Company logo
const COMPANY_LOGO = "/lovable-uploads/19fb615f-4ff2-43e9-a389-d33021334af2.png"; // REVO logo
// Signature image (empty signature line)
const SIGNATURE_LINE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAABCAYAAABkOJMpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7cMBDQAAAMKg909tDjegAAAAAAAAAAAAPgYQCAABy4qsDQAAAABJRU5ErkJggg==";

// Function to create a new jsPDF instance with consistent styling
const createPdfDocument = () => {
  const pdf = new jsPDF();
  
  // Set default font
  pdf.setFont("helvetica");
  
  return pdf;
};

// Function to handle image loading safely
const safelyAddImage = (pdf, imagePath, format, x, y, width, height) => {
  try {
    // Try to add the image - strip any domain prefixes if present
    const cleanPath = imagePath.replace(/^https?:\/\/[^\/]+/i, '');
    pdf.addImage(cleanPath, format, x, y, width, height);
    return true;
  } catch (error) {
    console.error(`Error adding image ${imagePath}:`, error);
    return false;
  }
};

// Calculate image dimensions while maintaining aspect ratio
const calculateImageDimensions = (origWidth, origHeight, maxWidth, maxHeight) => {
  if (origWidth <= maxWidth && origHeight <= maxHeight) {
    return { width: origWidth, height: origHeight };
  }

  const ratio = Math.min(maxWidth / origWidth, maxHeight / origHeight);
  return { 
    width: origWidth * ratio, 
    height: origHeight * ratio 
  };
};

// Create a semi-transparent overlay for better text readability
const addSemiTransparentOverlay = (pdf, x, y, width, height, color, opacity) => {
  // For different opacity levels, we'll use different RGB values to simulate transparency
  // This is a workaround since setGlobalAlpha is not available
  
  // Convert opacity (0-1) to color intensity (0-255)
  const colorValue = Math.floor(255 * (1 - opacity));
  
  if (color === "black") {
    pdf.setFillColor(colorValue, colorValue, colorValue);
  } else if (color === "white") {
    pdf.setFillColor(255, 255, 255);
  } else if (color === "yellow") {
    pdf.setFillColor(255, 240, 0);
  }
  
  pdf.rect(x, y, width, height, "F");
};

// Generate the cover page with a modern design
const generateCoverPage = (pdf, service) => {
  // Add background image (full page)
  if (!safelyAddImage(pdf, BACKGROUND_IMAGE, 'PNG', 0, 0, 210, 297)) {
    // If background image fails, use a solid color background
    pdf.setFillColor(30, 30, 30);
    pdf.rect(0, 0, 210, 297, "F");
  }
  
  // Add semi-transparent overlay for better text readability
  addSemiTransparentOverlay(pdf, 0, 0, 210, 297, "black", 0.5);
  
  // Add company logo with proper proportions
  safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
  
  // Add date with modern styling
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  const date = new Date().toLocaleDateString("pt-BR");
  pdf.text(`${date}`, 20, 60);
  
  // Add technician name with accent color
  pdf.setTextColor(255, 240, 0);
  pdf.setFontSize(14);
  pdf.text(`${service.technician.name}`, 20, 75);
  
  // Add title with larger, more impactful font
  pdf.setFontSize(42);
  pdf.setTextColor(255, 255, 255);
  pdf.text("RELATÓRIO", 20, 130);
  
  // Different second line based on service phase with consistent styling
  const phaseText = service.reportData?.servicePhase === "inspection" ? "DE VISTORIA" : "DE INSTALAÇÃO";
  pdf.text(phaseText, 20, 155);
  
  // Add client and service info with better spacing and organization
  pdf.setFontSize(14);
  pdf.setTextColor(255, 240, 0);
  pdf.text("DESTINO", 20, 230);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`Cliente: ${service.reportData?.client || ""}`, 20, 245);
  
  // Using "DEMANDA" instead of "N° DA NOTA" as requested
  pdf.setTextColor(255, 240, 0);
  pdf.text("DEMANDA", 20, 265);
  pdf.setTextColor(255, 255, 255);
  pdf.text(service.id, 20, 280);
};

// Generate the technicians page with improved image quality
const generateTechniciansPage = (pdf, service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add company logo as header with proper proportions
  safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("TÉCNICOS", 20, 60);
  pdf.setTextColor(255, 240, 0);
  pdf.text("RESPONSÁVEIS", 20, 75);
  
  // Add technician photo with proper aspect ratio and smaller size (reduced size even more)
  if (service.technician && service.technician.avatar) {
    // Using smaller dimensions for better fitting and quality
    safelyAddImage(pdf, service.technician.avatar, 'PNG', 20, 100, 25, 25);
  }
  
  // Add technician info with better spacing
  pdf.setFontSize(18);
  pdf.setTextColor(255, 240, 0);
  pdf.text(`${service.technician.name}`, 60, 115);
  
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text("Eletricista instalador", 60, 130);
};

// Generate the service description page with improved layout
const generateDescriptionPage = (pdf, service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add company logo as header with proper proportions
  safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DESCRIÇÃO DO", 20, 60);
  pdf.setTextColor(255, 240, 0);
  
  // Different title based on service phase
  const phaseText = service.reportData?.servicePhase === "inspection" ? "LEVANTAMENTO" : "SERVIÇO";
  pdf.text(phaseText, 20, 75);
  
  // Add service description
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  
  const description = service.reportData?.technicalComments || 
    `Referente à ${service.reportData?.servicePhase === "inspection" ? "vistoria" : "instalação"} de carregador veicular do cliente ${service.reportData?.client || service.title}.`;
  
  // Split long text to fit page
  const lines = pdf.splitTextToSize(description, 170);
  pdf.text(lines, 20, 95);
  
  // Add photos with titles if they exist
  if (service.photos && service.photos.length > 0) {
    pdf.setFontSize(16);
    pdf.setTextColor(255, 240, 0);
    pdf.text("REGISTROS FOTOGRÁFICOS", 20, 140);
    
    let yPos = 155;
    let photosAdded = 0;
    const photoWidth = 75;
    const photoHeight = 56; // 4:3 aspect ratio
    const padding = 10;
    const xPos1 = 20;
    const xPos2 = 105;
    const pageMargin = 20; // Ensure photos respect page margins
    
    for (let i = 0; i < Math.min(4, service.photos.length); i++) {
      // Calculate positioning for 2 photos per row
      const xPos = i % 2 === 0 ? xPos1 : xPos2;
      if (i % 2 === 0 && i > 0) yPos += photoHeight + 30; // New row
      
      // Make sure photos don't exceed page bounds - reduced page bounds to respect margins
      if (yPos + photoHeight > 260) {
        pdf.addPage();
        pdf.setFillColor(30, 30, 30);
        pdf.rect(0, 0, 210, 297, "F");
        safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
        yPos = 50;
      }
      
      if (safelyAddImage(pdf, service.photos[i], 'JPEG', xPos, yPos, photoWidth, photoHeight)) {
        // Add photo title/caption if available
        pdf.setFontSize(9);
        pdf.setTextColor(255, 255, 255);
        const photoTitle = service.photoTitles && service.photoTitles[i] ? service.photoTitles[i] : `Foto ${i + 1}`;
        
        // Add a small background for the caption to ensure it's readable
        const captionWidth = photoWidth;
        const captionHeight = 10;
        const captionY = yPos + photoHeight + 1;
        
        pdf.setFillColor(50, 50, 50);
        pdf.rect(xPos, captionY, captionWidth, captionHeight, 'F');
        
        pdf.text(photoTitle, xPos + 2, captionY + 7);
        photosAdded++;
      }
    }
    
    // If there are more than 4 photos, add another page
    if (service.photos.length > 4) {
      pdf.addPage();
      pdf.setFillColor(30, 30, 30);
      pdf.rect(0, 0, 210, 297, "F");
      
      // Add company logo as header with proper proportions
      safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
      
      pdf.setFontSize(16);
      pdf.setTextColor(255, 240, 0);
      pdf.text("REGISTROS FOTOGRÁFICOS (CONTINUAÇÃO)", 20, 50);
      
      yPos = 65;
      
      for (let i = 4; i < Math.min(12, service.photos.length); i++) {
        // Calculate positioning for 2 photos per row
        const xPos = (i - 4) % 2 === 0 ? xPos1 : xPos2;
        if ((i - 4) % 2 === 0 && (i - 4) > 0) yPos += photoHeight + 30; // New row
        
        // Make sure photos don't exceed page bounds - respect margins
        if (yPos + photoHeight > 260) {
          pdf.addPage();
          pdf.setFillColor(30, 30, 30);
          pdf.rect(0, 0, 210, 297, "F");
          safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
          yPos = 50;
        }
        
        if (safelyAddImage(pdf, service.photos[i], 'JPEG', xPos, yPos, photoWidth, photoHeight)) {
          // Add photo title/caption if available
          pdf.setFontSize(9);
          pdf.setTextColor(255, 255, 255);
          const photoTitle = service.photoTitles && service.photoTitles[i] ? service.photoTitles[i] : `Foto ${i + 1}`;
          
          // Add a small background for the caption
          const captionWidth = photoWidth;
          const captionHeight = 10;
          const captionY = yPos + photoHeight + 1;
          
          pdf.setFillColor(50, 50, 50);
          pdf.rect(xPos, captionY, captionWidth, captionHeight, 'F');
          
          pdf.text(photoTitle, xPos + 2, captionY + 7);
        }
      }
    }
    
    if (photosAdded === 0) {
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text("(Sem fotos disponíveis ou erro ao carregar)", 20, 165);
    }
  } else {
    pdf.setFontSize(10);
    pdf.setTextColor(255, 255, 255);
    pdf.text("(Sem fotos disponíveis)", 20, 165);
  }
};

// Generate technical details page based on service phase
const generateDetailsPage = (pdf, service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add company logo as header with proper proportions
  safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("DETALHES", 20, 60);
  pdf.setTextColor(255, 240, 0);
  pdf.text("TÉCNICOS", 20, 75);
  
  // Add service details in a table-like format
  pdf.setFontSize(12);
  pdf.setTextColor(255, 255, 255);
  
  let yPos = 95;
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
    // Inspection details with better organization
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
    
    // Add Wallbox details
    yPos += lineHeight;
    pdf.setTextColor(255, 240, 0);
    pdf.text("WALLBOX:", xPos1, yPos);
    yPos += lineHeight;
    
    pdf.setTextColor(255, 255, 255);
    pdf.text(`- Marca: ${service.reportData?.wallboxBrand || ""}`, xPos1, yPos);
    yPos += lineHeight;
    
    pdf.text(`- Potência: ${service.reportData?.wallboxPower || ""}`, xPos1, yPos);
    yPos += lineHeight;
    
    pdf.text(`- Tensão: ${service.reportData?.voltage || ""}`, xPos1, yPos);
    yPos += lineHeight;
    
    pdf.text(`- Alimentação: ${service.reportData?.powerSupplyType || ""}`, xPos1, yPos);
    yPos += lineHeight;
    
    // Add electrical panel details if applicable with better sections
    if (service.reportData?.existingPanel) {
      yPos += lineHeight/2;
      pdf.setTextColor(255, 240, 0);
      pdf.text("QUADRO ELÉTRICO:", xPos1, yPos);
      yPos += lineHeight;
      
      pdf.setTextColor(255, 255, 255);
      pdf.text(`- Tipo: ${service.reportData?.panelType || ""}`, xPos1, yPos);
      yPos += lineHeight;
      
      // Changed from "amperagem" to "corrente" as requested
      pdf.text(`- Corrente: ${service.reportData?.panelAmps || ""}`, xPos1, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Tensão entre fases: ${service.reportData?.voltageBetweenPhases || "N/A"}`, xPos1, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Tensão fase/neutro: ${service.reportData?.voltageBetweenPhaseAndNeutral || ""}`, xPos1, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Trifásico: ${service.reportData?.hasThreePhase ? "Sim" : "Não"}`, xPos1, yPos);
      yPos += lineHeight;
    }
    
    // Add infrastructure assessment with improved structure
    yPos += lineHeight/2;
    pdf.setTextColor(255, 240, 0);
    pdf.text("INFRAESTRUTURA NECESSÁRIA:", xPos1, yPos);
    yPos += lineHeight;
    
    pdf.setTextColor(255, 255, 255);
    pdf.text(`- Necessita infraestrutura: ${service.reportData?.needsInfrastructure ? "Sim" : "Não"}`, xPos1, yPos);
    yPos += lineHeight;
    
    if (service.reportData?.needsInfrastructure) {
      pdf.text(`- Necessita andaime: ${service.reportData?.needsScaffolding ? "Sim" : "Não"}`, xPos1, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Necessita furo técnico: ${service.reportData?.needsTechnicalHole ? "Sim" : "Não"}`, xPos1, yPos);
      yPos += lineHeight;
      
      pdf.text(`- Necessita alvenaria: ${service.reportData?.needsMasonry ? "Sim" : "Não"}`, xPos1, yPos);
      yPos += lineHeight;
    }
    
    // Add grounding system info
    pdf.text(`- Sistema de aterramento: ${service.reportData?.groundingSystem || "Não especificado"}`, xPos1, yPos);
    yPos += lineHeight;
    
    // Add ART info if available
    if (service.reportData?.artNumber) {
      pdf.text(`- ART: ${service.reportData?.artNumber}`, xPos1, yPos);
      yPos += lineHeight;
    }
  } else {
    // Installation details with better organization
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
    
    // Add compliance information with improved layout
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
  
  // Add custom fields if any
  if (service.reportData?.customFields && service.reportData.customFields.length > 0) {
    yPos += lineHeight * 2;
    pdf.setTextColor(255, 240, 0);
    pdf.text("CAMPOS PERSONALIZADOS:", xPos1, yPos);
    yPos += lineHeight;
    
    pdf.setTextColor(255, 255, 255);
    service.reportData.customFields.forEach(field => {
      let displayValue = "";
      
      if (field.type === 'boolean') {
        displayValue = field.value ? "Sim" : "Não";
      } else if (field.type === 'select') {
        displayValue = field.value as string;
      } else {
        displayValue = String(field.value || "");
      }
      
      pdf.setTextColor(255, 240, 0);
      pdf.text(`${field.label}:`, xPos1, yPos);
      pdf.setTextColor(255, 255, 255);
      pdf.text(displayValue, xPos2, yPos);
      yPos += lineHeight;
      
      // Check if we need a new page
      if (yPos > 260) {
        pdf.addPage();
        pdf.setFillColor(30, 30, 30);
        pdf.rect(0, 0, 210, 297, "F");
        safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
        yPos = 40;
      }
    });
  }
};

// Generate signature page with improved layout for digital signatures
const generateSignaturePage = (pdf, service) => {
  // Background color
  pdf.setFillColor(30, 30, 30);
  pdf.rect(0, 0, 210, 297, "F");
  
  // Add company logo as header with proper proportions
  safelyAddImage(pdf, COMPANY_LOGO, 'PNG', 20, 20, 30, 12);
  
  // Add title
  pdf.setFontSize(30);
  pdf.setTextColor(255, 255, 255);
  pdf.text("ASSINATURAS", 20, 60);
  
  // Client signature section
  pdf.setFontSize(16);
  pdf.setTextColor(255, 240, 0);
  pdf.text("ASSINATURA DO CLIENTE", 20, 95);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(`Nome: ${service.reportData?.clientName || ""}`, 20, 110);
  
  // Add client signature if it exists or signature line
  if (service.reportData?.clientSignature) {
    // Add the signature without white background
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.setTextColor(255, 255, 255);
    safelyAddImage(pdf, service.reportData.clientSignature, 'PNG', 20, 125, 120, 40);
  } else {
    // Add signature line for client
    safelyAddImage(pdf, SIGNATURE_LINE, 'PNG', 20, 135, 170, 1);
    pdf.setFontSize(10);
    pdf.text("Assinatura do cliente ou representante", 20, 145);
  }
  
  // Technician signature section
  pdf.setFontSize(16);
  pdf.setTextColor(255, 240, 0);
  pdf.text("ASSINATURA DO TÉCNICO", 20, 175);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(12);
  pdf.text(`Nome: ${service.technician.name}`, 20, 190);
  
  // Add technician signature if it exists or signature line
  if (service.technician.signature) {
    // Add the signature without white background
    pdf.setDrawColor(255, 255, 255);
    pdf.setLineWidth(0.5);
    pdf.setTextColor(255, 255, 255);
    safelyAddImage(pdf, service.technician.signature, 'PNG', 20, 205, 120, 40);
  } else {
    // Add signature line for technician
    safelyAddImage(pdf, SIGNATURE_LINE, 'PNG', 20, 215, 170, 1);
    pdf.setFontSize(10);
    pdf.text("Assinatura do técnico responsável", 20, 225);
  }
  
  // Add date and service number
  pdf.setFontSize(12);
  pdf.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 20, 250);
  pdf.text(`Número da Demanda: ${service.id}`, 20, 265);
  
  // Disclaimer
  pdf.setFontSize(8);
  pdf.setTextColor(200, 200, 200);
  const disclaimer = "Este documento confirma que o serviço foi executado conforme as especificações técnicas e que ambas as partes estão de acordo com o trabalho realizado.";
  const disclaimerLines = pdf.splitTextToSize(disclaimer, 170);
  pdf.text(disclaimerLines, 20, 280);
};

export function generatePDF(service: Service, reportType: "inspection" | "installation" = null): boolean {
  console.log("Generating PDF for service:", service.id);
  
  const actualReportType = reportType || service.reportData?.servicePhase || "inspection";
  
  // Show toast indicating PDF is being generated
  toast.info("Gerando relatório...", {
    description: "Por favor aguarde enquanto o relatório é gerado."
  });
  
  try {
    // Create PDF document
    const pdf = createPdfDocument();
    
    // Generate cover page
    generateCoverPage(pdf, {...service, reportData: {...service.reportData, servicePhase: actualReportType}});
    
    // Add technicians page
    pdf.addPage();
    generateTechniciansPage(pdf, service);
    
    // Add description page
    pdf.addPage();
    generateDescriptionPage(pdf, service);
    
    // Add technical details page
    pdf.addPage();
    generateDetailsPage(pdf, {...service, reportData: {...service.reportData, servicePhase: actualReportType}});
    
    // Add signature page
    pdf.addPage();
    generateSignaturePage(pdf, service);
    
    // Save the PDF with a proper name based on service phase
    pdf.save(`relatório-${actualReportType === "inspection" ? "vistoria" : "instalação"}-${service.id}.pdf`);
    
    // Show success toast after PDF is ready
    toast.success("Relatório gerado com sucesso", {
      description: `O PDF para ${actualReportType === "inspection" ? "vistoria" : "instalação"} ${service.id} foi gerado e baixado automaticamente.`
    });
    
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

export function downloadInspectionPDF(service: Service): void {
  generatePDF(service, "inspection");
}

export function downloadInstallationPDF(service: Service): void {
  generatePDF(service, "installation");
}
