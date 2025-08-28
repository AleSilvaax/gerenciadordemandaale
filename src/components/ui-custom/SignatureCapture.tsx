
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Undo2, Save, Trash2 } from "lucide-react";

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
  disabled = false
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  const [hasInitialized, setHasInitialized] = useState(false);
  
  // Initialize with initial signature if provided
  useEffect(() => {
    if (sigCanvas.current && !hasInitialized) {
      const signatureData = initialSignature || initialValue;
      if (signatureData) {
        try {
          // Limpar primeiro
          sigCanvas.current.clear();
          // Carregar a assinatura
          sigCanvas.current.fromDataURL(signatureData);
          setIsEmpty(false);
          console.log("Assinatura carregada no SignatureCapture:", signatureData.substring(0, 50) + "...");
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
      if (onChange) {
        onChange('');
      }
      console.log("Assinatura limpa");
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
        
        // Call onChange if provided
        if (onChange) {
          if (newIsEmpty) {
            onChange('');
          } else {
            const dataURL = sigCanvas.current.toDataURL('image/png', 1.0);
            onChange(dataURL);
          }
        }
        console.log("Assinatura desfeita");
      }
    }
  };
  
  const save = () => {
    if (sigCanvas.current && !isEmpty && !disabled) {
      const dataURL = sigCanvas.current.toDataURL('image/png', 1.0); // Qualidade máxima
      console.log("Salvando assinatura manualmente - tamanho:", dataURL.length);
      if (onSave) {
        onSave(dataURL);
      }
      if (onChange) {
        onChange(dataURL);
      }
    }
  };
  
  const handleEnd = () => {
    if (sigCanvas.current && !disabled) {
      const currentIsEmpty = sigCanvas.current.isEmpty();
      setIsEmpty(currentIsEmpty);
      
      // Salvar automaticamente quando há mudança na assinatura
      if (onChange && !currentIsEmpty) {
        const dataURL = sigCanvas.current.toDataURL('image/png', 1.0); // Qualidade máxima
        console.log("Assinatura capturada automaticamente - tamanho:", dataURL.length);
        onChange(dataURL);
      } else if (onChange && currentIsEmpty) {
        onChange('');
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="text-sm font-medium">{label}</div>
        <div className={`border rounded-md overflow-hidden ${disabled ? 'bg-muted' : 'bg-white'}`}>
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: width,
              height: height,
              className: "signature-canvas"
            }}
            onEnd={disabled ? undefined : handleEnd}
            backgroundColor={disabled ? "rgba(243,244,246,1)" : "rgba(255,255,255,1)"}
          />
          {disabled && (
            <div className="absolute inset-0 cursor-not-allowed" />
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={undo}
            disabled={isEmpty || disabled}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Desfazer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clear}
            disabled={isEmpty || disabled}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          {onSave && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={save}
              disabled={isEmpty || disabled}
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          )}
        </div>
        {disabled && (
          <p className="text-xs text-muted-foreground text-center">
            Edição bloqueada - serviço concluído
          </p>
        )}
      </CardContent>
    </Card>
  );
};
