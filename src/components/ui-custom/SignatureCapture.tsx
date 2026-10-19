import React, { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Undo2, Check, Trash2, PenTool } from 'lucide-react';
interface Props {
  onSave?: (value: string) => void;
  onChange?: (value: string) => void;
  initialSignature?: string;
  initialValue?: string;
  label?: string;
  width?: number;
  height?: number;
  disabled?: boolean;
}
export const SignatureCapture: React.FC<Props> = ({
  onSave,
  onChange,
  initialSignature,
  initialValue,
  label = 'Assinatura',
  disabled = false,
}) => {
  const [value, setValue] = useState(initialSignature || initialValue || '');
  const [open, setOpen] = useState(false);
  const [empty, setEmpty] = useState(true);
  const [size, setSize] = useState({ width: 300, height: 300 });
  const pad = useRef<SignatureCanvas | null>(null);
  const area = useRef<HTMLDivElement>(null);
  useEffect(
    () => setValue(initialSignature || initialValue || ''),
    [initialSignature, initialValue]
  );
  useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => {
      const node = area.current;
      if (!node) return;
      const observer = new ResizeObserver(() => {
        const rect = node.getBoundingClientRect();
        setSize({
          width: Math.max(1, Math.floor(rect.width)),
          height: Math.max(1, Math.floor(rect.height)),
        });
      });
      observer.observe(node);
      cleanup = () => observer.disconnect();
    });
    let cleanup = () => {};
    return () => {
      cancelAnimationFrame(frame);
      cleanup();
    };
  }, [open]);
  const confirm = () => {
    const canvas = pad.current;
    if (!canvas || canvas.isEmpty()) return;
    const data = canvas.getTrimmedCanvas().toDataURL('image/png');
    setValue(data);
    onChange?.(data);
    onSave?.(data);
    setOpen(false);
  };
  return (
    <div className="space-y-2">
      {disabled ? (
        <div className="border border-border rounded-md bg-card h-40 flex items-center justify-center">
          {value ? (
            <img
              src={value}
              alt={label}
              className="w-full h-full object-contain p-2"
            />
          ) : (
            <span className="text-xs text-muted-foreground">
              Nenhuma assinatura registrada
            </span>
          )}
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          className="w-full h-40 p-2 rounded-md bg-card"
          aria-label={`Abrir ${label} em tela cheia`}
          onClick={() => {
            setEmpty(true);
            setOpen(true);
          }}
        >
          {value ? (
            <img
              src={value}
              alt={label}
              className="w-full h-full object-contain"
            />
          ) : (
            <span className="flex items-center gap-2">
              <PenTool className="h-4 w-4" />
              Assinar
            </span>
          )}
        </Button>
      )}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent
          aria-describedby={undefined}
          className="!inset-0 !translate-x-0 !translate-y-0 !max-w-none !w-screen !h-[100dvh] !rounded-none !p-4 flex flex-col gap-3"
        >
          <DialogTitle className="pr-8">{label}</DialogTitle>
          <div
            ref={area}
            className="flex-1 min-h-0 overflow-hidden border border-border rounded-md bg-card text-foreground"
          >
            <SignatureCanvas
              ref={pad}
              penColor="currentColor"
              canvasProps={{
                width: size.width,
                height: size.height,
                className: 'touch-none block',
              }}
              onEnd={() => setEmpty(pad.current?.isEmpty() ?? true)}
            />
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-[env(safe-area-inset-bottom)]">
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Desfazer"
                aria-label="Desfazer"
                onClick={() => {
                  const data = pad.current?.toData() || [];
                  data.pop();
                  pad.current?.fromData(data);
                  setEmpty(data.length === 0);
                }}
              >
                <Undo2 className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                variant="outline"
                size="icon"
                title="Limpar"
                aria-label="Limpar"
                onClick={() => {
                  pad.current?.clear();
                  setEmpty(true);
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
            <Button type="button" disabled={empty} onClick={confirm}>
              <Check className="mr-2 h-4 w-4" />
              Confirmar assinatura
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
