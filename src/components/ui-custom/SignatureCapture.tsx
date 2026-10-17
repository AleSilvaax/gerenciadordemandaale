import React, { useRef, useState, useEffect } from "react";
import SignatureCanvas from "react-signature-canvas";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Undo2, Save, Trash2, Lock, PenTool } from "lucide-react";

interface SignatureCaptureProps {
  onSave?: (signatureUrl: string) => void;
  onChange?: (dataUrl: string) => void;
  initialSignature?: string;
  initialValue?: string;
  label?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onChange,
  initialSignature,
  initialValue,
  label = "Assinatura",
  width = 300,
  height = 150,
  disabled = false,
}) => {
  const sigCanvas = useRef<SignatureCanvas | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);

  useEffect(() => {
    if (sigCanvas.current && !hasInitialized) {
      const signatureData = initialSignature || initialValue;
      if (signatureData) {
        try {
          sigCanvas.current.clear();
          sigCanvas.current.fromDataURL(signatureData);
          setIsEmpty(false);
        } catch (error) {
          console.error("Erro ao carregar assinatura inicial:", error);
        }
      }
      setHasInitialized(true);
    }
  }, [initialSignature, initialValue, hasInitialized]);

  const clear = () => {
    if (sigCanvas.current && !disabled) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      onChange?.("");
    }
  };

  const undo = () => {
    if (sigCanvas.current && !disabled) {
      const data = sigCanvas.current.toData();
      if (data.length > 0) {
        data.pop();
        sigCanvas.current.fromData(data);
        const newIsEmpty = data.length === 0;
        setIsEmpty(newIsEmpty);
        onChange?.(newIsEmpty ? "" : sigCanvas.current.toDataURL("image/png", 1.0));
      }
    }
  };

  const save = () => {
    if (sigCanvas.current && !isEmpty && !disabled) {
      const dataURL = sigCanvas.current.toDataURL("image/png", 1.0);
      onSave?.(dataURL);
      onChange?.(dataURL);
    }
  };

  const handleEnd = () => {
    if (sigCanvas.current && !disabled) {
      const currentIsEmpty = sigCanvas.current.isEmpty();
      setIsEmpty(currentIsEmpty);
      onChange?.(currentIsEmpty ? "" : sigCanvas.current.toDataURL("image/png", 1.0));
    }
  };

  return (
    <Card className="border border-slate-200/80 dark:border-slate-800 shadow-none rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
            <PenTool className="h-3.5 w-3.5 text-blue-600" />
            <span>{label}</span>
          </div>
          {disabled && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
              <Lock className="h-3 w-3" />
              Assinatura bloqueada
            </span>
          )}
        </div>

        <div className="relative rounded-lg border border-dashed border-slate-300 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-950/50 overflow-hidden flex justify-center">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="#0f172a"
            canvasProps={{
              width,
              height,
              className: `w-full h-[140px] ${disabled ? "pointer-events-none opacity-80" : "cursor-crosshair"}`,
            }}
            onEnd={handleEnd}
          />
          {isEmpty && disabled && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Nenhuma assinatura registrada
            </div>
          )}
        </div>

        {/* Só renderiza os botões se NÃO estiver bloqueado/concluído */}
        {!disabled && (
          <div className="flex items-center justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={undo}
              disabled={isEmpty}
              className="h-8 text-xs"
            >
              <Undo2 className="h-3.5 w-3.5 mr-1" />
              Desfazer
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={clear}
              disabled={isEmpty}
              className="h-8 text-xs text-rose-600 hover:text-rose-700"
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Limpar
            </Button>
            {onSave && (
              <Button
                type="button"
                size="sm"
                onClick={save}
                disabled={isEmpty}
                className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Save className="h-3.5 w-3.5 mr-1" />
                Confirmar
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
