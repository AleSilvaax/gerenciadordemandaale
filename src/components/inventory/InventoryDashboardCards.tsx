import React from "react";
import { Package, TrendingDown, DollarSign, Activity } from "lucide-react";
import { InventoryDashboard } from "@/types/inventoryTypes";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCard } from "@/components/ui-custom/StatCard";

interface InventoryDashboardCardsProps {
  dashboard?: InventoryDashboard;
  isLoading: boolean;
}

export const InventoryDashboardCards: React.FC<
  InventoryDashboardCardsProps
> = ({ dashboard, isLoading }) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  const formattedValue = `R$ ${(dashboard?.totalValue || 0).toLocaleString(
    "pt-BR",
    {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }
  )}`;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard
        title="Total de Materiais"
        value={dashboard?.totalMaterials || 0}
        description="Itens no catálogo"
        icon={<Package className="h-4 w-4 text-blue-600" />}
      />

      <StatCard
        title="Estoque Baixo"
        value={dashboard?.lowStockItems || 0}
        description="Precisando reposição"
        icon={<TrendingDown className="h-4 w-4 text-rose-600" />}
      />

      <StatCard
        title="Valor em Estoque"
        value={formattedValue}
        description="Total investido"
        icon={<DollarSign className="h-4 w-4 text-emerald-600" />}
      />

      <StatCard
        title="Movimentações (7d)"
        value={dashboard?.recentMovements || 0}
        description="Nos últimos 7 dias"
        icon={<Activity className="h-4 w-4 text-indigo-600" />}
      />
    </div>
  );
};
