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
import { TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { useInventoryMovements } from "@/hooks/useInventory";
import { Skeleton } from "@/components/ui/skeleton";

interface MovementsTableProps {
  searchTerm: string;
}

export const MovementsTable: React.FC<MovementsTableProps> = ({
  searchTerm
}) => {
  const { data: movements, isLoading } = useInventoryMovements();

  const filteredMovements = useMemo(() => {
    if (!movements) return [];
    
    return movements.filter(movement =>
      movement.material?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.movement_type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      movement.notes?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [movements, searchTerm]);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'entrada':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'saida':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      case 'ajuste':
        return <RotateCcw className="h-4 w-4 text-blue-600" />;
      default:
        return <RotateCcw className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getMovementBadge = (type: string) => {
    const variants: Record<string, { variant: any; color: string }> = {
      entrada: { variant: "default", color: "bg-green-100 text-green-800 border-green-300" },
      saida: { variant: "destructive", color: "" },
      ajuste: { variant: "secondary", color: "bg-blue-100 text-blue-800 border-blue-300" },
      transferencia: { variant: "outline", color: "" },
      reserva: { variant: "secondary", color: "" },
      liberacao: { variant: "outline", color: "" }
    };

    const config = variants[type] || variants.ajuste;
    
    return (
      <Badge variant={config.variant} className={config.color}>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </Badge>
    );
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
              <TableHead>Data/Hora</TableHead>
              <TableHead>Material</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Estoque Anterior</TableHead>
              <TableHead>Novo Estoque</TableHead>
              <TableHead>Custo Total</TableHead>
              <TableHead>Observações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredMovements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  {searchTerm ? 'Nenhuma movimentação encontrada' : 'Nenhuma movimentação registrada'}
                </TableCell>
              </TableRow>
            ) : (
              filteredMovements.map((movement) => (
                <TableRow key={movement.id}>
                  <TableCell>
                    <div className="text-sm">
                      <div>{new Date(movement.created_at).toLocaleDateString('pt-BR')}</div>
                      <div className="text-muted-foreground">
                        {new Date(movement.created_at).toLocaleTimeString('pt-BR', {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {getMovementIcon(movement.movement_type)}
                      <div>
                        <div className="font-medium">{movement.material?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {movement.material?.unit}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getMovementBadge(movement.movement_type)}
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium">
                      {movement.movement_type === 'saida' ? '-' : '+'}
                      {Math.abs(movement.quantity)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono text-muted-foreground">
                      {movement.previous_stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="font-mono font-medium">
                      {movement.new_stock}
                    </span>
                  </TableCell>
                  <TableCell>
                    {movement.total_cost ? (
                      <span className="font-mono">
                        R$ {movement.total_cost.toFixed(2)}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {movement.notes || '-'}
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