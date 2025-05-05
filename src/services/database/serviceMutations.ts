
import { supabase } from './baseService';
import { Service } from '@/types/serviceTypes';
import { ServiceFromDB, getServiceById } from './serviceQueries';
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
      number: serviceNumber,  // Use either generated or default number
      team_id: service.team_id,
      description: service.description || ''
    };

    console.log('Sending to database:', serviceForDb);
    
    // Create service record
    const { data, error } = await supabase
      .from('services')
      .insert(serviceForDb)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }
    
    if (!data) {
      throw new Error('No data returned after creating service');
    }
    
    // Type assertion to match our expected structure
    const serviceData = data as ServiceFromDB;
    
    // If a technician is assigned, create the relationship
    if (service.technician && service.technician.id && service.technician.id !== '0' && serviceData.id) {
      try {
        await assignTechnician(serviceData.id, service.technician.id);
      } catch (techError) {
        console.error('Error assigning technician, but service was created:', techError);
        // Continue since the main service was created
      }
    }
    
    // Construct and return a properly typed Service object
    return {
      id: serviceData.id,
      title: serviceData.title,
      status: serviceData.status as any,
      location: serviceData.location,
      technician: service.technician,
      creationDate: serviceData.created_at,
      team_id: serviceData.team_id,
      description: serviceData.description || ''
    };
  } catch (error) {
    console.error('Error in createServiceInDatabase:', error);
    throw error;
  }
};

// Update an existing service
export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
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
      .select()
      .single();
    
    if (error) throw error;
    
    // Type assertion for the database result
    const serviceData = data as ServiceFromDB;
    
    // Se um técnico foi fornecido e é diferente de 'Não atribuído', atualize a relação
    if (service.technician && service.technician.id && service.technician.id !== '0') {
      await assignTechnician(id, service.technician.id);
    }
    
    // Return the updated service
    if (serviceData) {
      const updatedService = await getServiceById(id);
      return updatedService;
    }
    
    return null;
  } catch (error) {
    console.error('Error updating service:', error);
    throw error;
  }
};

// Delete a service
export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
};
