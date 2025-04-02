
import React, { useRef, useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { X, Check, RotateCcw } from "lucide-react";

interface SignatureCanvasProps {
  id: string;
  label?: string;
  value?: string;
  onChange: (value: string) => void;
  height?: number;
  width?: number;
  className?: string;
}

export const SignatureCanvas: React.FC<SignatureCanvasProps> = ({
  id,
  label,
  value,
  onChange,
  height = 200,
  width = 400,
  className = "",
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const [isEditMode, setIsEditMode] = useState(!value);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Configure canvas for high DPI displays
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    
    // Scale canvas back to desired display size
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    
    // Scale context to ensure correct rendering
    ctx.scale(dpr, dpr);
    
    // Clear canvas and set styling
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#000";

    // If we have a saved signature, load it
    if (value && !isEditMode) {
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, width, height);
        setHasSigned(true);
      };
      img.src = value;
    }
  }, [width, height, value, isEditMode]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    setHasSigned(true);
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Get coordinates
    let x, y;
    if ('touches' in e) {
      e.preventDefault(); // Prevent scrolling when drawing
      const rect = canvas.getBoundingClientRect();
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.nativeEvent.offsetX;
      y = e.nativeEvent.offsetY;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.closePath();
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    ctx.fillStyle = "#f3f4f6";
    ctx.fillRect(0, 0, width, height);
    setHasSigned(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const dataUrl = canvas.toDataURL("image/png");
    onChange(dataUrl);
    setIsEditMode(false);
  };

  const editSignature = () => {
    setIsEditMode(true);
    clearCanvas();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && <div className="text-sm font-medium mb-1">{label}</div>}
      
      {isEditMode ? (
        <div className="border rounded-md overflow-hidden">
          <canvas
            ref={canvasRef}
            id={id}
            width={width}
            height={height}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="touch-none cursor-crosshair bg-gray-100"
          />
          
          <div className="flex justify-between p-2 bg-gray-50 border-t">
            <Button 
              type="button" 
              variant="outline" 
              size="sm" 
              onClick={clearCanvas}
            >
              <RotateCcw size={16} className="mr-1" />
              Limpar
            </Button>
            
            <div className="space-x-2">
              <Button 
                type="button" 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditMode(false)}
              >
                <X size={16} className="mr-1" />
                Cancelar
              </Button>
              
              <Button 
                type="button" 
                variant="default" 
                size="sm" 
                onClick={saveSignature}
                disabled={!hasSigned}
              >
                <Check size={16} className="mr-1" />
                Salvar
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border rounded-md overflow-hidden">
          {value ? (
            <div className="relative bg-gray-100">
              <img 
                src={value} 
                alt="Assinatura" 
                className="max-w-full h-auto max-h-[200px] mx-auto p-4"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="absolute bottom-2 right-2"
                onClick={editSignature}
              >
                Alterar
              </Button>
            </div>
          ) : (
            <div 
              className="flex items-center justify-center h-[200px] bg-gray-100 cursor-pointer"
              onClick={() => setIsEditMode(true)}
            >
              <Button type="button" variant="outline">
                Adicionar Assinatura
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
