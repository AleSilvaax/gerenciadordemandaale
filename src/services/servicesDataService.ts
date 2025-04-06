
import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember } from '@/types/serviceTypes';
import { toast } from "sonner";

// Get all services from Supabase
export const getServicesFromDatabase = async (): Promise<Service[]> => {
  try {
    console.log('Fetching services from database');
    
    // First get all services
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*');
    
    if (servicesError) {
      console.error('Error fetching services from Supabase:', servicesError);
      throw servicesError;
    }
    
    // Then get all service_technicians relationships
    const { data: technicianData, error: technicianError } = await supabase
      .from('service_technicians')
      .select('*, profiles:technician_id(*)');
    
    if (technicianError) {
      console.error('Error fetching service technicians from Supabase:', technicianError);
      throw technicianError;
    }
    
    // Transform the data to match our Service type
    const services: Service[] = servicesData.map(service => {
      // Find technician for this service
      const techRelation = technicianData.find(t => t.service_id === service.id);
      
      // Get technician details or use a default
      const technician: TeamMember = techRelation?.profiles ? {
        id: techRelation.profiles.id,
        name: techRelation.profiles.name || 'Desconhecido',
        avatar: techRelation.profiles.avatar || '',
        role: 'tecnico', // Default role
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      };
      
      // Return a properly formatted Service object
      return {
        id: service.id,
        title: service.title,
        status: service.status as any,
        location: service.location,
        technician: technician,
        creationDate: service.created_at,
        // Provide defaults/placeholders for required properties
        dueDate: undefined,
        priority: undefined,
      };
    });
    
    console.log('Services fetched successfully:', services);
    return services;
  } catch (error) {
    console.error('Error in getServicesFromDatabase:', error);
    return [];
  }
};

// Create a new service in Supabase
export const createServiceInDatabase = async (service: Omit<Service, "id">): Promise<Service | null> => {
  try {
    console.log('Creating new service in database:', service);
    
    // Create service record
    const { data, error } = await supabase
      .from('services')
      .insert([{
        title: service.title,
        location: service.location,
        status: service.status
      }])
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service in Supabase:', error);
      throw error;
    }
    
    console.log('Service created successfully:', data);
    
    // If a technician is assigned, create the relationship
    if (service.technician && service.technician.id && data.id) {
      await assignTechnician(data.id, service.technician.id);
    }
    
    // Construct and return a properly typed Service object
    return {
      id: data.id,
      title: data.title,
      location: data.location,
      status: data.status as any,
      technician: service.technician,
      creationDate: data.created_at,
      // Provide defaults for required properties
      dueDate: service.dueDate,
      priority: service.priority,
    };
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
    
    // Update technician if provided
    if (service.technician && service.technician.id) {
      await assignTechnician(service.id, service.technician.id);
    }
    
    // Construct and return a properly typed Service object
    return {
      id: data.id,
      title: data.title,
      location: data.location,
      status: data.status as any,
      technician: service.technician || {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      },
      // Provide defaults for required properties
      creationDate: data.created_at,
      dueDate: service.dueDate,
      priority: service.priority,
    };
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

// Helper function to assign a technician to a service
async function assignTechnician(serviceId: string, technicianId: string): Promise<void> {
  try {
    // First, remove existing technician assignments
    const { error: deleteError } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);
    
    if (deleteError) throw deleteError;
    
    // Then add the new assignment
    const { error } = await supabase
      .from('service_technicians')
      .insert({
        service_id: serviceId,
        technician_id: technicianId
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error assigning technician:', error);
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
    
    // Using the Edge Function to add a message
    const { error } = await supabase.functions.invoke('add_service_message', {
      body: { 
        serviceId, 
        message: {
          text: message.text,
          type: message.type,
          author: message.author,
        }
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
