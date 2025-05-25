
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
    // Build query step by step with explicit typing
    let query = supabase.from('services').select('*');
    
    // Add team filter if provided
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    // Execute query and cast result explicitly
    const { data: servicesData, error } = await query.order('created_at', { ascending: false });
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Get technicians separately with explicit typing
    const { data: techniciansData, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Process services with explicit type handling
    const services: Service[] = [];
    
    if (servicesData) {
      for (const serviceRow of servicesData) {
        // Cast to our known type explicitly
        const dbService = serviceRow as ServiceFromDB;
        
        // Find technician with explicit type handling
        let assignedTechnician: TeamMember;
        
        if (techniciansData) {
          // Find technician data manually to avoid type inference issues
          let techData: any = null;
          for (const tech of techniciansData) {
            if (tech.service_id === dbService.id) {
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
          id: dbService.id,
          title: dbService.title,
          status: dbService.status as ServiceStatus,
          location: dbService.location,
          technician: assignedTechnician,
          creationDate: dbService.created_at,
          team_id: dbService.team_id,
          description: dbService.description || ''
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
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error("Erro ao buscar detalhes do serviço:", error);
      throw error;
    }

    if (!data) return null;
    
    // Cast to our known type
    const dbService = data as ServiceFromDB;
    
    // Get technician with explicit query
    const { data: technicianData, error: techError } = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle();
    
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
      id: dbService.id,
      title: dbService.title,
      status: dbService.status as ServiceStatus,
      location: dbService.location,
      technician: assignedTechnician,
      creationDate: dbService.created_at,
      description: dbService.description || '',
      team_id: dbService.team_id
    };
    
    return service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
