
import React from "react";
import { Button } from "@/components/ui/button";
import { Save, FileText, Download } from "lucide-react";

interface BottomActionBarProps {
  isSubmitting: boolean;
  pdfGenerated: boolean;
  status: string;
  onCancel: () => void;
  onGeneratePDF: () => void;
  onDownloadPDF: () => void;
  onSave: () => void;
}

const BottomActionBar: React.FC<BottomActionBarProps> = ({
  isSubmitting,
  pdfGenerated,
  status,
  onCancel,
  onGeneratePDF,
  onDownloadPDF,
  onSave
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-white/10 p-4 z-10">
      <div className="flex justify-between items-center max-w-md mx-auto">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <div className="flex gap-2">
          {status === "concluido" && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onGeneratePDF}
            >
              <FileText size={16} className="mr-2" />
              Gerar PDF
            </Button>
          )}
          {pdfGenerated && (
            <Button 
              type="button" 
              variant="outline"
              onClick={onDownloadPDF}
            >
              <Download size={16} className="mr-2" />
              Baixar PDF
            </Button>
          )}
          <Button type="button" onClick={onSave} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <span className="animate-spin mr-2">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" strokeDasharray="32" strokeDashoffset="10" />
                  </svg>
                </span>
                Salvando...
              </>
            ) : (
              <>
                <Save size={16} className="mr-2" />
                Salvar
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BottomActionBar;
