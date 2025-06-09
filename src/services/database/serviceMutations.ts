
import { supabase, handleDatabaseError } from './baseService';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';

// Create a new service
export const createServiceInDatabase = async (serviceData: {
  title: string;
  location: string;
  description?: string;
  status?: ServiceStatus;
  team_id?: string;
  service_type_id?: string;
}): Promise<Service | null> => {
  try {
    console.log('Creating service in database:', serviceData);
    
    // Generate a simple service number using timestamp
    const now = new Date();
    const serviceNumber = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
    
    // Prepare service data
    const insertData: any = {
      title: serviceData.title,
      location: serviceData.location,
      description: serviceData.description || '',
      status: serviceData.status || 'pendente',
      number: serviceNumber
    };

    // Only add team_id if it exists
    if (serviceData.team_id) {
      insertData.team_id = serviceData.team_id;
    }
    
    // Insert service
    const { data: serviceResult, error: serviceError } = await supabase
      .from('services')
      .insert(insertData)
      .select('*')
      .single();
    
    if (serviceError) {
      console.error("Erro ao criar serviço:", serviceError);
      throw serviceError;
    }

    if (!serviceResult) {
      console.error("Nenhum dado retornado após criar serviço");
      return null;
    }

    // Create service object
    const service: Service = {
      id: serviceResult.id,
      title: serviceResult.title,
      status: serviceResult.status as ServiceStatus,
      location: serviceResult.location,
      technician: {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico' as UserRole
      },
      creationDate: serviceResult.created_at,
      description: serviceResult.description || '',
      team_id: serviceResult.team_id || undefined,
      serviceType: serviceData.service_type_id || undefined
    };
    
    console.log('Service created successfully:', service);
    return service;
  } catch (error) {
    console.error('Error creating service:', error);
    return null;
  }
};

// Update service status
export const updateServiceStatus = async (id: string, status: ServiceStatus): Promise<boolean> => {
  try {
    console.log('Updating service status:', { id, status });
    
    const { error } = await supabase
      .from('services')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao atualizar status do serviço:", error);
      throw error;
    }
    
    console.log('Service status updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating service status:', error);
    return false;
  }
};

// Assign technician to service
export const assignTechnicianToService = async (serviceId: string, technicianId: string): Promise<boolean> => {
  try {
    console.log('Assigning technician to service:', { serviceId, technicianId });
    
    // Remove existing assignment if any
    await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);
    
    // Add new assignment
    const { error } = await supabase
      .from('service_technicians')
      .insert({
        service_id: serviceId,
        technician_id: technicianId
      });
    
    if (error) {
      console.error("Erro ao atribuir técnico ao serviço:", error);
      throw error;
    }
    
    console.log('Technician assigned successfully');
    return true;
  } catch (error) {
    console.error('Error assigning technician to service:', error);
    return false;
  }
};

// Delete service
export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting service from database:', id);
    
    // Delete related records first
    await supabase.from('service_technicians').delete().eq('service_id', id);
    await supabase.from('service_photos').delete().eq('service_id', id);
    await supabase.from('service_messages').delete().eq('service_id', id);
    await supabase.from('report_data').delete().eq('id', id);
    
    // Delete the service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao deletar serviço:", error);
      throw error;
    }
    
    console.log('Service deleted successfully');
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    return false;
  }
};

// Update service
export const updateServiceInDatabase = async (id: string, updates: Partial<Service>): Promise<boolean> => {
  try {
    console.log('Updating service in database:', { id, updates });
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };
    
    if (updates.title !== undefined) updateData.title = updates.title;
    if (updates.location !== undefined) updateData.location = updates.location;
    if (updates.status !== undefined) updateData.status = updates.status;
    if (updates.description !== undefined) updateData.description = updates.description;
    if (updates.team_id !== undefined) updateData.team_id = updates.team_id;
    
    // Note: service_type_id handling removed for now since column doesn't exist
    
    const { error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', id);
    
    if (error) {
      console.error("Erro ao atualizar serviço:", error);
      throw error;
    }
    
    console.log('Service updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    return false;
  }
};
