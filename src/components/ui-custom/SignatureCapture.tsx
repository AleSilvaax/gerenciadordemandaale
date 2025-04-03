
import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Undo2, Save, Trash2 } from "lucide-react";

interface SignatureCaptureProps {
  onSave?: (signatureUrl: string) => void;
  onChange?: (dataUrl: string) => void; // Add onChange prop
  initialSignature?: string;
  initialValue?: string; // Add initialValue prop for compatibility
  label?: string;
  width?: number;
  height?: number;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onChange,
  initialSignature,
  initialValue, // Support for initialValue prop
  label = "Assinatura",
  width = 300,
  height = 150
}) => {
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [isEmpty, setIsEmpty] = useState(true);
  
  // Initialize with initial signature if provided
  useEffect(() => {
    if (sigCanvas.current) {
      if (initialSignature || initialValue) {
        const signatureData = initialSignature || initialValue;
        sigCanvas.current.fromDataURL(signatureData);
        setIsEmpty(false);
      }
    }
  }, [initialSignature, initialValue]);
  
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
        setIsEmpty(data.length === 0);
        
        // Call onChange if provided
        if (onChange && data.length === 0) {
          onChange('');
        } else if (onChange) {
          onChange(sigCanvas.current.toDataURL('image/png'));
        }
      }
    }
  };
  
  const save = () => {
    if (sigCanvas.current && !isEmpty) {
      const dataURL = sigCanvas.current.toDataURL('image/png');
      if (onSave) {
        onSave(dataURL);
      }
      if (onChange) {
        onChange(dataURL);
      }
    }
  };
  
  const handleEnd = () => {
    setIsEmpty(sigCanvas.current?.isEmpty() || true);
    // Call onChange whenever the signature changes
    if (onChange && sigCanvas.current && !sigCanvas.current.isEmpty()) {
      onChange(sigCanvas.current.toDataURL('image/png'));
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
