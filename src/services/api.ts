
import { Service, TeamMember, ServiceStatus, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { toast } from "sonner";
import { supabase } from '@/integrations/supabase/client';

// Get all services
export const getServices = async (): Promise<Service[]> => {
  console.log("Getting all services...");
  
  try {
    // Get services from Supabase with all related data
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        service_technicians(
          technician:profiles(*)
        ),
        service_messages(*)
      `);
    
    if (servicesError) {
      console.error('Error fetching services:', servicesError);
      throw servicesError;
    }

    // Transform the data to match our Service type
    const services: Service[] = (servicesData || []).map(service => {
      // Get technician from relationship
      const techRelation = service.service_technicians?.[0];
      const technician: TeamMember = techRelation?.technician ? {
        id: techRelation.technician.id,
        name: techRelation.technician.name || 'Desconhecido',
        avatar: techRelation.technician.avatar || '',
        role: 'tecnico',
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      };

      // Transform messages
      const messages = (service.service_messages || []).map(msg => ({
        senderId: msg.sender_id,
        senderName: msg.sender_name,
        senderRole: msg.sender_role,
        message: msg.message,
        timestamp: msg.timestamp
      }));

      return {
        id: service.id,
        title: service.title,
        status: service.status as ServiceStatus,
        location: service.location,
        technician: technician,
        creationDate: service.created_at,
        messages: messages,
        dueDate: service.due_date || undefined,
        priority: (service.priority as any) || undefined,
        serviceType: (service.service_type as any) || undefined,
        createdBy: service.created_by || undefined,
      };
    });
    
    console.log('Services fetched successfully:', services);
    return services;
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
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("User not authenticated");
    }

    // Generate a service number
    const { data: numberData, error: numberError } = await supabase.rpc('nextval_for_service');
    
    if (numberError) {
      console.error('Error generating service number:', numberError);
      throw numberError;
    }
    
    // Format the service number
    const number = `SRV-${numberData.toString().padStart(5, '0')}`;
    
    // Create service record
    const { data, error } = await supabase
      .from('services')
      .insert({
        title: service.title,
        location: service.location,
        status: service.status,
        number: number,
        created_by: user.id,
        priority: service.priority || 'media',
        due_date: service.dueDate,
        service_type: service.serviceType || 'Vistoria'
      })
      .select()
      .single();
    
    if (error) {
      console.error('Error creating service:', error);
      throw error;
    }
    
    console.log('Service created successfully:', data);
    
    // If a technician is assigned, create the relationship
    if (service.technician && service.technician.id && service.technician.id !== '0' && data.id) {
      await assignTechnician(data.id, service.technician.id);
    }
    
    // Construct and return a properly typed Service object
    const newService: Service = {
      id: data.id,
      title: data.title,
      location: data.location,
      status: data.status as ServiceStatus,
      technician: service.technician || {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      },
      creationDate: data.created_at,
      dueDate: data.due_date || undefined,
      priority: (data.priority as any) || undefined,
      serviceType: (data.service_type as any) || undefined,
      createdBy: data.created_by || undefined,
      messages: [],
    };

    toast.success("Serviço criado com sucesso!");
    return newService;
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("Falha ao criar serviço no servidor");
    throw error;
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

// Update a service
export const updateService = async (service: Partial<Service> & { id: string }): Promise<Service> => {
  console.log("Updating service:", service.id, service);
  
  try {
    // Update the main service record
    const { data, error } = await supabase
      .from('services')
      .update({
        title: service.title,
        location: service.location,
        status: service.status,
        priority: service.priority,
        due_date: service.dueDate,
        service_type: service.serviceType,
        updated_at: new Date().toISOString()
      })
      .eq('id', service.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service:', error);
      throw error;
    }
    
    console.log('Service updated successfully:', data);
    
    // Update technician if provided
    if (service.technician && service.technician.id && service.technician.id !== '0') {
      await assignTechnician(service.id, service.technician.id);
    }
    
    // Get the updated service
    const updatedService = await getService(service.id);
    if (!updatedService) {
      throw new Error(`Service with id ${service.id} not found after update`);
    }

    toast.success("Serviço atualizado com sucesso!");
    return updatedService;
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
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service:', error);
      throw error;
    }
    
    console.log('Service deleted successfully');
    toast.success("Serviço excluído com sucesso!");
    return true;
  } catch (error) {
    console.error("Error deleting service:", error);
    toast.error("Falha ao excluir serviço do servidor");
    return false;
  }
};

// Add message to a service
export const addServiceMessage = async (
  serviceId: string, 
  message: Omit<ServiceMessage, "timestamp">
): Promise<Service> => {
  console.log("Adding message to service:", serviceId, message);
  
  try {
    const { error } = await supabase
      .from('service_messages')
      .insert({
        service_id: serviceId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        message: message.message
      });
    
    if (error) {
      console.error('Error adding message:', error);
      throw error;
    }
    
    // Get the updated service
    const updatedService = await getService(serviceId);
    if (!updatedService) {
      throw new Error(`Service with id ${serviceId} not found`);
    }
    return updatedService;
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

// Get team members
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    console.log('Fetching team members...');
    
    // Get profiles with their roles
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_roles(role)
      `);
      
    if (error) {
      console.error('Error getting team members:', error);
      throw error;
    }
    
    // Transform to TeamMember type
    const teamMembers = (profiles || []).map(profile => ({
      id: profile.id,
      name: profile.name || 'Sem nome',
      avatar: profile.avatar || '',
      role: (profile.user_roles?.[0]?.role || 'tecnico') as any,
    }));
    
    console.log('Team members fetched:', teamMembers);
    return teamMembers;
  } catch (error) {
    console.error("Error getting team members:", error);
    toast.error("Falha ao carregar membros da equipe");
    return [];
  }
};

// Update team member
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
    
    // Update role if provided
    if (data.role) {
      await supabase
        .from('user_roles')
        .upsert({
          user_id: id,
          role: data.role
        });
    }
    
    return true;
  } catch (error) {
    console.error("Error updating team member:", error);
    toast.error("Falha ao atualizar membro da equipe");
    return false;
  }
};

// Add new team member (placeholder)
export const addTeamMember = async (member: Omit<TeamMember, "id">): Promise<TeamMember> => {
  throw new Error("Not implemented: Adding team members requires proper Auth integration");
};

// Delete team member (placeholder)
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  throw new Error("Not implemented: Deleting team members requires proper Auth integration");
};

// Get service types
export const getServiceTypes = async () => {
  try {
    console.log('Fetching service types...');
    
    const { data, error } = await supabase
      .from('service_types')
      .select('*');
      
    if (error) {
      console.error('Error getting service types:', error);
      throw error;
    }
    
    console.log('Service types fetched:', data);
    return data || [];
  } catch (error) {
    console.error("Error getting service types:", error);
    toast.error("Falha ao carregar tipos de serviço");
    return [];
  }
};
