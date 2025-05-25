
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
    const baseQuery = supabase.from('services');
    let query = baseQuery.select('*');
    
    // Add team filter if provided
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    // Execute query with explicit type assertion to avoid deep inference
    const servicesResult = await query.order('created_at', { ascending: false });
    const { data: servicesData, error } = servicesResult;
    
    if (error) {
      console.error("Erro ao buscar serviços:", error);
      throw error;
    }

    // Get technicians with explicit query
    const techniciansResult = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    const { data: technicians, error: techError } = techniciansResult;
    
    if (techError) {
      console.error("Erro ao buscar técnicos:", techError);
    }
    
    // Process services with simple object creation
    const services: Service[] = [];
    
    if (servicesData) {
      for (const serviceData of servicesData) {
        // Cast to our known type
        const dbService = serviceData as ServiceFromDB;
        
        // Find technician with simple logic
        let assignedTechnician: TeamMember;
        
        if (technicians) {
          const techData = technicians.find(t => t.service_id === dbService.id) as TechnicianWithProfile | undefined;
          
          if (techData) {
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

        // Create service object
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
    const serviceResult = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    const { data, error } = serviceResult;
    
    if (error) {
      console.error("Erro ao buscar detalhes do serviço:", error);
      throw error;
    }

    if (!data) return null;
    
    // Cast to our known type
    const dbService = data as ServiceFromDB;
    
    // Get technician with explicit query
    const technicianResult = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle();
    
    const { data: technicianData, error: techError } = technicianResult;
    
    // Create technician object
    let assignedTechnician: TeamMember;
    
    if (technicianData) {
      const techData = technicianData as { technician_id: string, profiles: { name: string | null, avatar: string | null } };
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
