
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

// Get all services from the database
export const getServicesFromDatabase = async (teamId?: string): Promise<Service[]> => {
  try {
    // Avoid complex type inference by using a more direct approach
    let result;
    
    // Create separate simple queries to avoid deep type instantiation
    if (teamId) {
      result = await supabase
        .from('services')
        .select('*')
        .eq('team_id', teamId)
        .order('created_at', { ascending: false });
    } else {
      result = await supabase
        .from('services')
        .select('*')
        .order('created_at', { ascending: false });
    }
    
    const data = result.data as ServiceFromDB[] | null;
    const error = result.error;
    
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

// Get a specific service by ID
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
