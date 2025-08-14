import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingDown, DollarSign, Activity } from "lucide-react";
import { InventoryDashboard } from "@/types/inventoryTypes";
import { Skeleton } from "@/components/ui/skeleton";

interface InventoryDashboardCardsProps {
  dashboard?: InventoryDashboard;
  isLoading: boolean;
}

export const InventoryDashboardCards: React.FC<InventoryDashboardCardsProps> = ({ 
  dashboard, 
  isLoading 
}) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-4" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-[60px] mb-2" />
              <Skeleton className="h-3 w-[120px]" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {/* Total de Materiais */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total de Materiais</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard?.totalMaterials || 0}</div>
          <p className="text-xs text-muted-foreground">
            materiais cadastrados
          </p>
        </CardContent>
      </Card>

      {/* Estoque Baixo */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Estoque Baixo</CardTitle>
          <TrendingDown className="h-4 w-4 text-destructive" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-destructive">
            {dashboard?.lowStockItems || 0}
          </div>
          <p className="text-xs text-muted-foreground">
            itens precisando reposição
          </p>
        </CardContent>
      </Card>

      {/* Valor Total do Estoque */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Valor do Estoque</CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            R$ {(dashboard?.totalValue || 0).toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}
          </div>
          <p className="text-xs text-muted-foreground">
            valor total investido
          </p>
        </CardContent>
      </Card>

      {/* Movimentações Recentes */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Movimentações (7d)</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{dashboard?.recentMovements || 0}</div>
          <p className="text-xs text-muted-foreground">
            últimos 7 dias
          </p>
        </CardContent>
      </Card>
    </div>
  );
};