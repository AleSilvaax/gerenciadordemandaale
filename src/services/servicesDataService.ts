// Arquivo: src/services/servicesDataService.ts

import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Service } from '@/types/serviceTypes';

// ================================================================
// AQUI ESTÁ A CORREÇÃO MAIS IMPORTANTE
// Esta função agora busca um único serviço de forma eficiente e direta.
// ================================================================
export const getService = async (id: string): Promise<Service | null> => {
  console.log('[API-CORRIGIDA] Buscando serviço individualmente com ID:', id);

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:service_technicians!left(
        profiles!technician_id(id, name, avatar)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error(`Erro ao buscar demanda: ${error.message}`);
    console.error("Erro ao buscar serviço único:", error);
    return null;
  }

  if (!data) {
    console.warn("[API-CORRIGIDA] Nenhum serviço encontrado com o ID:", id);
    return null;
  }

  // Estrutura o técnico corretamente para o formato esperado pelo app
  const technicianProfile = data.technician?.[0]?.profiles || null;

  return {
    ...data,
    technician: technicianProfile || { id: '0', name: 'Não atribuído' }
  } as Service;
};

// Re-exporta as outras funções que não precisam de alteração
export {
  getServicesFromDatabase as getServices,
  getServicesFromDatabase,
  createServiceInDatabase as createService,
  updateServiceInDatabase as updateService,
  deleteServiceFromDatabase as deleteService
} from "./serviceCrud";

export {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember
} from "./teamMembersService";

export {
  getServiceTypesFromDatabase,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  createTechnicalField,
  updateTechnicalField,
  deleteTechnicalField
} from "./serviceTypesService";

export {
  addServiceMessage,
  addServiceFeedback
} from "./serviceMessaging";

export { uploadServicePhoto } from "./photoService";
