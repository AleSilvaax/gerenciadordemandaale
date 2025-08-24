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
import { Material } from "@/types/inventoryTypes";
import { MobileOptimizedLayout } from "@/components/layout/MobileOptimizedLayout";
import { useIsMobile } from "@/hooks/use-mobile";

const Inventory: React.FC = () => {
  const [selectedTab, setSelectedTab] = useState("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  const [materialDialogOpen, setMaterialDialogOpen] = useState(false);
  const [movementDialogOpen, setMovementDialogOpen] = useState(false);
  const [categoryDialogOpen, setCategoryDialogOpen] = useState(false);
  const [editingMaterial, setEditingMaterial] = useState<Material | null>(null);

  const { data: dashboardData, isLoading: isDashboardLoading } = useInventoryDashboard();
  const { data: materials, isLoading: isMaterialsLoading } = useMaterials();
  const { data: inventory, isLoading: isInventoryLoading } = useInventory();
  const isMobile = useIsMobile();

  const handleEditMaterial = (material: Material) => {
    setEditingMaterial(material);
    setMaterialDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setMaterialDialogOpen(false);
    setEditingMaterial(null);
  };

  const content = (
    <div className="space-y-6">
      {/* Header - Desktop only, mobile uses MobileOptimizedLayout title */}
      {!isMobile && (
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
      )}

      {/* Mobile Action Buttons */}
      {isMobile && (
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button 
            onClick={() => setCategoryDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Categoria
          </Button>
          <Button 
            onClick={() => setMaterialDialogOpen(true)}
            variant="outline"
            size="sm"
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Material
          </Button>
          <Button 
            onClick={() => setMovementDialogOpen(true)}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4 mr-2" />
            Movimentação
          </Button>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab}>
        <div className="overflow-x-auto">
          <TabsList className="grid w-full min-w-[400px] grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center gap-2 text-xs sm:text-sm">
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Dashboard</span>
              <span className="sm:hidden">Dash</span>
            </TabsTrigger>
            <TabsTrigger value="materials" className="flex items-center gap-2 text-xs sm:text-sm">
              <Package className="h-4 w-4" />
              <span className="hidden sm:inline">Materiais</span>
              <span className="sm:hidden">Mat</span>
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center gap-2 text-xs sm:text-sm">
              <AlertTriangle className="h-4 w-4" />
              <span className="hidden sm:inline">Estoque</span>
              <span className="sm:hidden">Est</span>
            </TabsTrigger>
            <TabsTrigger value="movements" className="flex items-center gap-2 text-xs sm:text-sm">
              <Activity className="h-4 w-4" />
              <span className="hidden sm:inline">Movimentações</span>
              <span className="sm:hidden">Mov</span>
            </TabsTrigger>
          </TabsList>
        </div>

          {/* Dashboard Tab */}
          <TabsContent value="dashboard" className="space-y-6">
            <InventoryDashboardCards 
              dashboard={dashboardData} 
              isLoading={isDashboardLoading} 
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
        <TabsContent value="materials" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Pesquisar materiais..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => setMaterialDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Novo Material
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <MaterialsTable 
                materials={materials || []}
                isLoading={isMaterialsLoading}
                searchTerm={searchTerm}
                onEditMaterial={handleEditMaterial}
              />
            </div>
          </div>
        </TabsContent>

        {/* Inventory Tab */}
        <TabsContent value="inventory" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Pesquisar no estoque..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => setMovementDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <InventoryTable 
                inventory={inventory || []}
                isLoading={isInventoryLoading}
                searchTerm={searchTerm}
              />
            </div>
          </div>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex items-center space-x-2 flex-1 w-full sm:max-w-sm">
              <Search className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Pesquisar movimentações..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Button 
              onClick={() => setMovementDialogOpen(true)}
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nova Movimentação
            </Button>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[900px]">
              <MovementsTable searchTerm={searchTerm} />
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );

  return (
    <MobileOptimizedLayout
      title="Controle de Estoque"
      subtitle="Gerencie materiais, estoque e movimentações"
    >
      <div className={isMobile ? "" : "min-h-screen bg-gradient-to-br from-background to-muted/20 p-6"}>
        <div className={isMobile ? "" : "container mx-auto space-y-8"}>
          {content}
        </div>
      </div>

      {/* Dialogs */}
      <MaterialDialog
        open={materialDialogOpen}
        onClose={handleCloseDialog}
        editingMaterial={editingMaterial}
      />
      <MovementDialog 
        open={movementDialogOpen} 
        onClose={() => setMovementDialogOpen(false)} 
      />
      <CategoryDialog 
        open={categoryDialogOpen} 
        onClose={() => setCategoryDialogOpen(false)} 
      />
    </MobileOptimizedLayout>
  );
};

export default Inventory;