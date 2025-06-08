
import { supabase } from '@/integrations/supabase/client';
import { ServiceType } from '@/types/serviceTypes';
import { toast } from 'sonner';

// Get all service types
export const getServiceTypes = async (): Promise<ServiceType[]> => {
  try {
    console.log('Fetching service types from database...');
    
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching service types:', error);
      throw error;
    }
    
    if (!data || data.length === 0) {
      console.log('No service types found');
      return [];
    }
    
    const serviceTypes: ServiceType[] = data.map(item => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      estimatedHours: item.estimated_hours || 0,
      defaultPriority: item.default_priority as any || 'media'
    }));
    
    console.log(`Found ${serviceTypes.length} service types`);
    return serviceTypes;
  } catch (error) {
    console.error('Error in getServiceTypes:', error);
    toast.error('Erro ao carregar tipos de serviço');
    return [];
  }
};

// Get service type by ID
export const getServiceTypeById = async (id: string): Promise<ServiceType | null> => {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching service type:', error);
      return null;
    }
    
    if (!data) return null;
    
    return {
      id: data.id,
      name: data.name,
      description: data.description || '',
      estimatedHours: data.estimated_hours || 0,
      defaultPriority: data.default_priority as any || 'media'
    };
  } catch (error) {
    console.error('Error in getServiceTypeById:', error);
    return null;
  }
};

// Create service types if they don't exist
export const createDefaultServiceTypes = async (): Promise<boolean> => {
  try {
    console.log('Checking for existing service types...');
    
    const { data: existing } = await supabase
      .from('service_types')
      .select('id')
      .limit(1);
    
    if (existing && existing.length > 0) {
      console.log('Service types already exist');
      return true;
    }
    
    console.log('Creating default service types...');
    
    const defaultTypes = [
      {
        name: 'Manutenção Preventiva',
        description: 'Serviços de manutenção preventiva em equipamentos',
        estimated_hours: 2,
        default_priority: 'media'
      },
      {
        name: 'Manutenção Corretiva',
        description: 'Reparos e correções em equipamentos com defeito',
        estimated_hours: 4,
        default_priority: 'alta'
      },
      {
        name: 'Instalação',
        description: 'Instalação de novos equipamentos ou sistemas',
        estimated_hours: 6,
        default_priority: 'media'
      },
      {
        name: 'Inspeção',
        description: 'Inspeção técnica e avaliação de equipamentos',
        estimated_hours: 1,
        default_priority: 'baixa'
      },
      {
        name: 'Emergência',
        description: 'Atendimento de emergência para problemas críticos',
        estimated_hours: 8,
        default_priority: 'urgente'
      }
    ];
    
    const { error } = await supabase
      .from('service_types')
      .insert(defaultTypes);
    
    if (error) {
      console.error('Error creating service types:', error);
      return false;
    }
    
    console.log('Default service types created successfully');
    toast.success('Tipos de serviço criados com sucesso!');
    return true;
  } catch (error) {
    console.error('Error in createDefaultServiceTypes:', error);
    return false;
  }
};
