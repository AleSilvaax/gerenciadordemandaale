import React, { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Package, TrendingUp, AlertTriangle, Activity, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useInventory, useInventoryDashboard, useMaterials } from "@/hooks/useInventory";
import { InventoryDashboardCards } from "@/components/inventory/InventoryDashboardCards";
import { MaterialsTable } from "@/components/inventory/MaterialsTable";
import { InventoryTable } from "@/components/inventory/InventoryTable";
import { MovementsTable } from "@/components/inventory/MovementsTable";
import { MaterialDialog } from "@/components/inventory/MaterialDialog";
import { MovementDialog } from "@/components/inventory/MovementDialog";
import { CategoryDialog } from "@/components/inventory/CategoryDialog";

const Inventory: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);

  const { data: dashboard, isLoading: dashboardLoading } = useInventoryDashboard();
  const { data: materials, isLoading: materialsLoading } = useMaterials();
  const { data: inventory, isLoading: inventoryLoading } = useInventory();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 p-6">
      <div className="container mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Controle de Estoque
            </h1>
            <p className="text-muted-foreground mt-2">
              Gerencie materiais, estoque e movimentações
            </p>
          </div>
          <div className="flex gap-2">
            <Button 
              onClick={() => setCategoryDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Categoria
            </Button>
            <Button 
              onClick={() => setMaterialDialogOpen(true)}
              variant="outline"
              size="sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              Material
            </Button>
            <Button onClick={() => setMovementDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Movimentação
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Materiais
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Estoque
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Movimentações
            </TabsTrigger>
          </TabsList>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <InventoryDashboardCards 
              dashboard={dashboard} 
              isLoading={dashboardLoading} 
            />
            
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Ações Rápidas</CardTitle>
                <CardDescription>
                  Acesso rápido às principais funcionalidades
                </CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setMaterialDialogOpen(true)}
                >
                  <Package className="h-6 w-6" />
                  Novo Material
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setMovementDialogOpen(true)}
                >
                  <TrendingUp className="h-6 w-6" />
                  Entrada/Saída
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex flex-col gap-2"
                  onClick={() => setSelectedTab("inventory")}
                >
                  <AlertTriangle className="h-6 w-6" />
                  Ver Estoque
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Materials Tab */}
          <TabsContent value="materials" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar materiais..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setMaterialDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Material
              </Button>
            </div>

            <MaterialsTable 
              materials={materials || []}
              isLoading={materialsLoading}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* Inventory Tab */}
          <TabsContent value="inventory" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar no estoque..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setMovementDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </div>

            <InventoryTable 
              inventory={inventory || []}
              isLoading={inventoryLoading}
              searchTerm={searchTerm}
            />
          </TabsContent>

          {/* Movements Tab */}
          <TabsContent value="movements" className="space-y-6">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2 flex-1 max-w-sm">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar movimentações..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Button onClick={() => setMovementDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Movimentação
              </Button>
            </div>

            <MovementsTable searchTerm={searchTerm} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Dialogs */}
      <MaterialDialog 
        open={materialDialogOpen} 
        onClose={() => setMaterialDialogOpen(false)} 
      />
      <MovementDialog 
        open={movementDialogOpen} 
        onClose={() => setMovementDialogOpen(false)} 
      />
      <CategoryDialog 
        open={categoryDialogOpen} 
        onClose={() => setCategoryDialogOpen(false)} 
      />
    </div>
  );
};

export default Inventory;