
import { Service, TeamMember, ServiceStatus, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { toast } from "sonner";
import { 
  getServicesFromDatabase, 
  createServiceInDatabase, 
  updateServiceInDatabase, 
  deleteServiceFromDatabase,
  addServiceMessageToDatabase
} from './servicesDataService';

// Get all services
export const getServices = async (): Promise<Service[]> => {
  console.log("Getting all services...");
  
  try {
    // Get services from Supabase database
    const dbServices = await getServicesFromDatabase();
    console.log("Returning services from database:", dbServices.length);
    return dbServices;
  } catch (error) {
    console.error("Error getting services:", error);
    toast.error("Erro ao carregar demandas", {
      description: "Falha ao carregar demandas do servidor. Tente novamente mais tarde.",
    });
    return [];
  }
};

// Get a single service by ID
export const getService = async (id: string): Promise<Service | undefined> => {
  console.log("Getting service by ID:", id);
  
  try {
    // Get all services and find the one with matching ID
    const allServices = await getServices();
    const service = allServices.find(service => service.id === id);
    
    if (!service) {
      throw new Error(`Service with id ${id} not found`);
    }
    
    return service;
  } catch (error) {
    console.error("Error getting service by ID:", error);
    toast.error("Erro ao carregar demanda", {
      description: "Falha ao carregar os detalhes da demanda. Tente novamente mais tarde.",
    });
    return undefined;
  }
};

// Create a new service
export const createService = async (service: Omit<Service, "id">): Promise<Service> => {
  console.log("Creating new service:", service);
  
  try {
    // Create in database
    const newDbService = await createServiceInDatabase(service);
    
    if (newDbService) {
      console.log("Service created in database:", newDbService);
      toast.success("Serviço criado com sucesso!");
      return newDbService;
    } else {
      throw new Error("Failed to create service in database");
    }
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("Falha ao criar serviço no servidor");
    throw error;
  }
};

// Update a service
export const updateService = async (service: Partial<Service> & { id: string }): Promise<Service> => {
  console.log("Updating service:", service.id, service);
  
  try {
    // Update in database
    const updatedDbService = await updateServiceInDatabase(service);
    
    if (updatedDbService) {
      console.log("Service updated in database:", updatedDbService);
      toast.success("Serviço atualizado com sucesso!");
      return updatedDbService;
    } else {
      throw new Error(`Failed to update service with id ${service.id}`);
    }
  } catch (error) {
    console.error("Error updating service:", error);
    toast.error("Falha ao atualizar serviço no servidor");
    throw error;
  }
};

// Delete a service
export const deleteService = async (id: string): Promise<boolean> => {
  console.log("Deleting service:", id);
  
  try {
    // Delete from database
    const dbDeleteResult = await deleteServiceFromDatabase(id);
    
    if (dbDeleteResult) {
      console.log("Service deleted from database");
      toast.success("Serviço excluído com sucesso!");
      return true;
    } else {
      throw new Error(`Failed to delete service with id ${id}`);
    }
  } catch (error) {
    console.error("Error deleting service:", error);
    toast.error("Falha ao excluir serviço do servidor");
    throw error;
  }
};

// Add message to a service
export const addServiceMessage = async (
  serviceId: string, 
  message: Omit<ServiceMessage, "timestamp">
): Promise<Service> => {
  console.log("Adding message to service:", serviceId, message);
  
  try {
    // Add message to database
    const added = await addServiceMessageToDatabase(serviceId, {
      text: message.message,
      type: message.senderRole,
      author: message.senderId,
      author_name: message.senderName
    });
    
    if (added) {
      // Get the updated service
      const updatedService = await getService(serviceId);
      if (!updatedService) {
        throw new Error(`Service with id ${serviceId} not found`);
      }
      return updatedService;
    } else {
      throw new Error(`Failed to add message to service with id ${serviceId}`);
    }
  } catch (error) {
    console.error("Error adding message to service:", error);
    toast.error("Falha ao adicionar mensagem ao serviço");
    throw error;
  }
};

// Add feedback to a service
export const addServiceFeedback = async (
  serviceId: string,
  feedback: ServiceFeedback
): Promise<Service> => {
  try {
    // We need to implement this with Supabase
    // For now, we'll update the service with the feedback
    const service = await getService(serviceId);
    if (!service) {
      throw new Error(`Service with id ${serviceId} not found`);
    }
    
    const updatedService = {
      ...service,
      id: serviceId,
      feedback
    };
    
    return updateService(updatedService);
  } catch (error) {
    console.error("Error adding feedback:", error);
    toast.error("Falha ao adicionar feedback ao serviço");
    throw error;
  }
};

// Get team members - This should be implemented with Supabase
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    // Get team members from Supabase
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*');
      
    if (error) throw error;
    
    // Transform to TeamMember type
    return profiles.map(profile => ({
      id: profile.id,
      name: profile.name || 'Sem nome',
      avatar: profile.avatar || '',
      role: 'tecnico', // Default role, should be fetched from user_roles
    }));
  } catch (error) {
    console.error("Error getting team members:", error);
    toast.error("Falha ao carregar membros da equipe");
    return [];
  }
};

// Placeholder for updating team member
export const updateTeamMember = async (id: string, data: Partial<TeamMember>): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({
        name: data.name,
        avatar: data.avatar
      })
      .eq('id', id);
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error updating team member:", error);
    toast.error("Falha ao atualizar membro da equipe");
    return false;
  }
};

// Placeholder for adding new team member
export const addTeamMember = async (member: Omit<TeamMember, "id">): Promise<TeamMember> => {
  // This would require creating a new auth user and profile
  // For now, this is a stub that should be implemented properly
  throw new Error("Not implemented: Adding team members requires proper Auth integration");
};

// Placeholder for deleting team member
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  // This would require deleting the user from auth and profile
  // For now, this is a stub that should be implemented properly
  throw new Error("Not implemented: Deleting team members requires proper Auth integration");
};

// Import supabase client for the new functions
import { supabase } from '@/integrations/supabase/client';
