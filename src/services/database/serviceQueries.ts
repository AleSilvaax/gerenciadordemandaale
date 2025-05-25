
import { supabase, handleDatabaseError } from './baseService';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';

// Buscar todos os serviços
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    console.log('Fetching services from database...');
    
    // Buscar serviços básicos
    const servicesQuery = supabase.from('services').select('*');
    if (teamId) {
      servicesQuery.eq('team_id', teamId);
    }
    
    const { data: servicesData, error: servicesError } = await servicesQuery.order('created_at', { ascending: false });
    
    if (servicesError) {
      console.error("Erro ao buscar serviços:", servicesError);
      return [];
    }

    if (!servicesData || servicesData.length === 0) {
      console.log('No services found');
      return [];
    }

    // Buscar técnicos
    const { data: techniciansData, error: techniciansError } = await supabase
      .from('service_technicians')
      .select(`
        service_id,
        technician_id,
        profiles!inner(id, name, avatar)
      `);
    
    if (techniciansError) {
      console.error("Erro ao buscar técnicos:", techniciansError);
    }
    
    // Construir array de serviços
    const services: Service[] = [];
    
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
            const profile = techData.profiles as any;
            assignedTechnician = {
              id: techData.technician_id,
              name: profile.name || 'Sem nome',
              avatar: profile.avatar || '',
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
    
    console.log(`Returning ${services.length} services`);
    return services;
  } catch (error) {
    console.error('Error fetching services:', error);
    return [];
  }
};

// Buscar serviço por ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    console.log('Fetching service by ID:', id);
    
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .single();
    
    if (serviceError) {
      console.error("Erro ao buscar detalhes do serviço:", serviceError);
      return null;
    }

    if (!serviceData) {
      console.log('Service not found');
      return null;
    }
    
    // Buscar técnico
    const { data: technicianData, error: technicianError } = await supabase
      .from('service_technicians')
      .select(`
        technician_id,
        profiles!inner(id, name, avatar)
      `)
      .eq('service_id', id)
      .maybeSingle();
    
    if (technicianError) {
      console.error("Erro ao buscar técnico:", technicianError);
    }
    
    // Criar objeto técnico
    let assignedTechnician: TeamMember = {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico' as UserRole
    };
    
    if (technicianData && technicianData.profiles) {
      const profile = technicianData.profiles as any;
      assignedTechnician = {
        id: technicianData.technician_id,
        name: profile.name || 'Sem nome',
        avatar: profile.avatar || '',
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
    
    console.log('Service found:', service);
    return service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
