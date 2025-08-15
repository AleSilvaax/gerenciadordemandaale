import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Package, Plus, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";
import {
  useMaterials,
  useServiceMaterialUsage,
  useAddMaterialUsageToService,
  useUpdateServiceMaterialUsage
} from "@/hooks/useInventory";

interface ServiceMaterialsManagerProps {
  serviceId: string;
  isReadOnly?: boolean;
}

export const ServiceMaterialsManager: React.FC<ServiceMaterialsManagerProps> = ({
  serviceId,
  isReadOnly = false
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState<string | null>(null);
  const [selectedMaterial, setSelectedMaterial] = useState("");
  const [plannedQuantity, setPlannedQuantity] = useState("");
  const [usedQuantity, setUsedQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const { data: materials } = useMaterials();
  const { data: materialUsage, refetch: refetchUsage } = useServiceMaterialUsage(serviceId);
  const addMaterialUsage = useAddMaterialUsageToService();
  const updateMaterialUsage = useUpdateServiceMaterialUsage();

  const handleAddMaterial = async () => {
    if (!selectedMaterial || !plannedQuantity) {
      toast.error("Selecione um material e informe a quantidade planejada");
      return;
    }

    try {
      await addMaterialUsage.mutateAsync({
        serviceId,
        materialId: selectedMaterial,
        plannedQuantity: Number(plannedQuantity),
        usedQuantity: Number(usedQuantity) || 0,
        notes
      });

      setSelectedMaterial("");
      setPlannedQuantity("");
      setUsedQuantity("");
      setNotes("");
      setDialogOpen(false);
      refetchUsage();
      toast.success("Material adicionado à demanda");
    } catch (error) {
      toast.error("Erro ao adicionar material");
    }
  };

  const handleUpdateUsage = async (usageId: string, newUsedQuantity: number, newNotes?: string) => {
    try {
      await updateMaterialUsage.mutateAsync({
        id: usageId,
        usedQuantity: newUsedQuantity,
        notes: newNotes
      });

      setEditingUsage(null);
      refetchUsage();
      toast.success("Uso de material atualizado");
    } catch (error) {
      toast.error("Erro ao atualizar uso do material");
    }
  };

  return (
    <Card className="bg-card/50 backdrop-blur-sm border border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Package className="w-5 h-5" />
            Materiais da Demanda
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
                  <DialogTitle>Adicionar Material à Demanda</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Material</Label>
                    <Select value={selectedMaterial} onValueChange={setSelectedMaterial}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar material" />
                      </SelectTrigger>
                      <SelectContent>
                        {materials?.map((material) => (
                          <SelectItem key={material.id} value={material.id}>
                            {material.name} ({material.unit})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Quantidade Planejada</Label>
                      <Input
                        type="number"
                        value={plannedQuantity}
                        onChange={(e) => setPlannedQuantity(e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Quantidade Usada</Label>
                      <Input
                        type="number"
                        value={usedQuantity}
                        onChange={(e) => setUsedQuantity(e.target.value)}
                        placeholder="0"
                        min="0"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Observações</Label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Observações sobre o uso do material"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleAddMaterial} disabled={addMaterialUsage.isPending}>
                      {addMaterialUsage.isPending ? "Adicionando..." : "Adicionar"}
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
        {materialUsage && materialUsage.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Material</TableHead>
                <TableHead>Planejado</TableHead>
                <TableHead>Usado</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Observações</TableHead>
                {!isReadOnly && <TableHead>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {materialUsage.map((usage) => (
                <TableRow key={usage.id}>
                  <TableCell className="font-medium">
                    {usage.material?.name}
                    <div className="text-sm text-muted-foreground">
                      {usage.material?.unit}
                    </div>
                  </TableCell>
                  <TableCell>{usage.planned_quantity}</TableCell>
                  <TableCell>
                    {editingUsage === usage.id ? (
                      <Input
                        type="number"
                        defaultValue={usage.used_quantity}
                        className="w-20"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            const target = e.target as HTMLInputElement;
                            handleUpdateUsage(usage.id, Number(target.value), usage.notes || undefined);
                          }
                          if (e.key === 'Escape') {
                            setEditingUsage(null);
                          }
                        }}
                      />
                    ) : (
                      usage.used_quantity
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant={usage.is_completed ? "default" : "secondary"}>
                      {usage.is_completed ? "Processado" : "Pendente"}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-xs truncate">
                    {usage.notes || "-"}
                  </TableCell>
                  {!isReadOnly && (
                    <TableCell>
                      <div className="flex gap-1">
                        {editingUsage === usage.id ? (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const input = document.querySelector(`input[defaultValue="${usage.used_quantity}"]`) as HTMLInputElement;
                                if (input) {
                                  handleUpdateUsage(usage.id, Number(input.value), usage.notes || undefined);
                                }
                              }}
                            >
                              <Save className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setEditingUsage(null)}
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setEditingUsage(usage.id)}
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
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
            <p>Nenhum material adicionado a esta demanda</p>
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