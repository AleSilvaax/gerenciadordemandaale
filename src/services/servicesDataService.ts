
import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember } from '@/types/serviceTypes';
import { toast } from "sonner";

// Get all services from Supabase
export const getServicesFromDatabase = async (): Promise<Service[]> => {
  try {
    console.log('Fetching services from database');
    
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_technicians(*, technician_id)
      `);
    
    if (error) {
      console.error('Error fetching services from Supabase:', error);
      throw error;
    }
    
    console.log('Services fetched successfully:', data);
    return data || [];
  } catch (error) {
    console.error('Error in getServicesFromDatabase:', error);
    return [];
  }
};

// Create a new service in Supabase
export const createServiceInDatabase = async (service: Omit<Service, "id">): Promise<Service | null> => {
  try {
    console.log('Creating new service in database:', service);
    
    const { data, error } = await supabase
      .from('services')
      .insert([{
        title: service.title,
        location: service.location,
        number: service.number,
        status: service.status
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service in Supabase:', error);
      throw error;
    }
    
    console.log('Service created successfully:', data);
    
    // If technicians are assigned, create the relationships
    if (service.technicians && service.technicians.length > 0 && data.id) {
      await assignTechnicians(data.id, service.technicians);
    }
    
    return data;
  } catch (error) {
    console.error('Error in createServiceInDatabase:', error);
    toast.error("Falha ao criar serviço no servidor");
    return null;
  }
};

// Update existing service in Supabase
export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    console.log('Updating service in database:', service);
    
    // Update the main service record
    const { data, error } = await supabase
      .from('services')
      .update({
        title: service.title,
        location: service.location,
        status: service.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', service.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service in Supabase:', error);
      throw error;
    }
    
    console.log('Service updated successfully:', data);
    
    // Update technicians if provided
    if (service.technicians) {
      await assignTechnicians(service.id, service.technicians);
    }
    
    return data;
  } catch (error) {
    console.error('Error in updateServiceInDatabase:', error);
    toast.error("Falha ao atualizar serviço no servidor");
    return null;
  }
};

// Delete a service from Supabase
export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting service from database:', id);
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service from Supabase:', error);
      throw error;
    }
    
    console.log('Service deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteServiceFromDatabase:', error);
    toast.error("Falha ao excluir serviço do servidor");
    return false;
  }
};

// Helper function to assign technicians to a service
async function assignTechnicians(serviceId: string, technicians: TeamMember[]): Promise<void> {
  try {
    // First, remove existing technician assignments
    const { error: deleteError } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);
    
    if (deleteError) throw deleteError;
    
    // Then add the new assignments
    if (technicians.length > 0) {
      const techAssignments = technicians.map(tech => ({
        service_id: serviceId,
        technician_id: tech.id
      }));
      
      const { error } = await supabase
        .from('service_technicians')
        .insert(techAssignments);
      
      if (error) throw error;
    }
  } catch (error) {
    console.error('Error assigning technicians:', error);
    throw error;
  }
}

// Add a message to a service
export const addServiceMessageToDatabase = async (
  serviceId: string, 
  message: { text: string, type: string, author: string }
): Promise<boolean> => {
  try {
    console.log('Adding message to service:', serviceId, message);
    
    // For this example, we're assuming messages are stored as JSON in the services table
    // In a more robust implementation, you might have a separate messages table
    const { data, error } = await supabase.rpc('add_service_message', { 
      p_service_id: serviceId,
      p_message: { 
        text: message.text,
        type: message.type,
        author: message.author,
        timestamp: new Date().toISOString()
      }
    });
    
    if (error) {
      console.error('Error adding message to service:', error);
      throw error;
    }
    
    console.log('Message added successfully');
    return true;
  } catch (error) {
    console.error('Error in addServiceMessageToDatabase:', error);
    return false;
  }
};
