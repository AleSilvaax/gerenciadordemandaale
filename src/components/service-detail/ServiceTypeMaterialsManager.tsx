import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Package, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useMaterials,
  useServiceTypeMaterials,
  useAddMaterialToServiceType,
  useUpdateServiceTypeMaterial,
  useRemoveMaterialFromServiceType
} from "@/hooks/useInventory";

interface ServiceTypeMaterialsManagerProps {
  serviceTypeId: string;
  isReadOnly?: boolean;
}

export const ServiceTypeMaterialsManager: React.FC<ServiceTypeMaterialsManagerProps> = ({
  serviceTypeId,
  isReadOnly = false
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [defaultQuantity, setDefaultQuantity] = useState("");
  const [isRequired, setIsRequired] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<string | null>(null);

  const { data: materials } = useMaterials();
  const { data: serviceTypeMaterials, refetch: refetchServiceTypeMaterials } = useServiceTypeMaterials(serviceTypeId);
  const addMaterialToServiceType = useAddMaterialToServiceType();
  const updateServiceTypeMaterial = useUpdateServiceTypeMaterial();
  const removeMaterialFromServiceType = useRemoveMaterialFromServiceType();

  const handleAddMaterial = async () => {
    if (!selectedMaterial || !defaultQuantity) {
      toast.error("Selecione um material e informe a quantidade padrão");
      return;
    }

    try {
      await addMaterialToServiceType.mutateAsync({
        serviceTypeId,
        materialId: selectedMaterial,
        defaultQuantity: Number(defaultQuantity),
        isRequired
      });

      setSelectedMaterial("");
      setDefaultQuantity("");
      setIsRequired(false);
      setDialogOpen(false);
      refetchServiceTypeMaterials();
      toast.success("Material adicionado ao tipo de serviço");
    } catch (error) {
      toast.error("Erro ao adicionar material");
    }
  };

  const handleUpdateMaterial = async (materialId: string, newQuantity: number, newRequired: boolean) => {
    try {
      await updateServiceTypeMaterial.mutateAsync({
        id: materialId,
        defaultQuantity: newQuantity,
        isRequired: newRequired
      });

      setEditingMaterial(null);
      refetchServiceTypeMaterials();
      toast.success("Material atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar material");
    }
  };

  const handleRemoveMaterial = async (materialId: string) => {
    if (!confirm("Tem certeza que deseja remover este material do tipo de serviço?")) {
      return;
    }

    try {
      await removeMaterialFromServiceType.mutateAsync(materialId);
      refetchServiceTypeMaterials();
      toast.success("Material removido do tipo de serviço");
    } catch (error) {
      toast.error("Erro ao remover material");
    }
  };

  // Filtrar materiais já adicionados
  const availableMaterials = materials?.filter(
    material => !serviceTypeMaterials?.some(stm => stm.material_id === material.id)
  );

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Materiais do Tipo de Serviço
          </CardTitle>
          {!isReadOnly && (
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Material
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Adicionar Material ao Tipo de Serviço</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableMaterials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Quantidade Padrão</Label>
                    <Input
                      type="number"
                      value={defaultQuantity}
                      onChange={(e) => setDefaultQuantity(e.target.value)}
                      placeholder="0"
                      min="0"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      id="required"
                      checked={isRequired}
                      onCheckedChange={setIsRequired}
                    />
                    <Label htmlFor="required">Material obrigatório</Label>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddMaterial} disabled={addMaterialToServiceType.isPending}>
                      {addMaterialToServiceType.isPending ? "Adicionando..." : "Adicionar"}
                    </Button>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {serviceTypeMaterials && serviceTypeMaterials.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Quantidade Padrão</TableHead>
                <TableHead>Obrigatório</TableHead>
                {!isReadOnly && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {serviceTypeMaterials.map((serviceTypeMaterial) => (
                <TableRow key={serviceTypeMaterial.id}>
                  <TableCell className="font-medium">
                    {serviceTypeMaterial.material?.name}
                    <div className="text-sm text-muted-foreground">
                      {serviceTypeMaterial.material?.unit}
                    </div>
                  </TableCell>
                  <TableCell>
                    {editingMaterial === serviceTypeMaterial.id ? (
                      <Input
                        type="number"
                        defaultValue={serviceTypeMaterial.default_quantity}
                        className="w-20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            handleUpdateMaterial(
                              serviceTypeMaterial.id,
                              Number(target.value),
                              serviceTypeMaterial.is_required
                            );
                          }
                          if (e.key === 'Escape') {
                            setEditingMaterial(null);
                          }
                        }}
                      />
                    ) : (
                      serviceTypeMaterial.default_quantity
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={serviceTypeMaterial.is_required ? "destructive" : "secondary"}>
                      {serviceTypeMaterial.is_required ? "Obrigatório" : "Opcional"}
                    </Badge>
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <div className="flex gap-1">
                        {editingMaterial === serviceTypeMaterial.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const input = document.querySelector(`input[defaultValue="${serviceTypeMaterial.default_quantity}"]`) as HTMLInputElement;
                                if (input) {
                                  handleUpdateMaterial(
                                    serviceTypeMaterial.id,
                                    Number(input.value),
                                    serviceTypeMaterial.is_required
                                  );
                                }
                              }}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMaterial(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingMaterial(serviceTypeMaterial.id)}
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveMaterial(serviceTypeMaterial.id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhum material configurado para este tipo de serviço</p>
            {!isReadOnly && (
              <p className="text-sm">
                Clique em "Adicionar Material" para começar
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};