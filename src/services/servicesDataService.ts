// src/services/servicesDataService.ts

import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";

// Re-exporta funções que não mudaram
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

// ================================================================
// AQUI ESTÁ A CORREÇÃO IMPORTANTE
// Esta função agora busca um único serviço de forma eficiente.
// ================================================================
export const getService = async (id: string) => {
  console.log('[API-FIX] Buscando serviço individualmente com ID:', id);

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:service_technicians!service_id(
        profiles!technician_id(id, name, avatar)
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    toast.error(`Erro ao buscar demanda: ${error.message}`);
    console.error("Error fetching single service:", error);
    return null;
  }

  if (!data) {
    return null;
  }

  // Estrutura o técnico corretamente
  const technicianProfile = data.technician[0]?.profiles;

  return {
    ...data,
    technician: technicianProfile || { id: '0', name: 'Não atribuído' }
  };
};
