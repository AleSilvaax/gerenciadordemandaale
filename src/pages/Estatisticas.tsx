  const handleExportSummaryPDF = async () => {
    const toastId = toast.loading("Gerando relatório estatístico em PDF...");
    try {
      const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
      const pageWidth = doc.internal.pageSize.getWidth();
      const nowStr = new Date().toLocaleString("pt-BR");

      // Cabeçalho Executivo
      doc.setFillColor(15, 23, 42); // Slate-900
      doc.rect(0, 0, pageWidth, 32, "F");
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 32, pageWidth, 1.5, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.text("PANORAMA ESTATÍSTICO DE OPERAÇÕES", 14, 14);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      doc.setTextColor(203, 213, 225);
      doc.text(`Emitido em: ${nowStr}  •  ServiceFlow Analytics`, 14, 22);

      autoTable(doc, {
        startY: 40,
        head: [["Indicador Operacional", "Resultado"]],
        body: [
          ["Total de Demandas", String(metrics.total)],
          ["Concluídas", String(metrics.completed)],
          ["Pendentes / Em Aberto", String(metrics.pending + metrics.inProgress)],
          ["Taxa de Conclusão", `${metrics.rate}%`],
        ],
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { textColor: [30, 41, 59], fontSize: 8.5 },
        margin: { left: 14, right: 14 },
      });

      const nextY = (doc as any).lastAutoTable.finalY + 10;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(15, 23, 42);
      doc.text("Desempenho Individual da Equipe", 14, nextY);

      autoTable(doc, {
        startY: nextY + 4,
        head: [["Colaborador", "Cargo", "Total", "Concluídas", "Pendentes", "Taxa"]],
        body: teamPerformance.map((tp) => [
          tp.name,
          (tp.role || "técnico").toUpperCase(),
          String(tp.total),
          String(tp.completed),
          String(tp.pending),
          `${tp.rate}%`,
        ]),
        headStyles: { fillColor: [30, 41, 59], textColor: [255, 255, 255], fontSize: 9 },
        bodyStyles: { textColor: [30, 41, 59], fontSize: 8.5 },
        margin: { left: 14, right: 14 },
      });

      const totalPages = doc.getNumberOfPages();
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.getHeight();
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(100, 116, 139);
        doc.text("ServiceFlow — Painel Estatístico", 14, pageHeight - 8);
        doc.text(`Página ${i} de ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
      }

      doc.save(`estatisticas-serviceflow-${new Date().toISOString().slice(0, 10)}.pdf`);
      toast.success("Relatório estatístico exportado com sucesso!", { id: toastId });
    } catch (e) {
      console.error("Erro ao gerar PDF:", e);
      toast.error("Erro ao exportar PDF.", { id: toastId });
    }
  };
