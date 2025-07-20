// Arquivo: src/services/servicesDataService.ts

import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { Service } from '@/types/serviceTypes';

// ================================================================
// AQUI ESTÁ A CORREÇÃO MAIS IMPORTANTE
// Esta função agora busca um único serviço de forma eficiente e direta.
// ================================================================
export const getService = async (id: string): Promise<Service | null> => {
  console.log('[DEBUG] getService foi chamada com ID:', id); // NOVO LOG AQUI!
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:service_technicians!left(
        profiles!technician_id(id, name, avatar)
      )
    `)
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle para não quebrar se vier vazio

  console.log('[DEBUG] Retorno do Supabase RAW DATA:', data); // Novo log para depuração
  console.log('[DEBUG] Retorno do Supabase ERROR:', error); // Log do erro
  console.log('[DEBUG] Technician data from Supabase query:', data?.technician); // Adicionado para depurar o objeto technician

  if (error) {
    toast.error(`Erro ao buscar demanda: ${error.message}`);
    console.error("Erro ao buscar serviço único:", error);
    return null;
  }

  if (!data || !data.id) { // Garante que existe um serviço válido
    console.warn("[API-CORRIGIDA] Nenhum serviço encontrado com o ID:", id);
    return null;
  }

  // Monta o técnico se existir
  let safeTechnician = { id: '0', name: 'Não atribuído', avatar: '', role: 'tecnico' };
  if (Array.isArray(data.technician) && data.technician.length > 0 && data.technician[0]?.profiles) {
    const t = data.technician[0].profiles;
    safeTechnician = {
      id: t.id || '0',
      name: t.name || 'Não atribuído',
      avatar: t.avatar || '',
      role: (t as any).role || 'tecnico', // Cast para any porque 'role' não está diretamente em 'profiles' deste select
      // Removido email, phone, signature pois não estão diretamente na tabela profiles
    };
  }

  // Corrigir feedback e customFields para tipos esperados
  let safeFeedback = undefined;
  if (data.feedback) {
    try {
      safeFeedback = typeof data.feedback === 'string' ? JSON.parse(data.feedback) : data.feedback;
    } catch { safeFeedback = undefined; }
  }
  if (!safeFeedback) {
    safeFeedback = {
      rating: 0,
      comment: '',
      wouldRecommend: false,
      clientRating: 0,
      clientComment: '',
      technicianFeedback: '',
      userId: '',
      userName: '',
      timestamp: '',
    };
  }
  let safeCustomFields = undefined;
  if (data.custom_fields) {
    try {
      safeCustomFields = typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : data.custom_fields;
    } catch { safeCustomFields = undefined; }
  }

  return {
    ...data,
    technician: safeTechnician,
    feedback: safeFeedback,
    customFields: safeCustomFields
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

export interface ServiceFeedback {
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  clientRating: number;
  clientComment?: string;
  technicianFeedback?: string;
  userId?: string;
  userName?: string;
  timestamp?: string;
}
