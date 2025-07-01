
export {
  getServicesFromDatabase as getServices,
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

import { supabase } from "@/integrations/supabase/client";

export async function uploadServicePhoto(file: File): Promise<string> {
  try {
    console.log('[uploadServicePhoto] Iniciando upload:', file.name);
    
    const fileExt = file.name.split('.').pop();
    const filename = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('service-photos')
      .upload(filename, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('[uploadServicePhoto] Erro no upload:', error);
      throw error;
    }

    // Obter URL pública
    const { data: publicData } = supabase.storage
      .from('service-photos')
      .getPublicUrl(data.path);

    console.log('[uploadServicePhoto] Upload concluído:', publicData.publicUrl);
    return publicData.publicUrl;
  } catch (error) {
    console.error('[uploadServicePhoto] Erro:', error);
    throw error;
  }
}
