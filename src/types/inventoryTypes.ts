// Tipos para o sistema de materiais e estoque

export interface MaterialCategory {
  id: string;
  name: string;
  description?: string;
  color: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
}

export interface Material {
  id: string;
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  category_id?: string;
  min_stock: number;
  max_stock: number;
  cost_per_unit: number;
  supplier?: string;
  barcode?: string;
  location?: string;
  is_active: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
  category?: MaterialCategory;
}

export interface Inventory {
  id: string;
  material_id: string;
  current_stock: number;
  reserved_stock: number;
  available_stock: number;
  last_movement_at: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  material?: Material;
}

export interface InventoryMovement {
  id: string;
  material_id: string;
  movement_type: 'entrada' | 'saida' | 'ajuste' | 'transferencia' | 'reserva' | 'liberacao';
  quantity: number;
  previous_stock: number;
  new_stock: number;
  reference_id?: string;
  reference_type?: string;
  notes?: string;
  cost_per_unit?: number;
  total_cost?: number;
  created_by: string;
  organization_id: string;
  created_at: string;
  material?: Material;
}

export interface ServiceTypeMaterial {
  id: string;
  service_type_id: string;
  material_id: string;
  default_quantity: number;
  is_required: boolean;
  organization_id: string;
  created_at: string;
  updated_at: string;
  material?: Material;
}

export interface ServiceMaterialUsage {
  id: string;
  service_id: string;
  material_id: string;
  planned_quantity: number;
  used_quantity: number;
  is_completed: boolean;
  notes?: string;
  organization_id: string;
  created_at: string;
  updated_at: string;
  material?: Material;
}

export interface InventoryDashboard {
  totalMaterials: number;
  lowStockItems: number;
  totalValue: number;
  recentMovements: number;
  topUsedMaterials: Array<{
    material: Material;
    usage_count: number;
  }>;
  stockAlerts: Array<{
    material: Material;
    current_stock: number;
    min_stock: number;
  }>;
}

export interface MaterialFormData {
  name: string;
  description?: string;
  sku?: string;
  unit: string;
  category_id?: string;
  min_stock: number;
  max_stock: number;
  cost_per_unit: number;
  supplier?: string;
  barcode?: string;
  location?: string;
  is_active: boolean;
}

export interface MovementFormData {
  material_id: string;
  movement_type: 'entrada' | 'saida' | 'ajuste';
  quantity: number;
  notes?: string;
  cost_per_unit?: number;
}

export interface CategoryFormData {
  name: string;
  description?: string;
  color: string;
}