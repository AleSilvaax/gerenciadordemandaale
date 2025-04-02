
import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

interface SignatureCanvasProps {
  onSignatureCapture: (signatureDataUrl: string) => void;
  width?: number;
  height?: number;
  label?: string;
  placeholder?: string;
}

export function SignatureCanvas({
  onSignatureCapture,
  width = 400,
  height = 200,
  label = "Assinatura Digital",
  placeholder = "Assine aqui"
}: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Setup canvas
    context.lineWidth = 2;
    context.lineCap = "round";
    context.strokeStyle = "#000000";
    
    // If canvas is not using CSS sizing, set dimensions
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    
    // Clear canvas and draw placeholder text
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = "#cccccc";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(placeholder, canvas.width / 2, canvas.height / 2);
    
    // Draw signature area border
    context.strokeStyle = "#cccccc";
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#000000";
  }, [width, height, placeholder]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;

    setIsDrawing(true);
    
    // Clear placeholder text when drawing starts
    if (!hasSignature) {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#cccccc";
      context.strokeRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = "#000000";
      setHasSignature(true);
    }
    
    // Get coordinates
    let clientX, clientY;
    
    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Get canvas position
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Start path
    context.beginPath();
    context.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Get coordinates
    let clientX, clientY;
    
    if ("touches" in e) {
      // Touch event
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
      e.preventDefault(); // Prevent scrolling while drawing
    } else {
      // Mouse event
      clientX = e.clientX;
      clientY = e.clientY;
    }
    
    // Get canvas position
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Draw line
    context.lineTo(x, y);
    context.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const context = canvas.getContext("2d");
    if (!context) return;
    
    // Clear canvas
    context.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw placeholder text
    context.fillStyle = "#cccccc";
    context.font = "16px Arial";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText(placeholder, canvas.width / 2, canvas.height / 2);
    
    // Draw signature area border
    context.strokeStyle = "#cccccc";
    context.strokeRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = "#000000";
    
    setHasSignature(false);
  };

  const saveSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    if (!hasSignature) {
      toast.error("Assinatura necessária", {
        description: "Por favor, faça sua assinatura antes de salvar."
      });
      return;
    }
    
    // Get signature as data URL
    const signatureDataUrl = canvas.toDataURL("image/png");
    onSignatureCapture(signatureDataUrl);
    
    toast.success("Assinatura salva", {
      description: "Sua assinatura foi capturada com sucesso."
    });
  };

  return (
    <div className="flex flex-col gap-2">
      <label className="font-medium text-sm">{label}</label>
      <div className="border border-gray-300 rounded-md overflow-hidden bg-white">
        <canvas
          ref={canvasRef}
          className="touch-none"
          width={width}
          height={height}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
      </div>
      <div className="flex gap-2 mt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={clearCanvas}
          className="flex-1"
        >
          Limpar
        </Button>
        <Button 
          type="button" 
          onClick={saveSignature}
          className="flex-1"
        >
          Salvar Assinatura
        </Button>
      </div>
    </div>
  );
}
