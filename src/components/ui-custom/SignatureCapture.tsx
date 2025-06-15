
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
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onChange,
  initialSignature,
  initialValue,
  label = "Assinatura",
  width = 300,
  height = 150
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
          sigCanvas.current.fromDataURL(signatureData);
          setIsEmpty(false);
          console.log("Assinatura carregada:", signatureData.substring(0, 50) + "...");
        } catch (error) {
          console.error("Erro ao carregar assinatura inicial:", error);
        }
      }
      setHasInitialized(true);
    }
  }, [initialSignature, initialValue, hasInitialized]);
  
  const clear = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
      setIsEmpty(true);
      if (onChange) {
        onChange('');
      }
    }
  };
  
  const undo = () => {
    if (sigCanvas.current) {
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
            const dataURL = sigCanvas.current.toDataURL('image/png');
            onChange(dataURL);
          }
        }
      }
    }
  };
  
  const save = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      console.log("Salvando assinatura:", dataURL.substring(0, 50) + "...");
      if (onSave) {
        onSave(dataURL);
      }
      if (onChange) {
        onChange(dataURL);
      }
    }
  };
  
  const handleEnd = () => {
    if (sigCanvas.current) {
      const currentIsEmpty = sigCanvas.current.isEmpty();
      setIsEmpty(currentIsEmpty);
      
      // Call onChange whenever the signature changes
      if (onChange && !currentIsEmpty) {
        const dataURL = sigCanvas.current.toDataURL('image/png');
        console.log("Assinatura alterada:", dataURL.substring(0, 50) + "...");
        onChange(dataURL);
      }
    }
  };
  
  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-4">
        <div className="text-sm font-medium">{label}</div>
        <div className="border rounded-md overflow-hidden bg-white">
          <SignatureCanvas
            ref={sigCanvas}
            penColor="black"
            canvasProps={{
              width: width,
              height: height,
              className: "signature-canvas"
            }}
            onEnd={handleEnd}
            backgroundColor="rgba(255,255,255,1)"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={undo}
            disabled={isEmpty}
          >
            <Undo2 className="h-4 w-4 mr-1" />
            Desfazer
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={clear}
            disabled={isEmpty}
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar
          </Button>
          {onSave && (
            <Button 
              variant="default" 
              size="sm" 
              onClick={save}
              disabled={isEmpty}
            >
              <Save className="h-4 w-4 mr-1" />
              Salvar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
