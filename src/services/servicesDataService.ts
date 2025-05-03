
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";

// Obter lista de todos os serviços
export const getServices = async (teamId?: string): Promise<Service[]> => {
  try {
    let query = supabase
      .from('services')
      .select(`
        *
      `)
      .order('created_at', { ascending: false });
    
    // Se um ID de equipe for fornecido, filtre por essa equipe
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Obter todos os técnicos associados
    const { data: technicians, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Transformar os dados do banco em objetos Service
    const services: Service[] = data.map((item) => {
      // Encontrar o técnico associado a este serviço
      const technicianData = technicians?.find(t => t.service_id === item.id);
      
      // Criar um objeto technician padrão caso não encontremos
      const technician = technicianData ? {
        id: technicianData.technician_id,
        name: technicianData.profiles.name || 'Sem nome',
        avatar: technicianData.profiles.avatar || '',
        role: 'tecnico'
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico'
      };

      return {
        id: item.id,
        title: item.title,
        status: item.status as ServiceStatus,
        location: item.location,
        technician,
        creationDate: item.created_at,
        // Outras propriedades podem ser adicionadas conforme necessário
        team_id: item.team_id
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
    const technician = technicianData ? {
      id: technicianData.technician_id,
      name: technicianData.profiles.name || 'Sem nome',
      avatar: technicianData.profiles.avatar || '',
      role: 'tecnico'
    } : {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico'
    };

    // Construir e retornar o objeto Service
    return {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      technician,
      creationDate: data.created_at,
      description: data.description,
      // Incluir outros campos conforme necessário
      team_id: data.team_id
    };
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};

// Criar um novo serviço no banco de dados
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
      team_id: service.team_id, // Adicionar o ID da equipe
      description: service.description
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
    
    // If a technician is assigned, create the relationship
    if (service.technician && service.technician.id && service.technician.id !== '0' && data.id) {
      try {
        await assignTechnician(data.id, service.technician.id);
      } catch (techError) {
        console.error('Error assigning technician, but service was created:', techError);
        // Continue since the main service was created
      }
    }
    
    // Construct and return a properly typed Service object
    return {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      technician: service.technician,
      creationDate: data.created_at,
      // Incluir outros campos conforme necessário
      team_id: data.team_id
    };
  } catch (error) {
    console.error('Error in createServiceInDatabase:', error);
    throw error;
  }
};

// Atualizar um serviço existente
export const updateService = async (id: string, service: Partial<Service>): Promise<boolean> => {
  try {
    // Extrair propriedades básicas para atualizar na tabela 'services'
    const { title, status, location, description } = service;
    
    const { error } = await supabase
      .from('services')
      .update({
        title,
        status,
        location,
        description,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);
    
    if (error) throw error;
    
    // Se um técnico foi fornecido e é diferente de 'Não atribuído', atualize a relação
    if (service.technician && service.technician.id && service.technician.id !== '0') {
      await assignTechnician(id, service.technician.id);
    }
    
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    return false;
  }
};

// Excluir um serviço
export const deleteService = async (id: string): Promise<boolean> => {
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
    let query = supabase.from('services');
    
    // Se um ID de equipe for fornecido, filtre por essa equipe
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data, error } = await query.select('status');
    
    if (error) throw error;
    
    // Inicializar contadores
    const stats = {
      total: data.length,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
    
    // Contar os serviços por status
    data.forEach(service => {
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
