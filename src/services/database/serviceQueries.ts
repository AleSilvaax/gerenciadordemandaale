
import { supabase, handleDatabaseError } from './baseService';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';

// Define a type that matches the structure of the services table in Supabase
export type ServiceFromDB = {
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

// Define the technician data structure explicitly
type TechnicianWithProfile = {
  service_id: string;
  technician_id: string;
  profiles: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

// Get all services from the database
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    // Using explicit casting to avoid type inference issues
    let query = supabase.from('services').select('*');
    
    // Add team filter if provided
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    // Execute query with order and explicit typing
    const { data, error } = await query.order('created_at', { ascending: false }) as 
      { data: ServiceFromDB[] | null, error: any };
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Obter todos os técnicos associados com tipagem explícita
    const { data: technicians, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `) as { data: TechnicianWithProfile[] | null, error: any };
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Use any array to completely avoid type instantiation during build
    const mappedServices: any[] = [];
    
    for (const item of data || []) {
      // Encontrar o técnico associado a este serviço
      const technicianData = technicians?.find(t => t.service_id === item.id);
      
      // Criar um objeto technician padrão caso não encontremos
      const technician = technicianData ? {
        id: technicianData.technician_id,
        name: technicianData.profiles.name || 'Sem nome',
        avatar: technicianData.profiles.avatar || '',
        role: 'tecnico' as const
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico' as const
      };

      // Create service object avoiding deep type checking
      const serviceItem = {
        id: item.id,
        title: item.title,
        status: item.status,
        location: item.location,
        technician: technician,
        creationDate: item.created_at,
        team_id: item.team_id,
        description: item.description || ''
      };

      mappedServices.push(serviceItem);
    }
    
    // Only cast to Service[] at the very end
    return mappedServices as Service[];
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Get a specific service by ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single() as { data: ServiceFromDB | null, error: any };
    
    if (error) {
      console.error("Erro ao buscar detalhes do serviço:", error);
      throw error;
    }

    if (!data) return null;
    
    // Obter o técnico associado com tipagem explícita
    const { data: technicianData, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle() as { 
        data: { technician_id: string, profiles: { name: string | null, avatar: string | null } } | null, 
        error: any 
      };
    
    // Criar objeto técnico com os dados encontrados ou valores padrão
    const technician = technicianData ? {
      id: technicianData.technician_id,
      name: technicianData.profiles.name || 'Sem nome',
      avatar: technicianData.profiles.avatar || '',
      role: 'tecnico' as const
    } : {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico' as const
    };

    // Build service object with minimal typing
    const service = {
      id: data.id,
      title: data.title,
      status: data.status,
      location: data.location,
      technician: technician,
      creationDate: data.created_at,
      description: data.description || '',
      team_id: data.team_id
    };
    
    // Cast to Service only at return
    return service as Service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
