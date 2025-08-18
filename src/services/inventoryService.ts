import { supabase } from "@/integrations/supabase/client";
import { 
  MaterialCategory, 
  Material, 
  Inventory, 
  InventoryMovement, 
  ServiceTypeMaterial,
  ServiceMaterialUsage,
  InventoryDashboard,
  MaterialFormData,
  MovementFormData,
  CategoryFormData
} from "@/types/inventoryTypes";

// Serviços para Categorias de Materiais
export const getMaterialCategories = async (): Promise<MaterialCategory[]> => {
  const { data, error } = await supabase
    .from('material_categories')
    .select('*')
    .order('name');

  if (error) throw error;
  return data || [];
};

export const createMaterialCategory = async (category: CategoryFormData): Promise<MaterialCategory> => {
  const { data, error } = await supabase
    .from('material_categories')
    .insert(category)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateMaterialCategory = async (id: string, category: Partial<CategoryFormData>): Promise<MaterialCategory> => {
  const { data, error } = await supabase
    .from('material_categories')
    .update({ ...category, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteMaterialCategory = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('material_categories')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Serviços para Materiais
export const getMaterials = async (): Promise<Material[]> => {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      category:material_categories(*)
    `)
    .eq('is_active', true)
    .order('name');

  if (error) throw error;
  return data || [];
};

export const getMaterialById = async (id: string): Promise<Material | null> => {
  const { data, error } = await supabase
    .from('materials')
    .select(`
      *,
      category:material_categories(*)
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
};

export const createMaterial = async (material: MaterialFormData): Promise<Material> => {
  // Criar o material
  const { data: createdMaterial, error: materialError } = await supabase
    .from('materials')
    .insert({
      ...material,
      category_id: material.category_id || null
    })
    .select(`
      *,
      category:material_categories(*)
    `)
    .single();

  if (materialError) throw materialError;

  // Criar registro inicial no estoque com valor 0
  const { error: inventoryError } = await supabase
    .from('inventory')
    .insert([{
      material_id: createdMaterial.id,
      current_stock: 0,
      reserved_stock: 0,
      available_stock: 0
    }]);

  if (inventoryError) {
    console.warn('Erro ao criar registro inicial no estoque:', inventoryError);
  }

  return createdMaterial;
};

export const updateMaterial = async (id: string, material: Partial<MaterialFormData>): Promise<Material> => {
  const { data, error } = await supabase
    .from('materials')
    .update({ ...material, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select(`
      *,
      category:material_categories(*)
    `)
    .single();

  if (error) throw error;
  return data;
};

export const deleteMaterial = async (id: string): Promise<void> => {
  const { data, error } = await supabase
    .from('materials')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
};

// Serviços para Estoque
export const getInventory = async (): Promise<Inventory[]> => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .order('current_stock', { ascending: true });

  if (error) throw error;
  return data || [];
};

export const getInventoryByMaterial = async (materialId: string): Promise<Inventory | null> => {
  const { data, error } = await supabase
    .from('inventory')
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .eq('material_id', materialId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Não encontrado
    throw error;
  }
  return data;
};

// Serviços para Movimentações
export const getInventoryMovements = async (materialId?: string): Promise<InventoryMovement[]> => {
  let query = supabase
    .from('inventory_movements')
    .select(`
      *,
      material:materials(name, unit)
    `)
    .order('created_at', { ascending: false });

  if (materialId) {
    query = query.eq('material_id', materialId);
  }

  const { data, error } = await query.limit(100);

  if (error) throw error;
  return (data || []) as InventoryMovement[];
};

export const createInventoryMovement = async (movement: MovementFormData): Promise<string> => {
  try {
    // Tentar usar a função RPC primeiro
    const { data, error } = await supabase.rpc('create_inventory_movement', {
      p_material_id: movement.material_id,
      p_movement_type: movement.movement_type,
      p_quantity: movement.quantity,
      p_notes: movement.notes || null,
      p_cost_per_unit: movement.cost_per_unit || 0
    });

    if (error) {
      console.error('Erro na função RPC:', error);
      throw error;
    }
    
    return data;
  } catch (rpcError) {
    console.warn('RPC falhou, tentando fallback manual:', rpcError);
    
    // Fallback: fazer manualmente se RPC falhar
    // 1. Buscar estoque atual
    const { data: currentInventory } = await supabase
      .from('inventory')
      .select('current_stock')
      .eq('material_id', movement.material_id)
      .single();
    
    const currentStock = currentInventory?.current_stock || 0;
    
    // 2. Calcular novo estoque
    let newStock: number;
    switch (movement.movement_type) {
      case 'entrada':
        newStock = currentStock + movement.quantity;
        break;
      case 'saida':
        newStock = currentStock - movement.quantity;
        break;
      case 'ajuste':
        newStock = movement.quantity;
        break;
      default:
        newStock = currentStock;
    }
    
    // 3. Validar estoque negativo
    if (newStock < 0) {
      throw new Error(`Estoque insuficiente. Atual: ${currentStock}, Tentativa: ${movement.quantity}`);
    }
    
    // 4. Inserir movimentação
    const { data: movementData, error: movementError } = await supabase
      .from('inventory_movements')
      .insert({
        material_id: movement.material_id,
        movement_type: movement.movement_type,
        quantity: movement.quantity,
        previous_stock: currentStock,
        new_stock: newStock,
        notes: movement.notes,
        cost_per_unit: movement.cost_per_unit || 0,
        total_cost: (movement.cost_per_unit || 0) * movement.quantity
      })
      .select('id')
      .single();
    
    if (movementError) throw movementError;
    
    // 5. Atualizar estoque
    const { error: updateError } = await supabase
      .from('inventory')
      .upsert({
        material_id: movement.material_id,
        current_stock: newStock,
        available_stock: newStock,
        last_movement_at: new Date().toISOString()
      });
    
    if (updateError) throw updateError;
    
    return movementData.id;
  }
};

// Serviços para Materiais de Tipos de Serviço
export const getServiceTypeMaterials = async (serviceTypeId: string): Promise<ServiceTypeMaterial[]> => {
  const { data, error } = await supabase
    .from('service_type_materials')
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .eq('service_type_id', serviceTypeId)
    .order('is_required', { ascending: false });

  if (error) throw error;
  return data || [];
};

export const addMaterialToServiceType = async (
  serviceTypeId: string, 
  materialId: string, 
  defaultQuantity: number, 
  isRequired: boolean = false
): Promise<ServiceTypeMaterial> => {
  const { data, error } = await supabase
    .from('service_type_materials')
    .insert({
      service_type_id: serviceTypeId,
      material_id: materialId,
      default_quantity: defaultQuantity,
      is_required: isRequired
    })
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceTypeMaterial = async (
  id: string,
  defaultQuantity: number,
  isRequired: boolean
): Promise<ServiceTypeMaterial> => {
  const { data, error } = await supabase
    .from('service_type_materials')
    .update({
      default_quantity: defaultQuantity,
      is_required: isRequired,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

export const removeMaterialFromServiceType = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('service_type_materials')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

// Serviços para Uso de Materiais em Demandas
export const getServiceMaterialUsage = async (serviceId: string): Promise<ServiceMaterialUsage[]> => {
  const { data, error } = await supabase
    .from('service_material_usage')
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .eq('service_id', serviceId)
    .order('created_at');

  if (error) throw error;
  return data || [];
};

export const addMaterialUsageToService = async (
  serviceId: string,
  materialId: string,
  plannedQuantity: number,
  usedQuantity: number = 0,
  notes?: string
): Promise<ServiceMaterialUsage> => {
  const { data, error } = await supabase
    .from('service_material_usage')
    .insert({
      service_id: serviceId,
      material_id: materialId,
      planned_quantity: plannedQuantity,
      used_quantity: usedQuantity,
      notes
    })
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

export const updateServiceMaterialUsage = async (
  id: string,
  usedQuantity: number,
  notes?: string
): Promise<ServiceMaterialUsage> => {
  const { data, error } = await supabase
    .from('service_material_usage')
    .update({
      used_quantity: usedQuantity,
      notes,
      updated_at: new Date().toISOString()
    })
    .eq('id', id)
    .select(`
      *,
      material:materials(
        *,
        category:material_categories(*)
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

// Dashboard de Estoque
export const getInventoryDashboard = async (): Promise<InventoryDashboard> => {
  try {
    // Total de materiais
    const { count: totalMaterials } = await supabase
      .from('materials')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Itens com estoque baixo
    const { data: lowStockData } = await supabase
      .from('inventory')
      .select(`
        id,
        current_stock,
        material:materials!inner(min_stock)
      `)
      .gt('material.min_stock', 0);

    const lowStockItems = lowStockData?.filter(item => 
      item.current_stock <= (item.material as any)?.min_stock
    )?.length || 0;

    // Valor total do estoque
    const { data: inventoryValue } = await supabase
      .from('inventory')
      .select(`
        current_stock,
        material:materials!inner(cost_per_unit)
      `);

    const totalValue = inventoryValue?.reduce((sum, item) => 
      sum + (item.current_stock * ((item.material as any)?.cost_per_unit || 0)), 0
    ) || 0;

    // Movimentações recentes (últimos 7 dias)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentMovements } = await supabase
      .from('inventory_movements')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo.toISOString());

    return {
      totalMaterials: totalMaterials || 0,
      lowStockItems,
      totalValue,
      recentMovements: recentMovements || 0,
      topUsedMaterials: [], // Implementar se necessário
      stockAlerts: [] // Implementar se necessário
    };
  } catch (error) {
    console.error('Erro ao buscar dashboard:', error);
    return {
      totalMaterials: 0,
      lowStockItems: 0,
      totalValue: 0,
      recentMovements: 0,
      topUsedMaterials: [],
      stockAlerts: []
    };
  }
};