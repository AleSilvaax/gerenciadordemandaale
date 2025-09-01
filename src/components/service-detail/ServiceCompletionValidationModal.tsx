
import React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Package, ArrowRight } from "lucide-react";

interface MaterialShortage {
  material_id: string;
  material_name: string;
  used_quantity: number;
  current_stock: number;
  missing: number;
}

interface ServiceCompletionValidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProceedAnyway: () => void;
  onAddStock?: () => void;
  shortages: MaterialShortage[];
  isLoading?: boolean;
}

export const ServiceCompletionValidationModal: React.FC<ServiceCompletionValidationModalProps> = ({
  isOpen,
  onClose,
  onProceedAnyway,
  onAddStock,
  shortages,
  isLoading = false
}) => {
  const hasShortages = shortages.length > 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {hasShortages ? (
              <>
                <AlertTriangle className="w-5 h-5 text-warning" />
                Materiais Insuficientes
              </>
            ) : (
              <>
                <Package className="w-5 h-5 text-success" />
                Validação de Materiais
              </>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {hasShortages ? (
            <>
              <div className="bg-gradient-to-r from-warning/10 to-warning/5 border border-warning/30 rounded-lg p-4">
                <p className="text-sm text-foreground mb-3">
                  Os seguintes materiais não possuem estoque suficiente para concluir esta demanda:
                </p>
                
                <div className="space-y-3">
                  {shortages.map((shortage) => (
                    <div key={shortage.material_id} className="bg-background/50 rounded-lg p-3 border border-border/50">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium text-foreground">{shortage.material_name}</h4>
                        <Badge variant="destructive" className="text-xs">
                          Faltam {shortage.missing}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span>Necessário:</span>
                          <span className="font-medium text-foreground">{shortage.used_quantity}</span>
                        </div>
                        <ArrowRight className="w-3 h-3" />
                        <div className="flex items-center gap-1">
                          <span>Disponível:</span>
                          <span className="font-medium text-foreground">{shortage.current_stock}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-gradient-to-r from-muted/10 to-muted/5 border border-border/30 rounded-lg p-4">
                <p className="text-sm text-muted-foreground">
                  💡 <strong>Dica:</strong> Você pode adicionar entrada de estoque para os materiais em falta, 
                  ou prosseguir mesmo assim (não recomendado).
                </p>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-r from-success/10 to-success/5 border border-success/30 rounded-lg p-4 text-center">
              <Package className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-sm text-foreground">
                ✅ Todos os materiais possuem estoque suficiente para concluir esta demanda.
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onClose}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          
          {hasShortages && onAddStock && (
            <Button 
              variant="secondary" 
              onClick={onAddStock}
              disabled={isLoading}
            >
              <Package className="w-4 h-4 mr-2" />
              Gerenciar Estoque
            </Button>
          )}
          
          <Button 
            onClick={onProceedAnyway}
            disabled={isLoading}
            className={hasShortages ? "bg-warning text-warning-foreground hover:bg-warning/90" : "bg-success text-success-foreground hover:bg-success/90"}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                Finalizando...
              </>
            ) : (
              hasShortages ? "Prosseguir Mesmo Assim" : "Finalizar Demanda"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
