import React, { useRef, useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Undo2, Check, Loader2 } from 'lucide-react';
interface Props {
  url: string;
  open: boolean;
  onClose: () => void;
  onSave: (file: File) => Promise<void>;
}
interface Stroke {
  color: string;
  points: Array<{ x: number; y: number }>;
}
export function PhotoAnnotator({ url, open, onClose, onSave }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const image = useRef<HTMLImageElement | null>(null);
  const strokes = useRef<Stroke[]>([]);
  const drawing = useRef(false);
  const [color, setColor] = useState('primary');
  const [busy, setBusy] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const render = () => {
    const c = canvas.current;
    const img = image.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx || !img) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.drawImage(img, 0, 0, c.width, c.height);
    ctx.lineWidth = Math.max(3, c.width / 220);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    for (const line of strokes.current) {
      ctx.strokeStyle = line.color;
      ctx.beginPath();
      line.points.forEach((p, i) =>
        i === 0
          ? ctx.moveTo(p.x * c.width, p.y * c.height)
          : ctx.lineTo(p.x * c.width, p.y * c.height)
      );
      ctx.stroke();
    }
  };
  useEffect(() => {
    if (!open) return;
    setReady(false);
    setFailed(false);
    strokes.current = [];
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      image.current = img;
      const c = canvas.current;
      if (!c) return;
      const ratio = Math.min(1, 2000 / Math.max(img.width, img.height));
      c.width = Math.round(img.width * ratio);
      c.height = Math.round(img.height * ratio);
      render();
      setReady(true);
    };
    img.onerror = () => setFailed(true);
    img.src = url;
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [url, open]);
  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };
  const save = async () => {
    const c = canvas.current;
    if (!c) return;
    setBusy(true);
    try {
      const blob = await new Promise<Blob | null>(resolve =>
        c.toBlob(resolve, 'image/jpeg', 0.92)
      );
      if (!blob) throw new Error('Imagem indisponível');
      await onSave(
        new File([blob], 'infra-anotada.jpg', { type: 'image/jpeg' })
      );
      onClose();
    } finally {
      setBusy(false);
    }
  };
  return (
    <Dialog
      open={open}
      onOpenChange={v => {
        if (!v && !busy) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className="!inset-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !rounded-none !p-4 flex flex-col gap-3"
      >
        <DialogTitle className="pr-8">Desenhar na foto</DialogTitle>
        <div className="flex items-center gap-2">
          <div role="group" aria-label="Cor do traço" className="flex gap-2">
            {['primary', 'destructive', 'foreground'].map(c => (
              <Button
                key={c}
                type="button"
                variant="outline"
                size="icon"
                aria-label={
                  c === 'primary'
                    ? 'Azul'
                    : c === 'destructive'
                      ? 'Vermelho'
                      : 'Grafite'
                }
                aria-pressed={color === c}
                onClick={() => setColor(c)}
                className={color === c ? 'ring-2 ring-ring' : ''}
              >
                <span
                  className={`w-4 h-4 rounded-full ${c === 'primary' ? 'bg-primary' : c === 'destructive' ? 'bg-destructive' : 'bg-foreground'}`}
                />
              </Button>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="icon"
            title="Desfazer"
            aria-label="Desfazer desenho"
            onClick={() => {
              strokes.current.pop();
              render();
            }}
          >
            <Undo2 className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex-1 min-h-0 flex items-center justify-center overflow-hidden bg-muted rounded-md">
          {failed && (
            <p className="text-sm text-destructive">
              Não foi possível carregar a foto.
            </p>
          )}
          <canvas
            ref={canvas}
            className="max-w-full max-h-full w-auto h-auto touch-none"
            aria-label="Foto para desenhar"
            onPointerDown={e => {
              if (!ready || busy) return;
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = true;
              const style = getComputedStyle(e.currentTarget);
              const token = style.getPropertyValue(`--${color}`).trim();
              strokes.current.push({
                color: `hsl(${token})`,
                points: [point(e)],
              });
            }}
            onPointerMove={e => {
              if (!drawing.current) return;
              strokes.current.at(-1)?.points.push(point(e));
              render();
            }}
            onPointerUp={() => {
              drawing.current = false;
            }}
            onPointerCancel={() => {
              drawing.current = false;
            }}
          />
        </div>
        <div className="flex justify-end pb-[env(safe-area-inset-bottom)]">
          <Button type="button" disabled={!ready || busy} onClick={save}>
            {busy ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            Salvar cópia anotada
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
