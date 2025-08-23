import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
import { Material } from "@/types/inventoryTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { useUpdateMaterial, useDeleteMaterial } from "@/hooks/useInventory";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface MaterialsTableProps {
  materials: Material[];
  isLoading: boolean;
  searchTerm: string;
  onEditMaterial: (material: Material) => void;
}

export const MaterialsTable: React.FC<MaterialsTableProps> = ({
  materials,
  isLoading,
  searchTerm,
  onEditMaterial
}) => {
  const { toast } = useToast();
  const deleteMaterial = useDeleteMaterial();
  const { user } = useAuth();

  // Check if user can edit/delete materials
  const canManageMaterials = user?.role && ['administrador', 'gestor', 'owner', 'super_admin'].includes(user.role);

  const handleDelete = async (materialId: string, materialName: string) => {
    if (confirm(`Tem certeza que deseja excluir o material "${materialName}"?`)) {
      try {
        await deleteMaterial.mutateAsync(materialId);
        toast({
          title: "Material excluído",
          description: `O material "${materialName}" foi excluído com sucesso.`
        });
      } catch (error) {
        toast({
          title: "Erro",
          description: "Erro ao excluir material.",
          variant: "destructive"
        });
      }
    }
  };
  const filteredMaterials = useMemo(() => {
    return materials.filter(material =>
      material.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [materials, searchTerm]);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-[200px]" />
                  <Skeleton className="h-4 w-[150px]" />
                </div>
                <Skeleton className="h-8 w-[80px]" />
                <Skeleton className="h-8 w-[100px]" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Material</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead>Unidade</TableHead>
              <TableHead>Custo Unit.</TableHead>
              <TableHead>Estoque Mín.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMaterials.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum material encontrado' : 'Nenhum material cadastrado'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMaterials.map((material) => (
                <TableRow key={material.id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{material.name}</div>
                      {material.description && (
                        <div className="text-sm text-muted-foreground">
                          {material.description}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <code className="text-xs bg-muted px-2 py-1 rounded">
                      {material.sku || '-'}
                    </code>
                  </TableCell>
                  <TableCell>
                    {material.category ? (
                      <Badge 
                        variant="outline" 
                        style={{ borderColor: material.category.color }}
                      >
                        {material.category.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{material.unit}</TableCell>
                  <TableCell>
                    R$ {material.cost_per_unit.toFixed(2)}
                  </TableCell>
                  <TableCell>{material.min_stock}</TableCell>
                  <TableCell>
                    <Badge variant={material.is_active ? "default" : "secondary"}>
                      {material.is_active ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {canManageMaterials ? (
                        <>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => onEditMaterial(material)}
                            title="Editar material"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleDelete(material.id, material.name)}
                            title="Excluir material"
                            disabled={deleteMaterial.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2 py-1">
                          Somente leitura
                        </span>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};