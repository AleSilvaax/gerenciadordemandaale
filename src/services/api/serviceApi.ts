import { Service } from '@/types/serviceTypes';
import { toast } from "sonner";
import { 
  getServicesFromDatabase, 
  getServiceById, 
  createServiceInDatabase, 
  updateServiceInDatabase, 
  deleteServiceFromDatabase,
  addServiceMessageToDatabase
} from '../database';

// Get all services
export const getServices = async (teamId?: string): Promise<Service[]> => {
  console.log("Getting all services...", teamId ? `for team: ${teamId}` : "for all teams");
  
  try {
    // Get services from Supabase database
    const dbServices = await getServicesFromDatabase(teamId);
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
    // Buscar serviço diretamente pelo ID
    const service = await getServiceById(id);
    
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
    // Simplify the service data for database insertion
    const serviceData = {
      title: service.title,
      location: service.location,
      description: service.description || '',
      status: service.status || 'pendente'
    };
    
    // Create in database
    const newDbService = await createServiceInDatabase(serviceData);
    
    if (newDbService) {
      console.log("Service created in database:", newDbService);
      toast.success("Demanda criada com sucesso!");
      return newDbService;
    } else {
      throw new Error("Failed to create service in database");
    }
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("Erro ao criar demanda. Por favor, tente novamente.");
    throw error;
  }
};

// Update a service
export const updateService = async (service: Partial<Service> & { id: string }): Promise<Service> => {
  console.log("Updating service:", service.id, service);
  
  try {
    // Update in database - pass id and updates separately
    const updateSuccess = await updateServiceInDatabase(service.id, service);
    
    if (updateSuccess) {
      console.log("Service updated in database");
      toast.success("Demanda atualizada com sucesso!");
      
      // Get the updated service to return
      const updatedService = await getServiceById(service.id);
      if (!updatedService) {
        throw new Error(`Failed to retrieve updated service with id ${service.id}`);
      }
      return updatedService;
    } else {
      throw new Error(`Failed to update service with id ${service.id}`);
    }
  } catch (error) {
    console.error("Error updating service:", error);
    toast.error("Falha ao atualizar demanda no servidor");
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
      toast.success("Demanda excluída com sucesso!");
      return true;
    } else {
      throw new Error(`Failed to delete service with id ${id}`);
    }
  } catch (error) {
    console.error("Error deleting service:", error);
    toast.error("Falha ao excluir demanda do servidor");
    throw error;
  }
};

// Add message to a service
export const addServiceMessage = async (
  serviceId: string, 
  message: any
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
  feedback: any
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
