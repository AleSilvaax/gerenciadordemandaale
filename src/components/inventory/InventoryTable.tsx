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
import { TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";
import { Inventory } from "@/types/inventoryTypes";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryTableProps {
  inventory: Inventory[];
  isLoading: boolean;
  searchTerm: string;
}

export const InventoryTable: React.FC<InventoryTableProps> = ({
  inventory,
  isLoading,
  searchTerm
}) => {
  const filteredInventory = useMemo(() => {
    return inventory.filter(item =>
      item.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.material?.sku?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [inventory, searchTerm]);

  const getStockStatus = (item: Inventory) => {
    if (!item.material) return 'normal';
    
    if (item.current_stock <= 0) return 'out';
    if (item.current_stock <= item.material.min_stock) return 'low';
    if (item.current_stock >= item.material.max_stock) return 'high';
    return 'normal';
  };

  const getStockBadge = (status: string) => {
    switch (status) {
      case 'out':
        return <Badge variant="destructive">Esgotado</Badge>;
      case 'low':
        return <Badge variant="secondary" className="text-orange-600 border-orange-300">Baixo</Badge>;
      case 'high':
        return <Badge variant="secondary" className="text-blue-600 border-blue-300">Alto</Badge>;
      default:
        return <Badge variant="default">Normal</Badge>;
    }
  };

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
              <TableHead>Estoque Atual</TableHead>
              <TableHead>Estoque Reservado</TableHead>
              <TableHead>Disponível</TableHead>
              <TableHead>Estoque Mín.</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Última Movimentação</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredInventory.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhum item encontrado no estoque' : 'Estoque vazio'}
                </TableCell>
              </TableRow>
            ) : (
              filteredInventory.map((item) => {
                const status = getStockStatus(item);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {status === 'low' && <AlertTriangle className="h-4 w-4 text-orange-500" />}
                        {status === 'out' && <AlertTriangle className="h-4 w-4 text-red-500" />}
                        <div>
                          <div className="font-medium">{item.material?.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {item.material?.unit}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        {item.current_stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">
                        {item.reserved_stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono font-medium">
                        {item.available_stock}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-mono text-muted-foreground">
                        {item.material?.min_stock || 0}
                      </span>
                    </TableCell>
                    <TableCell>
                      {getStockBadge(status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-muted-foreground">
                        {new Date(item.last_movement_at).toLocaleDateString('pt-BR')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" title="Entrada">
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        </Button>
                        <Button variant="ghost" size="sm" title="Saída">
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};