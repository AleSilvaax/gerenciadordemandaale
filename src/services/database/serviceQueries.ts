
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
    
    // Create result array without any type annotation to avoid inference
    const result = [];
    
    // Process each service individually to avoid complex type operations
    if (data) {
      for (let i = 0; i < data.length; i++) {
        const item = data[i];
        
        // Find technician manually to avoid .find() type inference
        let foundTechnician = null;
        if (technicians) {
          for (let j = 0; j < technicians.length; j++) {
            if (technicians[j].service_id === item.id) {
              foundTechnician = technicians[j];
              break;
            }
          }
        }
        
        // Create technician object with minimal typing
        const tech = foundTechnician ? {
          id: foundTechnician.technician_id,
          name: foundTechnician.profiles.name || 'Sem nome',
          avatar: foundTechnician.profiles.avatar || '',
          role: 'tecnico'
        } : {
          id: '0',
          name: 'Não atribuído',
          avatar: '',
          role: 'tecnico'
        };

        // Create service object with minimal structure
        const serviceObj = {
          id: item.id,
          title: item.title,
          status: item.status,
          location: item.location,
          technician: tech,
          creationDate: item.created_at,
          team_id: item.team_id,
          description: item.description || ''
        };

        result.push(serviceObj);
      }
    }
    
    // Cast only at the end
    return result as Service[];
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
    
    // Create technician object with minimal typing
    const tech = technicianData ? {
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

    // Build service object with minimal structure
    const serviceObj = {
      id: data.id,
      title: data.title,
      status: data.status,
      location: data.location,
      technician: tech,
      creationDate: data.created_at,
      description: data.description || '',
      team_id: data.team_id
    };
    
    // Cast to Service only at return
    return serviceObj as Service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
