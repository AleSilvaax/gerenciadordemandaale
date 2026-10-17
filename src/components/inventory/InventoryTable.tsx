import React, { useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle } from "lucide-react";
import { Inventory } from "@/types/inventoryTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { useMaterials } from "@/hooks/useInventory";

interface InventoryTableProps {
  inventory: Inventory[];
  isLoading: boolean;
  searchTerm: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  isLoading,
  searchTerm,
}) => {
  const { data: materials, isLoading: loadingMaterials } = useMaterials();

  // Mescla todos os materiais cadastrados com suas posições de estoque
  const mergedInventory = useMemo(() => {
    const invMap = new Map<string, Inventory>();
    (inventory || []).forEach((item) => {
      invMap.set(item.material_id, item);
    });

    if (materials && materials.length > 0) {
      return materials.map((mat) => {
        const existing = invMap.get(mat.id);
        if (existing) {
          return { ...existing, material: existing.material || mat };
        }
        return {
          id: `virtual-${mat.id}`,
          material_id: mat.id,
          organization_id: mat.organization_id,
          current_stock: 0,
          reserved_stock: 0,
          available_stock: 0,
          last_movement_at: mat.created_at || new Date().toISOString(),
          updated_at: mat.updated_at || new Date().toISOString(),
          material: mat,
        } as Inventory;
      });
    }

    return inventory || [];
  }, [inventory, materials]);

  const filteredInventory = useMemo(() => {
    return mergedInventory.filter(
      (item) =>
        item.material?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.material?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [mergedInventory, searchTerm]);

  const getStockStatus = (item: Inventory) => {
    if (!item.material) return "normal";
    if (item.current_stock <= 0) return "out";
    if (item.current_stock <= (item.material.min_stock || 0)) return "low";
    if (item.material.max_stock && item.current_stock >= item.material.max_stock)
      return "high";
    return "normal";
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case "out":
        return (
          <Badge variant="outline" className="bg-rose-50 text-rose-700 border-rose-200">
            Sem Estoque
          </Badge>
        );
      case "low":
        return (
          <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
            Estoque Baixo
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">
            Normal
          </Badge>
        );
    }
  };

  if (isLoading || loadingMaterials) {
    return (
      <div className="space-y-2">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-12 w-full rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <Card className="border border-slate-200/80 shadow-2xs rounded-xl overflow-hidden bg-white dark:bg-slate-900">
      <Table>
        <TableHeader className="bg-slate-50/80">
          <TableRow>
            <TableHead className="text-xs font-semibold uppercase">Material</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-right">Atual</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-right">Reservado</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-right">Disponível</TableHead>
            <TableHead className="text-xs font-semibold uppercase text-right">Mín.</TableHead>
            <TableHead className="text-xs font-semibold uppercase">Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredInventory.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="text-center py-8 text-sm text-slate-500">
                {searchTerm
                  ? "Nenhum material encontrado para esta busca."
                  : "Nenhum material cadastrado."}
              </TableCell>
            </TableRow>
          ) : (
            filteredInventory.map((item) => {
              const status = getStockStatus(item);
              return (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(status === "low" || status === "out") && (
                        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-slate-900 dark:text-white">
                          {item.material?.name}
                        </p>
                        <p className="text-xs text-slate-500 font-mono">
                          {item.material?.sku || item.material?.unit}
                        </p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold">
                    {item.current_stock} {item.material?.unit}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-500">
                    {item.reserved_stock}
                  </TableCell>
                  <TableCell className="text-right font-mono font-semibold text-blue-600">
                    {item.available_stock ?? item.current_stock - item.reserved_stock}
                  </TableCell>
                  <TableCell className="text-right font-mono text-slate-500">
                    {item.material?.min_stock || 0}
                  </TableCell>
                  <TableCell>{getStockBadge(status)}</TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </Card>
  );
};
