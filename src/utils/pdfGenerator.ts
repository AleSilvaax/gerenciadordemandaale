import { Service } from "@/types/serviceTypes";
import { toast } from "@/hooks/use-toast";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const LOGO_IMAGE = "/lovable-uploads/c5f3330e-0914-4da8-9bf1-01a2e1afb4dd.png";
const SIGNATURE_LINE = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAABCAYAAABkOJMpAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAgSURBVHgB7cMBDQAAAMKg909tDjegAAAAAAAAAAAAPgYQCAABy4qsDQAAAABJRU5ErkJggg==";

const PAGE_WIDTH = 210;
const PAGE_HEIGHT = 297;
const MARGIN_X = 18;

function valueOrNA(val: any) {
  return val ? val : "Não disponível";
}

function addHeader(pdf, title) {
  pdf.setFillColor(255,255,255);
  pdf.rect(0,0,PAGE_WIDTH,28,'F');
  if (LOGO_IMAGE) {
    pdf.addImage(LOGO_IMAGE, 'PNG', 10, 7, 20, 14);
  }
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(14);
  pdf.setTextColor(40,40,40);
  pdf.text(title, 36, 18);
}

function addFooter(pdf, pageNum, totalPages) {
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(130,130,130);
  const today = new Date().toLocaleDateString("pt-BR");
  pdf.text(`Emitido em: ${today}`, MARGIN_X, PAGE_HEIGHT-8);
  pdf.text(`Página ${pageNum} de ${totalPages}`, PAGE_WIDTH - MARGIN_X - 35, PAGE_HEIGHT-8);
}

function generateCover(pdf, service, totalPages) {
  pdf.setFillColor(240, 240, 245);
  pdf.rect(0,0,PAGE_WIDTH,PAGE_HEIGHT,'F');
  addHeader(pdf, 
    service.reportData?.servicePhase === "inspection" 
      ? "Relatório Técnico de Vistoria" 
      : "Relatório Final de Instalação"
  );
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(28);
  pdf.setTextColor(30,30,40);
  pdf.text("RELATÓRIO", PAGE_WIDTH/2, 72, { align:"center"});
  pdf.setFontSize(15);
  pdf.setTextColor(120,120,120);
  if(service.reportData?.servicePhase === "inspection") {
    pdf.text("Vistoria de Ponto de Recarga", PAGE_WIDTH/2, 85, { align:"center"});
  } else {
    pdf.text("Instalação de Ponto de Recarga", PAGE_WIDTH/2, 85, { align:"center"});
  }
  // Info box
  let y=110;
  pdf.setFillColor(255,255,255);
  pdf.roundedRect(MARGIN_X, y, PAGE_WIDTH-MARGIN_X*2, 53, 5,5,"F");
  pdf.setTextColor(30,30,40);
  pdf.setFontSize(12);
  pdf.text("Cliente:", MARGIN_X+8, y+13); 
  pdf.text(valueOrNA(service.reportData?.client || service.client), MARGIN_X+35, y+13);
  pdf.text("Endereço:", MARGIN_X+8, y+28);
  pdf.text(valueOrNA(service.reportData?.address || service.address), MARGIN_X+35, y+28);
  pdf.text("Demanda Nº:", MARGIN_X+8, y+43);
  pdf.text(valueOrNA(service.id), MARGIN_X+35, y+43);
  pdf.setFontSize(11);
  pdf.setTextColor(90,90,90);
  pdf.text("Data de Emissão:", PAGE_WIDTH-MARGIN_X-48, y+43);
  pdf.text((new Date().toLocaleDateString("pt-BR")), PAGE_WIDTH-MARGIN_X-12, y+43, {align:"right"});
  addFooter(pdf, 1, totalPages);
}

