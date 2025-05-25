
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
    // Build and execute query with explicit typing to avoid deep inference
    const queryBuilder = supabase.from('services').select('*');
    
    // Add team filter if provided
    const finalQuery = teamId ? queryBuilder.eq('team_id', teamId) : queryBuilder;
    
    // Execute with explicit result typing
    const servicesResult = await finalQuery.order('created_at', { ascending: false }) as {
      data: ServiceFromDB[] | null;
      error: any;
    };
    
    const { data: servicesData, error } = servicesResult;
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Get technicians separately with explicit typing
    const techniciansResult = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `) as {
      data: TechnicianWithProfile[] | null;
      error: any;
    };
    
    const { data: techniciansData, error: techError } = techniciansResult;
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Process services with explicit type handling
    const services: Service[] = [];
    
    if (servicesData) {
      for (const serviceRow of servicesData) {
        // Find technician with explicit type handling
        let assignedTechnician: TeamMember;
        
        if (techniciansData) {
          // Find technician data manually to avoid type inference issues
          let techData: TechnicianWithProfile | null = null;
          for (const tech of techniciansData) {
            if (tech.service_id === serviceRow.id) {
              techData = tech;
              break;
            }
          }
          
          if (techData && techData.profiles) {
            assignedTechnician = {
              id: techData.technician_id,
              name: techData.profiles.name || 'Sem nome',
              avatar: techData.profiles.avatar || '',
              role: 'tecnico' as UserRole
            };
          } else {
            assignedTechnician = {
              id: '0',
              name: 'Não atribuído',
              avatar: '',
              role: 'tecnico' as UserRole
            };
          }
        } else {
          assignedTechnician = {
            id: '0',
            name: 'Não atribuído',
            avatar: '',
            role: 'tecnico' as UserRole
          };
        }

        // Create service object with explicit typing
        const service: Service = {
          id: serviceRow.id,
          title: serviceRow.title,
          status: serviceRow.status as ServiceStatus,
          location: serviceRow.location,
          technician: assignedTechnician,
          creationDate: serviceRow.created_at,
          team_id: serviceRow.team_id,
          description: serviceRow.description || ''
        };

        services.push(service);
      }
    }
    
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Get a specific service by ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceResult = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single() as {
      data: ServiceFromDB | null;
      error: any;
    };
    
    const { data, error } = serviceResult;
    
    if (error) {
      console.error("Erro ao buscar detalhes do serviço:", error);
      throw error;
    }

    if (!data) return null;
    
    // Get technician with explicit query
    const technicianResult = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle() as {
      data: TechnicianWithProfile | null;
      error: any;
    };
    
    const { data: technicianData, error: techError } = technicianResult;
    
    // Create technician object with explicit typing
    let assignedTechnician: TeamMember;
    
    if (technicianData && technicianData.profiles) {
      assignedTechnician = {
        id: technicianData.technician_id,
        name: technicianData.profiles.name || 'Sem nome',
        avatar: technicianData.profiles.avatar || '',
        role: 'tecnico' as UserRole
      };
    } else {
      assignedTechnician = {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico' as UserRole
      };
    }

    // Create service object
    const service: Service = {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      technician: assignedTechnician,
      creationDate: data.created_at,
      description: data.description || '',
      team_id: data.team_id
    };
    
    return service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
