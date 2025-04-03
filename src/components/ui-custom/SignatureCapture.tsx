
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Trash2, Edit2, Save } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface SignatureCaptureProps {
  onSave?: (signatureUrl: string) => void;
  onChange?: (signatureUrl: string) => void; // Add this for compatibility
  initialSignature?: string;
  initialValue?: string; // Add this for compatibility
  label?: string;
  width?: number;
  height?: number;
  className?: string;
}

export const SignatureCapture: React.FC<SignatureCaptureProps> = ({
  onSave,
  onChange,
  initialSignature,
  initialValue, // Handle both prop names
  label = "Assinatura",
  width = 400,
  height = 200,
  className = "",
}) => {
  // Use either initialValue or initialSignature
  const initialSignatureValue = initialValue || initialSignature || '';
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!initialSignatureValue);
  const [signatureUrl, setSignatureUrl] = useState(initialSignatureValue);

  const getContext = () => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'black';
    
    return ctx;
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const ctx = getContext();
    if (!ctx) return;
    
    setIsDrawing(true);
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const ctx = getContext();
    if (!ctx) return;
    
    let clientX, clientY;
    
    if ('touches' in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      
      // Prevent scrolling while drawing
      e.preventDefault();
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const endDrawing = () => {
    if (!isDrawing) return;
    
    const ctx = getContext();
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
    setHasSignature(true);
    
    // Save the signature as an image
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Convert to transparent background PNG
    const url = canvas.toDataURL('image/png');
    setSignatureUrl(url);
    
    // Call onChange if provided
    if (onChange) {
      onChange(url);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = getContext();
    
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSignature(false);
      setSignatureUrl('');
      
      // Call onChange if provided
      if (onChange) {
        onChange('');
      }
    }
  };

  const saveSignature = () => {
    if (!hasSignature) {
      toast.warning("Assinatura vazia", {
        description: "Por favor, assine antes de salvar."
      });
      return;
    }
    
    if (onSave) {
      onSave(signatureUrl);
    }
    
    if (onChange) {
      onChange(signatureUrl);
    }
    
    toast.success("Assinatura salva", {
      description: "A assinatura foi salva com sucesso."
    });
  };

  const loadInitialSignature = () => {
    if (!initialSignatureValue || !canvasRef.current) return;
    
    const ctx = getContext();
    if (!ctx) return;
    
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
    };
    img.src = initialSignatureValue;
  };

  useEffect(() => {
    if (initialSignatureValue) {
      loadInitialSignature();
    }
  }, [initialSignatureValue]);

  return (
    <div className={`space-y-2 ${className}`}>
      <Label>{label}</Label>
      
      <div className="border rounded-md bg-white">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="touch-none cursor-crosshair w-full h-full border-0"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={endDrawing}
          onMouseLeave={endDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={endDrawing}
        />
      </div>
      
      <div className="flex space-x-2">
        <Button
          type="button"
          variant="outline"
          onClick={clearSignature}
          className="flex-1"
        >
          <Trash2 className="mr-2 h-4 w-4" /> Limpar
        </Button>
        <Button
          type="button"
          variant="default"
          onClick={saveSignature}
          disabled={!hasSignature}
          className="flex-1"
        >
          <Save className="mr-2 h-4 w-4" /> Salvar
        </Button>
      </div>
      
      {initialSignatureValue && (
        <div className="mt-2 text-sm text-muted-foreground">
          Você já possui uma assinatura salva. Desenhe uma nova para substituí-la.
        </div>
      )}
    </div>
  );
};
