import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Service } from "@/types/serviceTypes";
import { supabase } from "@/integrations/supabase/client";

interface LoadedImageInfo {
  dataUrl: string;
  width: number;
  height: number;
  title: string;
}

const formatShortOS = (num?: string | number, fallbackId?: string) => {
  if (num) {
    const parts = String(num).split("-");
    return `OS #${parts[parts.length - 1].replace("#", "")}`;
  }
  if (fallbackId) {
    return `OS #${fallbackId.slice(0, 6).toUpperCase()}`;
  }
  return "OS #0001";
};

const formatDateBR = (dateStr?: string | null, includeTime = true) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return includeTime
    ? d.toLocaleString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : d.toLocaleDateString("pt-BR");
};

const loadImageWithDimensions = (
  url: string,
  title: string
): Promise<LoadedImageInfo | null> => {
  return new Promise((resolve) => {
    if (!url) {
      resolve(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width || 800;
        canvas.height = img.naturalHeight || img.height || 600;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.fillStyle = "#FFFFFF";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        resolve({
          dataUrl,
          width: canvas.width,
          height: canvas.height,
          title,
        });
      } catch {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
};

export const generateProfessionalServiceReport = async (
  service: Service
): Promise<void> => {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  const shortOS = formatShortOS(service.number, service.id);
  const emittedAt = new Date().toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  // 1. Buscar materiais reais e fotos atualizadas do Supabase se necessário
  let materialRows: Array<[string, string, string, string, string]> = [];
  let fullServiceData = { ...service };

  try {
    const { data: srvDetails } = await supabase
      .from("services")
      .select("*, technicians:profiles(id, name, avatar, role)")
      .eq("id", service.id)
      .maybeSingle();

    if (srvDetails) {
      fullServiceData = {
        ...fullServiceData,
        ...srvDetails,
        technicians: srvDetails.technicians ? [srvDetails.technicians] : fullServiceData.technicians,
      };
    }

    const { data: srvMaterials } = await supabase
      .from("service_materials")
      .select("*, material:materials(name, unit, cost_per_unit)")
      .eq("service_id", service.id);

    if (srvMaterials && srvMaterials.length > 0) {
      materialRows = srvMaterials.map((item: any) => {
        const name = item.material?.name || "Material";
        const unit = item.material?.unit || "un";
        const planned = Number(item.planned_quantity || item.quantity || 0);
        const rawUsed = Number(item.used_quantity || 0);
        const effectiveUsed =
          fullServiceData.status === "concluido" && rawUsed === 0 ? planned : rawUsed;
        const unitCost = Number(
          item.cost_per_unit || item.material?.cost_per_unit || 0
        );
        const totalCost = effectiveUsed * unitCost;

        return [
          name,
          unit,
          String(planned),
          String(effectiveUsed),
          `R$ ${totalCost.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          })}`,
        ];
      });
    }
  } catch (err) {
    console.warn("Aviso ao carregar dados complementares para o PDF:", err);
  }

  // Nome do técnico formatado
  const techName =
    fullServiceData.technicians?.[0]?.name ||
    (fullServiceData as any).technician_name ||
    "Não atribuído";

  // 2. Cabeçalho Corporativo Moderno (Slate-900 com Accent Azul)
  doc.setFillColor(15, 23, 42); // Slate-900
  doc.rect(0, 0, pageWidth, 36, "F");
  doc.setFillColor(37, 99, 235); // Blue-600
  doc.rect(0, 36, pageWidth, 1.5, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text("RELATÓRIO TÉCNICO DE ATENDIMENTO", margin, 15);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`${shortOS}  •  ${fullServiceData.title || "Ordem de Serviço"}`, margin, 22);
  doc.text(`Emitido em: ${emittedAt}`, margin, 28);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(255, 255, 255);
  doc.text("ServiceFlow", pageWidth - margin, 15, { align: "right" });

  const statusMap: Record<string, string> = {
    concluido: "CONCLUÍDO",
    em_andamento: "EM ANDAMENTO",
    pendente: "PENDENTE",
    cancelado: "CANCELADO",
  };
  const statusLabel = statusMap[fullServiceData.status] || "PENDENTE";
  doc.setFontSize(8.5);
  doc.setTextColor(147, 197, 253);
  doc.text(`STATUS: ${statusLabel}`, pageWidth - margin, 22, { align: "right" });

  let currentY = 44;
  let sectionIndex = 1;

  const drawSectionHeader = (title: string) => {
    if (currentY > pageHeight - 35) {
      doc.addPage();
      currentY = 20;
    }
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, currentY, contentWidth, 8, "F");
    doc.setFillColor(37, 99, 235);
    doc.rect(margin, currentY, 2, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(
      `${sectionIndex}. ${title.toUpperCase()}`,
      margin + 5,
      currentY + 5.5
    );
    sectionIndex += 1;
    currentY += 11;
  };

  const tableHeadStyles = {
    fillColor: [30, 41, 59] as [number, number, number],
    textColor: [255, 255, 255] as [number, number, number],
    fontSize: 8.5,
    fontStyle: "bold" as const,
  };
  const tableBodyStyles = {
    textColor: [30, 41, 59] as [number, number, number],
    fontSize: 8.5,
  };

  // SECÇÃO 1: Informações Gerais
  drawSectionHeader("Informações Gerais e Cliente");
  autoTable(doc, {
    startY: currentY,
    head: [["Campo", "Informação", "Campo", "Informação"]],
    body: [
      ["Ordem de Serviço", shortOS, "Status Atual", statusLabel],
      [
        "Tipo de Serviço",
        fullServiceData.serviceType || "Vistoria",
        "Prioridade",
        (fullServiceData.priority || "Média").toUpperCase(),
      ],
      [
        "Cliente",
        fullServiceData.client || "Não informado",
        "Cidade / Local",
        fullServiceData.city || fullServiceData.location || "São Paulo",
      ],
      [
        "Endereço",
        fullServiceData.address || fullServiceData.location || "Não informado",
        "Técnico Responsável",
        techName,
      ],
      [
        "Data de Criação",
        formatDateBR(fullServiceData.creationDate),
        "Prazo / Vencimento",
        formatDateBR(fullServiceData.dueDate),
      ],
    ],
    headStyles: tableHeadStyles,
    bodyStyles: tableBodyStyles,
    columnStyles: {
      0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 36 },
      1: { cellWidth: 55 },
      2: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 36 },
      3: { cellWidth: 55 },
    },
    margin: { left: margin, right: margin },
  });
  currentY = (doc as any).lastAutoTable.finalY + 8;

  // SECÇÃO 2: Descrição e Observações
  if (fullServiceData.description || fullServiceData.notes) {
    drawSectionHeader("Descrição e Observações do Serviço");
    const descRows: Array<[string, string]> = [];
    if (fullServiceData.description) {
      descRows.push(["Descrição Técnica", fullServiceData.description]);
    }
    if (fullServiceData.notes) {
      descRows.push(["Observações", fullServiceData.notes]);
    }
    autoTable(doc, {
      startY: currentY,
      body: descRows,
      bodyStyles: tableBodyStyles,
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [248, 250, 252], cellWidth: 42 },
      },
      margin: { left: margin, right: margin },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECÇÃO 3: Checklist / Campos Customizados
  if (fullServiceData.customFields && fullServiceData.customFields.length > 0) {
    drawSectionHeader("Checklist Técnico");
    const customRows = fullServiceData.customFields.map((f) => [
      f.label || f.id,
      typeof f.value === "boolean"
        ? f.value
          ? "Sim"
          : "Não"
        : String(f.value ?? "-"),
    ]);
    autoTable(doc, {
      startY: currentY,
      head: [["Item Verificado", "Resposta / Medição"]],
      body: customRows,
      headStyles: tableHeadStyles,
      bodyStyles: tableBodyStyles,
      margin: { left: margin, right: margin },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECÇÃO 4: Materiais
  if (materialRows.length > 0) {
    drawSectionHeader("Materiais Utilizados");
    autoTable(doc, {
      startY: currentY,
      head: [["Material", "Unid.", "Planejado", "Utilizado", "Custo Total"]],
      body: materialRows,
      headStyles: tableHeadStyles,
      bodyStyles: tableBodyStyles,
      margin: { left: margin, right: margin },
    });
    currentY = (doc as any).lastAutoTable.finalY + 8;
  }

  // SECÇÃO 5: Fotografias (Garantindo que todas apareçam)
  const rawPhotos: Array<{ url: string; title: string }> = (
    fullServiceData.photos || []
  ).map((p: any, idx: number) => {
    if (typeof p === "string") {
      return {
        url: p,
        title: fullServiceData.photoTitles?.[idx] || `Registo Fotográfico ${idx + 1}`,
      };
    }
    return {
      url: p.url || "",
      title: p.title || `Registo Fotográfico ${idx + 1}`,
    };
  });

  if (rawPhotos.length > 0) {
    const loadedPhotos = (
      await Promise.all(
        rawPhotos.map((p) => loadImageWithDimensions(p.url, p.title))
      )
    ).filter(Boolean) as LoadedImageInfo[];

    if (loadedPhotos.length > 0) {
      drawSectionHeader(`Anexos Fotográficos (${loadedPhotos.length})`);

      const boxWidth = (contentWidth - 6) / 2;
      const boxHeight = 66;
      const imgAreaHeight = 52;

      for (let i = 0; i < loadedPhotos.length; i += 2) {
        if (currentY + boxHeight > pageHeight - 20) {
          doc.addPage();
          currentY = 20;
        }

        const pair = [loadedPhotos[i], loadedPhotos[i + 1]].filter(Boolean);
        pair.forEach((photo, colIdx) => {
          const boxX = margin + colIdx * (boxWidth + 6);

          doc.setDrawColor(226, 232, 240);
          doc.setFillColor(248, 250, 252);
          doc.roundedRect(boxX, currentY, boxWidth, boxHeight, 2, 2, "FD");

          const maxW = boxWidth - 6;
          const maxH = imgAreaHeight - 4;
          const ratio = Math.min(maxW / photo.width, maxH / photo.height);
          const drawW = photo.width * ratio;
          const drawH = photo.height * ratio;
          const imgX = boxX + (boxWidth - drawW) / 2;
          const imgY = currentY + 3 + (maxH - drawH) / 2;

          doc.addImage(photo.dataUrl, "JPEG", imgX, imgY, drawW, drawH);

          doc.setFont("helvetica", "bold");
          doc.setFontSize(8);
          doc.setTextColor(51, 65, 85);
          const cleanTitle =
            photo.title.length > 38
              ? photo.title.slice(0, 35) + "..."
              : photo.title;
          doc.text(cleanTitle, boxX + 4, currentY + boxHeight - 4);
        });

        currentY += boxHeight + 6;
      }
    }
  }

  // SECÇÃO 6: Assinaturas
  const clientSig =
    fullServiceData.signatures?.client || (fullServiceData as any).reportData?.clientSignature;
  const techSig = fullServiceData.signatures?.technician;

  if (clientSig || techSig || true) {
    if (currentY + 45 > pageHeight - 20) {
      doc.addPage();
      currentY = 20;
    }
    drawSectionHeader("Assinaturas de Conformidade");

    const sigBoxW = (contentWidth - 8) / 2;
    const sigBoxH = 32;

    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, sigBoxW, sigBoxH, 2, 2, "S");
    if (clientSig && clientSig.startsWith("data:image")) {
      try {
        doc.addImage(clientSig, "PNG", margin + 10, currentY + 3, sigBoxW - 20, 20);
      } catch {}
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text(
      `Cliente: ${fullServiceData.client || "Responsável"}`,
      margin + sigBoxW / 2,
      currentY + sigBoxH - 3,
      { align: "center" }
    );

    const techBoxX = margin + sigBoxW + 8;
    doc.roundedRect(techBoxX, currentY, sigBoxW, sigBoxH, 2, 2, "S");
    if (techSig && techSig.startsWith("data:image")) {
      try {
        doc.addImage(techSig, "PNG", techBoxX + 10, currentY + 3, sigBoxW - 20, 20);
      } catch {}
    }
    doc.text(
      `Técnico: ${techName}`,
      techBoxX + sigBoxW / 2,
      currentY + sigBoxH - 3,
      { align: "center" }
    );
  }

  // Rodapé Exato em Todas as Páginas
  const totalPages = doc.getNumberOfPages();
  for (let page = 1; page <= totalPages; page++) {
    doc.setPage(page);
    doc.setDrawColor(226, 232, 240);
    doc.line(margin, pageHeight - 13, pageWidth - margin, pageHeight - 13);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `ServiceFlow  •  ${shortOS}  •  Gerado em ${emittedAt}`,
      margin,
      pageHeight - 8
    );
    doc.text(
      `Página ${page} de ${totalPages}`,
      pageWidth - margin,
      pageHeight - 8,
      { align: "right" }
    );
  }

  const safeTitle = (fullServiceData.title || "OS")
    .replace(/[^\w\s-]/gi, "")
    .trim()
    .replace(/\s+/g, "_");
  doc.save(`Relatorio_${shortOS.replace(/[\s#]/g, "")}_${safeTitle}.pdf`);
};

export default generateProfessionalServiceReport;
