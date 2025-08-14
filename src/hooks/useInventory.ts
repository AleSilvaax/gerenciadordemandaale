import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getMaterials,
  getMaterialCategories,
  getInventory,
  getInventoryMovements,
  getInventoryDashboard,
  createMaterial,
  updateMaterial,
  deleteMaterial,
  createMaterialCategory,
  updateMaterialCategory,
  deleteMaterialCategory,
  createInventoryMovement,
  getServiceTypeMaterials,
  addMaterialToServiceType,
  updateServiceTypeMaterial,
  removeMaterialFromServiceType,
  getServiceMaterialUsage,
  addMaterialUsageToService,
  updateServiceMaterialUsage
} from '@/services/inventoryService';
import { toast } from '@/hooks/use-toast';

// Hook para materiais
export const useMaterials = () => {
  return useQuery({
    queryKey: ['materials'],
    queryFn: getMaterials,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook para categorias
export const useMaterialCategories = () => {
  return useQuery({
    queryKey: ['material-categories'],
    queryFn: getMaterialCategories,
    staleTime: 10 * 60 * 1000,
    retry: 1,
  });
};

// Hook para estoque
export const useInventory = () => {
  return useQuery({
    queryKey: ['inventory'],
    queryFn: getInventory,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

// Hook para movimentações
export const useInventoryMovements = (materialId?: string) => {
  return useQuery({
    queryKey: ['inventory-movements', materialId],
    queryFn: () => getInventoryMovements(materialId),
    staleTime: 1 * 60 * 1000,
    retry: 1,
  });
};

// Hook para dashboard
export const useInventoryDashboard = () => {
  return useQuery({
    queryKey: ['inventory-dashboard'],
    queryFn: getInventoryDashboard,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook para materiais de tipo de serviço
export const useServiceTypeMaterials = (serviceTypeId: string) => {
  return useQuery({
    queryKey: ['service-type-materials', serviceTypeId],
    queryFn: () => getServiceTypeMaterials(serviceTypeId),
    enabled: !!serviceTypeId,
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
};

// Hook para uso de materiais em serviços
export const useServiceMaterialUsage = (serviceId: string) => {
  return useQuery({
    queryKey: ['service-material-usage', serviceId],
    queryFn: () => getServiceMaterialUsage(serviceId),
    enabled: !!serviceId,
    staleTime: 2 * 60 * 1000,
    retry: 1,
  });
};

// Mutations para materiais
export const useCreateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Material criado",
        description: "Material criado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateMaterial(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Material atualizado",
        description: "Material atualizado com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useDeleteMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteMaterial,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Material removido",
        description: "Material removido com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Mutations para categorias
export const useCreateMaterialCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createMaterialCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['material-categories'] });
      toast({
        title: "Categoria criada",
        description: "Categoria criada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Mutations para movimentações
export const useCreateInventoryMovement = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createInventoryMovement,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-dashboard'] });
      toast({
        title: "Movimentação registrada",
        description: "Movimentação de estoque registrada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro na movimentação",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Mutations para materiais de tipos de serviço
export const useAddMaterialToServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceTypeId, materialId, defaultQuantity, isRequired }: {
      serviceTypeId: string;
      materialId: string;
      defaultQuantity: number;
      isRequired: boolean;
    }) => addMaterialToServiceType(serviceTypeId, materialId, defaultQuantity, isRequired),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-type-materials', variables.serviceTypeId] });
      toast({
        title: "Material adicionado",
        description: "Material adicionado ao tipo de serviço com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateServiceTypeMaterial = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, defaultQuantity, isRequired }: {
      id: string;
      defaultQuantity: number;
      isRequired: boolean;
    }) => updateServiceTypeMaterial(id, defaultQuantity, isRequired),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-type-materials'] });
      toast({
        title: "Material atualizado",
        description: "Configuração do material atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useRemoveMaterialFromServiceType = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: removeMaterialFromServiceType,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-type-materials'] });
      toast({
        title: "Material removido",
        description: "Material removido do tipo de serviço com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao remover material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

// Mutations para uso de materiais
export const useAddMaterialUsageToService = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ serviceId, materialId, plannedQuantity, usedQuantity, notes }: {
      serviceId: string;
      materialId: string;
      plannedQuantity: number;
      usedQuantity?: number;
      notes?: string;
    }) => addMaterialUsageToService(serviceId, materialId, plannedQuantity, usedQuantity, notes),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['service-material-usage', variables.serviceId] });
      toast({
        title: "Material adicionado",
        description: "Material adicionado à demanda com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao adicionar material",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};

export const useUpdateServiceMaterialUsage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, usedQuantity, notes }: {
      id: string;
      usedQuantity: number;
      notes?: string;
    }) => updateServiceMaterialUsage(id, usedQuantity, notes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['service-material-usage'] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast({
        title: "Uso de material atualizado",
        description: "Quantidade utilizada atualizada com sucesso.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar uso",
        description: error.message,
        variant: "destructive",
      });
    },
  });
};