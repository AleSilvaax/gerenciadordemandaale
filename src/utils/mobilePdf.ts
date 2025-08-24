import { toast } from '@/hooks/use-toast';

interface ShareOptions {
  title?: string;
  text?: string;
}

/**
 * Enhanced PDF handling for mobile devices
 * Provides better user experience with share API, fallbacks, and proper notifications
 */
export class MobilePdfHandler {
  /**
   * Handle PDF download/sharing on mobile devices
   */
  static async handlePdfDownload(
    pdfBlob: Blob, 
    filename: string, 
    options: ShareOptions = {}
  ): Promise<void> {
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    try {
      if (isMobile && this.canUseWebShare()) {
        await this.shareViaNativeAPI(pdfBlob, filename, options);
      } else {
        await this.downloadOrOpenPdf(pdfBlob, filename);
      }
    } catch (error) {
      console.error('Error handling PDF:', error);
      // Fallback to direct download
      await this.downloadOrOpenPdf(pdfBlob, filename);
    }
  }

  /**
   * Share via Web Share API (mobile native sharing)
   */
  private static async shareViaNativeAPI(
    pdfBlob: Blob, 
    filename: string, 
    options: ShareOptions
  ): Promise<void> {
    try {
      const file = new File([pdfBlob], filename, { type: 'application/pdf' });
      
      await navigator.share({
        title: options.title || 'Relatório PDF',
        text: options.text || 'Compartilhar relatório',
        files: [file]
      });
      
      toast({
        title: "PDF Compartilhado",
        description: "Relatório compartilhado com sucesso.",
      });
    } catch (error) {
      // User cancelled or error occurred, fallback to download
      throw error;
    }
  }

  /**
   * Download or open PDF (fallback method)
   */
  private static async downloadOrOpenPdf(pdfBlob: Blob, filename: string): Promise<void> {
    const url = URL.createObjectURL(pdfBlob);
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    if (isMobile) {
      // On mobile, try to open in new tab first
      const newWindow = window.open(url, '_blank');
      
      if (newWindow) {
        toast({
          title: "PDF Gerado",
          description: "Relatório aberto em nova aba. Toque para baixar se necessário.",
          duration: 5000,
        });
      } else {
        // If popup blocked, fallback to download
        this.triggerDownload(url, filename);
        toast({
          title: "PDF Baixado",
          description: "Relatório salvo na pasta de downloads.",
          duration: 5000,
        });
      }
    } else {
      // Desktop: open in new tab
      window.open(url, '_blank');
      toast({
        title: "PDF Gerado",
        description: "Relatório aberto em nova aba.",
      });
    }
    
    // Cleanup URL after a delay
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }

  /**
   * Force download of PDF
   */
  private static triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Check if Web Share API is available and supports files
   */
  private static canUseWebShare(): boolean {
    return 'navigator' in window && 
           'share' in navigator && 
           'canShare' in navigator &&
           navigator.canShare({ files: [new File([], 'test.pdf', { type: 'application/pdf' })] });
  }

  /**
   * Convert jsPDF doc to blob
   */
  static pdfDocToBlob(doc: any): Blob {
    const pdfOutput = doc.output('blob');
    return pdfOutput;
  }

  /**
   * Enhanced wrapper for existing PDF generators
   */
  static async generateAndHandle(
    pdfGenerator: () => Promise<any> | any,
    filename: string,
    options: ShareOptions = {}
  ): Promise<void> {
    try {
      toast({
        title: "Gerando PDF...",
        description: "Processando dados e criando documento.",
      });

      const doc = await pdfGenerator();
      const blob = this.pdfDocToBlob(doc);
      
      await this.handlePdfDownload(blob, filename, options);
    } catch (error) {
      console.error('PDF generation error:', error);
      toast({
        title: "Erro ao gerar PDF",
        description: "Ocorreu um erro ao criar o relatório. Tente novamente.",
        variant: "destructive"
      });
    }
  }
}

/**
 * Hook-style wrapper for easier integration
 */
export const useMobilePdf = () => {
  return {
    generateAndDownload: MobilePdfHandler.generateAndHandle,
    handlePdfDownload: MobilePdfHandler.handlePdfDownload,
    pdfDocToBlob: MobilePdfHandler.pdfDocToBlob
  };
};