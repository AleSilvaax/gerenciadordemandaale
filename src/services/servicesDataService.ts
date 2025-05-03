
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';
import { toast } from "sonner";

// Define a type that matches the structure of the services table in Supabase
type ServiceFromDB = {
  id: string;
  title: string;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
  number: string;
  team_id?: string;
  description?: string;
}

// Rename getServices to getServicesFromDatabase to match the import in api.ts
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    // Criar uma consulta base
    const query = supabase.from('services');
    
    // Realizar consulta baseada na presença do teamId
    let queryResult;
    
    if (teamId) {
      queryResult = await query
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
    } else {
      queryResult = await query
        .select('*')
        .order('created_at', { ascending: false });
    }
    
    // Obter dados e erros
    const data = queryResult.data as ServiceFromDB[] | null;
    const error = queryResult.error;
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Obter todos os técnicos associados
    const technicianResult = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    const technicians = technicianResult.data;
    const techError = technicianResult.error;
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Transformar os dados do banco em objetos Service
    const services: Service[] = (data || []).map((item: ServiceFromDB) => {
      // Encontrar o técnico associado a este serviço
      const technicianData = technicians?.find(t => t.service_id === item.id);
      
      // Criar um objeto technician padrão caso não encontremos
      const technician: TeamMember = technicianData ? {
        id: technicianData.technician_id,
        name: technicianData.profiles.name || 'Sem nome',
        avatar: technicianData.profiles.avatar || '',
        role: 'tecnico' as UserRole
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico' as UserRole
      };

      return {
        id: item.id,
        title: item.title,
        status: item.status as ServiceStatus,
        location: item.location,
        technician,
        creationDate: item.created_at,
        team_id: item.team_id,
        description: item.description || ''
      };
    });
    
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Obter detalhes de um serviço específico por ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *
      `)
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Erro ao buscar detalhes do serviço:", error);
      throw error;
    }

    if (!data) return null;
    
    // Type assertion to match our expected structure
    const serviceData = data as ServiceFromDB;
    
    // Obter o técnico associado
    const { data: technicianData, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle();
    
    // Criar objeto técnico com os dados encontrados ou valores padrão
    const technician: TeamMember = technicianData ? {
      id: technicianData.technician_id,
      name: technicianData.profiles.name || 'Sem nome',
      avatar: technicianData.profiles.avatar || '',
      role: 'tecnico' as UserRole
    } : {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico' as UserRole
    };

    // Construir e retornar o objeto Service
    return {
      id: serviceData.id,
      title: serviceData.title,
      status: serviceData.status as ServiceStatus,
      location: serviceData.location,
      technician,
      creationDate: serviceData.created_at,
      description: serviceData.description || '',
      team_id: serviceData.team_id
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};

// Export createServiceInDatabase (already existed)
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
      status: serviceData.status as ServiceStatus,
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

// Rename updateService to updateServiceInDatabase to match import in api.ts
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

// Rename deleteService to deleteServiceFromDatabase to match import in api.ts
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

// Add the missing addServiceMessageToDatabase function
export const addServiceMessageToDatabase = async (
  serviceId: string, 
  messageData: { text: string, type: string, author: string, author_name: string }
): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('service_messages')
      .insert({
        service_id: serviceId,
        message: messageData.text,
        sender_id: messageData.author,
        sender_name: messageData.author_name,
        sender_role: messageData.type
      });
      
    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding message to service:', error);
    return false;
  }
};

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

// Obter estatísticas dos serviços
export const getServiceStats = async (teamId?: string): Promise<any> => {
  try {
    // Fix: Create query step by step to avoid infinite type instantiation
    const query = supabase.from('services');
    const selectQuery = query.select('status');
    
    // Apply filter if teamId is provided
    let filteredQuery = selectQuery;
    if (teamId) {
      filteredQuery = selectQuery.eq('team_id', teamId);
    }
    
    const { data, error } = await filteredQuery;
    
    if (error) throw error;
    
    // Inicializar contadores
    const stats = {
      total: data.length,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
    
    // Contar os serviços por status
    data.forEach((service: any) => {
      switch (service.status) {
        case 'concluido':
          stats.completed++;
          break;
        case 'pendente':
        case 'em_andamento':
          stats.pending++;
          break;
        case 'cancelado':
          stats.cancelled++;
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
  }
};
