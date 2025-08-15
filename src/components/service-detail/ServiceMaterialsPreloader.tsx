import React, { useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, AlertCircle } from "lucide-react";
import { useServiceTypeMaterials } from "@/hooks/useInventory";

interface ServiceMaterialsPreloaderProps {
  serviceTypeId?: string;
  onMaterialsLoaded?: (materials: Array<{ materialId: string; quantity: number; required: boolean }>) => void;
}

export const ServiceMaterialsPreloader: React.FC<ServiceMaterialsPreloaderProps> = ({
  serviceTypeId,
  onMaterialsLoaded
}) => {
  const { data: serviceTypeMaterials, isLoading } = useServiceTypeMaterials(serviceTypeId || "");

  useEffect(() => {
    if (serviceTypeMaterials && onMaterialsLoaded) {
      const materials = serviceTypeMaterials.map(stm => ({
        materialId: stm.material_id,
        quantity: stm.default_quantity,
        required: stm.is_required
      }));
      onMaterialsLoaded(materials);
    }
  }, [serviceTypeMaterials, onMaterialsLoaded]);

  if (!serviceTypeId || isLoading) {
    return null;
  }

  if (!serviceTypeMaterials || serviceTypeMaterials.length === 0) {
    return null;
  }

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Package className="w-4 h-4" />
          Materiais Padrão (baseado no tipo de serviço)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {serviceTypeMaterials.map((stm) => (
            <div
              key={stm.id}
              className="flex items-center justify-between p-3 rounded-lg bg-muted/20 border border-border/30"
            >
              <div className="flex items-center gap-3">
                <Package className="w-4 h-4 text-muted-foreground" />
                <div>
                  <p className="font-medium text-sm">{stm.material?.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {stm.default_quantity} {stm.material?.unit}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {stm.is_required && (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    Obrigatório
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs">
                  Padrão
                </Badge>
              </div>
            </div>
          ))}
          <div className="text-xs text-muted-foreground text-center mt-3 p-2 bg-accent/10 rounded border border-accent/30">
            💡 Estes materiais serão automaticamente adicionados à demanda quando ela for criada
          </div>
        </div>
      </CardContent>
    </Card>
  );
};