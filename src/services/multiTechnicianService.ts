import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/types/serviceTypes';
import { toast } from "sonner";

/**
 * Atribui múltiplos técnicos a um serviço
 * Remove todas as atribuições existentes e cria as novas
 */
export const assignMultipleTechnicians = async (
  serviceId: string, 
  technicians: TeamMember[]
): Promise<void> => {
  try {
    // Primeiro, remove todas as atribuições existentes
    const { error: deleteError } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);

    if (deleteError) {
      console.error('Erro ao remover atribuições existentes:', deleteError);
      throw deleteError;
    }

    // Se não há técnicos para atribuir, apenas retorna (já removeu as existentes)
    if (!technicians || technicians.length === 0) {
      console.log('[MULTI_TECHNICIAN] Todas as atribuições removidas');
      return;
    }

    // Cria as novas atribuições
    const assignments = technicians.map(technician => ({
      service_id: serviceId,
      technician_id: technician.id
    }));

    const { error: insertError } = await supabase
      .from('service_technicians')
      .insert(assignments);

    if (insertError) {
      console.error('Erro ao criar novas atribuições:', insertError);
      throw insertError;
    }

    console.log(`[MULTI_TECHNICIAN] ${technicians.length} técnico(s) atribuído(s) ao serviço ${serviceId}`);
  } catch (error) {
    console.error('[MULTI_TECHNICIAN] Erro no processo de atribuição:', error);
    throw error;
  }
};

/**
 * Busca todos os técnicos atribuídos a um serviço
 */
export const getServiceTechnicians = async (serviceId: string): Promise<TeamMember[]> => {
  try {
    const { data, error } = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(
          id,
          name,
          avatar
        )
      `)
      .eq('service_id', serviceId);

    if (error) {
      console.error('Erro ao buscar técnicos do serviço:', error);
      throw error;
    }

    return data?.map((item: any) => ({
      id: item.profiles.id,
      name: item.profiles.name,
      avatar: item.profiles.avatar,
      role: 'tecnico' as const
    })) || [];
  } catch (error) {
    console.error('[MULTI_TECHNICIAN] Erro ao buscar técnicos:', error);
    return [];
  }
};

/**
 * Verifica se um técnico está atribuído a um serviço específico
 */
export const isTechnicianAssigned = async (
  serviceId: string, 
  technicianId: string
): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('service_technicians')
      .select('id')
      .eq('service_id', serviceId)
      .eq('technician_id', technicianId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = not found
      console.error('Erro ao verificar atribuição:', error);
      return false;
    }

    return !!data;
  } catch (error) {
    console.error('[MULTI_TECHNICIAN] Erro ao verificar atribuição:', error);
    return false;
  }
};

/**
 * Adiciona um técnico a um serviço (sem remover os existentes)
 */
export const addTechnicianToService = async (
  serviceId: string, 
  technician: TeamMember
): Promise<void> => {
  try {
    // Verifica se já está atribuído
    const isAlreadyAssigned = await isTechnicianAssigned(serviceId, technician.id);
    
    if (isAlreadyAssigned) {
      toast.info(`${technician.name} já está atribuído a esta demanda`);
      return;
    }

    const { error } = await supabase
      .from('service_technicians')
      .insert({
        service_id: serviceId,
        technician_id: technician.id
      });

    if (error) {
      console.error('Erro ao adicionar técnico:', error);
      throw error;
    }

    console.log(`[MULTI_TECHNICIAN] Técnico ${technician.name} adicionado ao serviço ${serviceId}`);
  } catch (error) {
    console.error('[MULTI_TECHNICIAN] Erro ao adicionar técnico:', error);
    throw error;
  }
};

/**
 * Remove um técnico específico de um serviço
 */
export const removeTechnicianFromService = async (
  serviceId: string, 
  technicianId: string
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId)
      .eq('technician_id', technicianId);

    if (error) {
      console.error('Erro ao remover técnico:', error);
      throw error;
    }

    console.log(`[MULTI_TECHNICIAN] Técnico ${technicianId} removido do serviço ${serviceId}`);
  } catch (error) {
    console.error('[MULTI_TECHNICIAN] Erro ao remover técnico:', error);
    throw error;
  }
};