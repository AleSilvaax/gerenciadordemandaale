import { supabase, handleDatabaseError } from './baseService';
import { Service, ServiceStatus, TeamMember, UserRole } from '@/types/serviceTypes';

// Definir tipos simples para evitar inferência complexa
interface BasicServiceRow {
  id: string;
  title: string;
  status: string;
  location: string;
  created_at: string;
  updated_at: string;
  number: string;
  team_id?: string | null;
  description?: string | null;
  service_type_id?: string | null;
}

interface TechnicianRow {
  service_id: string;
  technician_id: string;
  profiles: {
    id: string;
    name: string;
    avatar: string;
  } | null;
}

// Buscar todos os serviços
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    console.log('Fetching services from database...');
    
    // Buscar serviços com seleção explícita de colunas
    let query = supabase
      .from('services')
      .select('id, title, status, location, created_at, updated_at, number, team_id, description, service_type_id');
    
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data: servicesData, error: servicesError } = await query.order('created_at', { ascending: false });
    
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

    // Buscar tipos de serviço via edge function
    let serviceTypesData: any[] = [];
    try {
      const { data: typesData } = await supabase.functions.invoke('get_service_types_data');
      if (typesData && Array.isArray(typesData)) {
        serviceTypesData = typesData;
      }
    } catch (error) {
      console.error("Erro ao buscar tipos de serviço:", error);
    }
    
    // Construir array de serviços
    const services: Service[] = [];
    
    // Type cast to avoid deep inference issues
    const serviceRows = servicesData as unknown as BasicServiceRow[];
    
    for (const serviceRow of serviceRows) {
      // Encontrar técnico para este serviço
      let assignedTechnician: TeamMember = {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico' as UserRole
      };
      
      if (techniciansData) {
        const techRows = techniciansData as unknown as TechnicianRow[];
        for (const techData of techRows) {
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

      // Encontrar tipo de serviço
      let serviceType = undefined;
      if (serviceRow.service_type_id && serviceTypesData.length > 0) {
        const foundType = serviceTypesData.find((type: any) => type.id === serviceRow.service_type_id);
        if (foundType) {
          serviceType = {
            id: foundType.id,
            name: foundType.name,
            description: foundType.description || ''
          };
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
        team_id: serviceRow.team_id || undefined,
        description: serviceRow.description || '',
        serviceType: serviceType
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
      .select('id, title, status, location, created_at, updated_at, number, team_id, description, service_type_id')
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

    // Buscar tipo de serviço via edge function
    let serviceType = undefined;
    if (serviceData.service_type_id) {
      try {
        const { data: serviceTypesData } = await supabase.functions.invoke('get_service_types_data');
        if (serviceTypesData && Array.isArray(serviceTypesData)) {
          const foundType = serviceTypesData.find((type: any) => type.id === serviceData.service_type_id);
          if (foundType) {
            serviceType = {
              id: foundType.id,
              name: foundType.name,
              description: foundType.description || ''
            };
          }
        }
      } catch (error) {
        console.error('Error fetching service types:', error);
      }
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
    const serviceRow = serviceData as unknown as BasicServiceRow;
    const service: Service = {
      id: serviceRow.id,
      title: serviceRow.title,
      status: serviceRow.status as ServiceStatus,
      location: serviceRow.location,
      technician: assignedTechnician,
      creationDate: serviceRow.created_at,
      description: serviceRow.description || '',
      team_id: serviceRow.team_id || undefined,
      serviceType: serviceType
    };
    
    console.log('Service found:', service);
    return service;
  } catch (error) {
    console.error('Erro ao buscar detalhes do serviço:', error);
    return null;
  }
};