function generateSection(pdf, title, y) {
  pdf.setFillColor(249,249,253);
  pdf.rect(MARGIN_X, y, PAGE_WIDTH-MARGIN_X*2, 11, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(13);
  pdf.setTextColor(32,32,110);
  pdf.text(title, MARGIN_X+3, y+8);
}

function generateClientData(pdf, service, pageNum, totalPages) {
  pdf.addPage();
  addHeader(pdf, "1. Dados do Cliente");
  let y=40;
  generateSection(pdf, "Dados do Cliente", y);
  y+=17;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(11); pdf.setTextColor(40,40,40);
  pdf.text("Nome:", MARGIN_X+4, y+8);
  pdf.text(valueOrNA(service.reportData?.client || service.client), MARGIN_X+34, y+8);
  pdf.text("Endereço:", MARGIN_X+4, y+22);
  pdf.text(valueOrNA(service.reportData?.address || service.address), MARGIN_X+34, y+22);
  pdf.text("Cidade:", MARGIN_X+4, y+36);
  pdf.text(valueOrNA(service.reportData?.city || service.city), MARGIN_X+34, y+36);
  addFooter(pdf, pageNum, totalPages);
}

function generateTechnicalData(pdf, service, pageNum, totalPages) {
  pdf.addPage();
  addHeader(pdf, "2. Detalhes Técnicos");
  let y=40;
  generateSection(pdf, "Detalhes Técnicos", y);

  y+=13;
  pdf.setFont("helvetica","normal"); pdf.setFontSize(11);

  let rows=[];
  if(service.reportData?.servicePhase === "inspection") {
    rows = [
      ["Data da Vistoria", valueOrNA(service.reportData?.inspectionDate)],
      ["Tensão do Local", valueOrNA(service.reportData?.voltage)],
      ["Tipo de Alimentação", valueOrNA(service.reportData?.supplyType)],
      ["Distância até o ponto (m)", valueOrNA(service.reportData?.installationDistance)],
      ["Marca Wallbox", valueOrNA(service.reportData?.wallboxBrand)],
      ["Potência Wallbox", valueOrNA(service.reportData?.wallboxPower)],
      ["Aterramento", valueOrNA(service.reportData?.groundingSystem)],
      ["ART", valueOrNA(service.reportData?.artNumber)],
      ["Obstáculos", valueOrNA(service.reportData?.installationObstacles)],
    ];
  } else {
    rows = [
      ["Data da Instalação", valueOrNA(service.reportData?.installationDate)],
      ["Marca e Modelo", valueOrNA(service.reportData?.modelNumber)],
      ["Número de Série", valueOrNA(service.reportData?.serialNumberNew)],
      ["Potência Carregador", valueOrNA(service.reportData?.chargerLoad)],
      ["Bitola do Cabo", valueOrNA(service.reportData?.cableGauge)],
      ["Disjuntor Carregador", valueOrNA(service.reportData?.chargerCircuitBreaker)],
      ["Status Carregador", valueOrNA(service.reportData?.chargerStatus)],
      ["Conformidade NBR17019", typeof service.reportData?.compliesWithNBR17019 === 'boolean' ? (service.reportData.compliesWithNBR17019 ? "Sim" : "Não") : "Não disponível"],
      ["Homologação", typeof service.reportData?.homologatedInstallation === 'boolean' ? (service.reportData.homologatedInstallation ? "Sim" : "Não") : "Não disponível"],
      ["Garantia", typeof service.reportData?.validWarranty === 'boolean' ? (service.reportData.validWarranty ? "Sim" : "Não") : "Não disponível"],
      ["Adequação Necessária", typeof service.reportData?.requiredAdjustment === 'boolean' ? (service.reportData.requiredAdjustment ? "Sim" : "Não") : "Não disponível"],
    ];
  }
  autoTable(pdf, {
    startY: y+15,
    head: [["Campo","Valor"]],
    body: rows,
    headStyles: {fillColor: [32,32,110], textColor:[255,255,255], fontStyle:"bold"},
    bodyStyles:{fillColor:[255,255,255]},
    alternateRowStyles:{fillColor:[249,249,253]},
    styles:{
      minCellHeight:8, cellPadding:2,
      fontSize:10,
    },
    margin:{left:MARGIN_X, right:MARGIN_X},
    didDrawPage: (data)=>{ addFooter(pdf, pageNum, totalPages);}
  });
}

function generatePhotosGrid(pdf, service, pageNum, totalPages) {
  pdf.addPage();
  addHeader(pdf, "3. Registros Fotográficos");
  let y=40;
  generateSection(pdf, "Registros Fotográficos", y);
  pdf.setFontSize(10);
  y+=15;
  // Organiza até 4 fotos por página
  let photos = service.photos || [];
  let titles = service.photoTitles || [];
  let colW = 80, rowH=50, gapX=14, gapY=18;
  let maxPerPage = 4; // 2x2 grid, 4 fotos por página
  for(let i=0; i<photos.length; i++) {
    let row = Math.floor(i%maxPerPage/2);
    let col = i%2;
    let x = MARGIN_X + col*(colW+gapX);
    let yImg = y + row*(rowH+gapY);

    try{
      // eslint-disable-next-line
      pdf.addImage(photos[i],"JPEG", x, yImg, colW, rowH);
    }catch{}
    // Foto legenda
    pdf.setFontSize(9); pdf.setTextColor(80,80,80);
    let caption = titles[i] || ("Foto "+(i+1));
    pdf.text(caption, x, yImg+rowH+8);
    if((i+1)%maxPerPage===0 && i!==photos.length-1){
      addFooter(pdf, pageNum, totalPages);
      pdf.addPage();
      addHeader(pdf,"3. Registros Fotográficos");
      y=40+15; //reset
    }
  }
  addFooter(pdf, pageNum, totalPages);
}

function generateSignatures(pdf, service, pageNum, totalPages) {
  pdf.addPage();
  addHeader(pdf, "4. Assinaturas");
  let y=58, x = MARGIN_X+4;

  // CLIENTE
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(11); pdf.setTextColor(32,32,110);
  pdf.text("Assinatura Cliente", x, y);
  y+=7;
  if(service.reportData?.clientSignature){
    pdf.addImage(service.reportData.clientSignature,"PNG",x,y,110,28);
  } else {
    pdf.addImage(SIGNATURE_LINE, "PNG", x, y+12, 100, 1.4);
  }
  pdf.setTextColor(40,40,40); pdf.setFont("helvetica","normal");
  pdf.setFontSize(10);
  pdf.text("Nome: " + valueOrNA(service.reportData?.clientName||service.reportData?.client), x, y+28);
  pdf.text("Data: " + (new Date().toLocaleDateString("pt-BR")), x, y+37);

  // TÉCNICO
  let y2 = y+55;
  pdf.setFont("helvetica","bold");
  pdf.setFontSize(11); pdf.setTextColor(32,32,110);
  pdf.text("Assinatura Técnico", x, y2);
  pdf.setFontSize(10); pdf.setTextColor(40,40,40);
  pdf.setFont("helvetica","normal");
  if(service.technician?.signature){
    pdf.addImage(service.technician.signature,"PNG",x,y2+7,110,28);
  } else {
    pdf.addImage(SIGNATURE_LINE, "PNG", x, y2+18, 100, 1.4);
  }
  pdf.text("Nome: " + valueOrNA(service.technician.name), x, y2+28);
  pdf.text("Data: " + (new Date().toLocaleDateString("pt-BR")), x, y2+37);

  addFooter(pdf, pageNum, totalPages);
}

// Função principal de geração do PDF
export function generatePDF(service: Service, reportType: "inspection" | "installation" = null): boolean {
  try {
    // Validação básica antes de gerar
    const errors: string[] = [];
    if (!service.id) errors.push("ID do serviço ausente.");
    if (!service.title) errors.push("Título do serviço ausente.");
    if (!service.serviceType) errors.push("Tipo de serviço ausente.");
    if (!service.reportData) errors.push("Dados do relatório ausentes.");

    // Informe no toast qualquer erro encontrado
    if (errors.length > 0) {
      toast.error(
        "Erro ao gerar relatório detalhado", 
        { description: errors.join(" ") }
      );
      return false;
    }

    toast.info("Gerando relatório...", {description: "Por favor aguarde enquanto o relatório é gerado."});

    const totalPages = 4;
    const pdf = new jsPDF({unit:"mm", format:"a4"});

    generateCover(pdf, service, totalPages);
    generateClientData(pdf, service, 2, totalPages);
    generateTechnicalData(pdf, service, 3, totalPages);
    generatePhotosGrid(pdf, service, 4, totalPages);
    generateSignatures(pdf, service, 5, totalPages);

    pdf.save(
      `relatorio-${service.reportData?.servicePhase||"relatorio"}-${service.id}.pdf`
    );

    toast.success("Relatório gerado com sucesso",{description:"PDF pronto para envio ao cliente."});
    return true;
  } catch (error) {
    // Log detalhado no console com objeto de entrada
    console.error("Erro ao gerar relatório detalhado", {service, error});
    toast.error("Erro ao gerar relatório detalhado",{
      description: "Erro técnico. Confira os campos e veja o console para detalhes.",
    });
    return false;
  }
}
