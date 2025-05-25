
import { supabase, handleDatabaseError } from './baseService';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';

// Tipos simples para dados do banco
type DatabaseService = {
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

type DatabaseTechnician = {
  service_id: string;
  technician_id: string;
  profiles: {
    id: string;
    name: string | null;
    avatar: string | null;
  };
}

// Buscar todos os serviços
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    // Query simples para serviços
    let query = supabase.from('services').select('*');
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const servicesResponse = await query.order('created_at', { ascending: false });
    
    if (servicesResponse.error) {
      console.error("Erro ao buscar serviços:", servicesResponse.error);
      throw servicesResponse.error;
    }

    const servicesData = servicesResponse.data as DatabaseService[];
    
    // Query simples para técnicos
    const techniciansResponse = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    if (techniciansResponse.error) {
      console.error("Erro ao buscar técnicos:", techniciansResponse.error);
    }
    
    const techniciansData = techniciansResponse.data as DatabaseTechnician[];
    
    // Construir array de serviços manualmente
    const services: Service[] = [];
    
    if (servicesData) {
      for (const serviceRow of servicesData) {
        // Encontrar técnico para este serviço
        let assignedTechnician: TeamMember = {
          id: '0',
          name: 'Não atribuído',
          avatar: '',
          role: 'tecnico' as UserRole
        };
        
        if (techniciansData) {
          for (const techData of techniciansData) {
            if (techData.service_id === serviceRow.id && techData.profiles) {
              assignedTechnician = {
                id: techData.technician_id,
                name: techData.profiles.name || 'Sem nome',
                avatar: techData.profiles.avatar || '',
                role: 'tecnico' as UserRole
              };
              break;
            }
          }
        }

        // Criar objeto de serviço
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

// Buscar serviço por ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    const serviceResponse = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (serviceResponse.error) {
      console.error("Erro ao buscar detalhes do serviço:", serviceResponse.error);
      throw serviceResponse.error;
    }

    const serviceData = serviceResponse.data as DatabaseService;
    
    if (!serviceData) return null;
    
    // Buscar técnico
    const technicianResponse = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle();
    
    const technicianData = technicianResponse.data as DatabaseTechnician | null;
    
    // Criar objeto técnico
    let assignedTechnician: TeamMember = {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico' as UserRole
    };
    
    if (technicianData && technicianData.profiles) {
      assignedTechnician = {
        id: technicianData.technician_id,
        name: technicianData.profiles.name || 'Sem nome',
        avatar: technicianData.profiles.avatar || '',
        role: 'tecnico' as UserRole
      };
    }

    // Criar objeto de serviço
    const service: Service = {
      id: serviceData.id,
      title: serviceData.title,
      status: serviceData.status as ServiceStatus,
      location: serviceData.location,
      technician: assignedTechnician,
      creationDate: serviceData.created_at,
      description: serviceData.description || '',
      team_id: serviceData.team_id
    };
    
    return service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
