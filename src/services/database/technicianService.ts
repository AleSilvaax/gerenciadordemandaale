
import { supabase } from './baseService';

// Atribuir um técnico a um serviço
export const assignTechnician = async (serviceId: string, technicianId: string): Promise<boolean> => {
  try {
    // Primeiro remove qualquer atribuição existente
    await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);
    
    // Em seguida, cria uma nova atribuição
    const { error } = await supabase
      .from('service_technicians')
      .insert({
        service_id: serviceId,
        technician_id: technicianId
      });
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error assigning technician to service:', error);
    return false;
  }
};
