
import { supabase } from './baseService';
import { Service } from '@/types/serviceTypes';
import { getServiceById } from './serviceQueries';
import { assignTechnician } from './technicianService';

// Create a new service
export const createServiceInDatabase = async (service: Omit<Service, "id">): Promise<Service | null> => {
  try {
    console.log('Creating service in DB:', service);
    
    // Gerar número de serviço
    let serviceNumber = "SRV-00000"; // Valor padrão caso não consiga obter do banco
    try {
      const { data: numberData, error: numberErr } = await supabase
        .rpc('nextval_for_service');
        
      if (!numberErr && numberData) {
        serviceNumber = `SRV-${numberData.toString().padStart(5, '0')}`;
      }
    } catch (numberErr) {
      console.error('Exception generating service number:', numberErr);
    }
    
    // Create a simplified service object with only the required fields for the database
    const serviceForDb = {
      title: service.title,
      location: service.location,
      status: service.status,
      number: serviceNumber,
      team_id: service.team_id || null,
      description: service.description || ''
    };

    console.log('Sending to database:', serviceForDb);
    
    // Create service record
    const { data, error } = await supabase
      .from('services')
      .insert(serviceForDb)
      .select('id, title, status, location, created_at, updated_at, number, team_id, description')
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned after creating service');
    }
    
    console.log('Service created with ID:', data.id);
    
    // If a technician is assigned, create the relationship
    if (service.technician && service.technician.id && service.technician.id !== '0' && data.id) {
      try {
        await assignTechnician(data.id, service.technician.id);
      } catch (techError) {
        console.error('Error assigning technician, but service was created:', techError);
        // Continue since the main service was created
      }
    }
    
    // Get the complete service with technician data
    const completeService = await getServiceById(data.id);
    return completeService;
  } catch (error) {
    console.error('Error in createServiceInDatabase:', error);
    throw error;
  }
};

// Update an existing service
export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    console.log('Updating service:', service.id);
    
    // Extrair propriedades básicas para atualizar na tabela 'services'
    const { title, status, location, description, id } = service;
    
    const { error, data } = await supabase
      .from('services')
      .update({
        title,
        status,
        location,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select('id, title, status, location, created_at, updated_at, number, team_id, description')
      .single();
    
    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }
    
    console.log('Service updated in database');
    
    // Se um técnico foi fornecido e é diferente de 'Não atribuído', atualize a relação
    if (service.technician && service.technician.id && service.technician.id !== '0') {
      try {
        await assignTechnician(id, service.technician.id);
      } catch (techError) {
        console.error('Error updating technician assignment:', techError);
      }
    }
    
    // Return the updated service
    const updatedService = await getServiceById(id);
    return updatedService;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting service:', id);
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
    
    console.log('Service deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
};
