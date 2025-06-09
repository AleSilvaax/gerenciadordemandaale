
import { supabase } from '@/integrations/supabase/client';
import { ServiceType } from '@/types/serviceTypes';
import { toast } from 'sonner';

// Get all service types from database
export const getServiceTypes = async (): Promise<ServiceType[]> => {
  try {
    console.log('Fetching service types from database...');
    
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .order('name');
    
    if (error) {
      console.error('Error fetching service types:', error);
      return getDefaultServiceTypes();
    }
    
    if (!data || data.length === 0) {
      console.log('No service types found, returning defaults');
      return getDefaultServiceTypes();
    }
    
    return data.map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description || '',
      estimatedHours: item.estimated_hours || 0,
      defaultPriority: item.default_priority as any || 'media'
    }));
  } catch (error) {
    console.error('Error in getServiceTypes:', error);
    return getDefaultServiceTypes();
  }
};

// Fallback to default service types
const getDefaultServiceTypes = (): ServiceType[] => {
  return [
    {
      id: '1',
      name: 'Manutenção Preventiva',
      description: 'Serviços de manutenção preventiva em equipamentos',
      estimatedHours: 2,
      defaultPriority: 'media'
    },
    {
      id: '2',
      name: 'Manutenção Corretiva',
      description: 'Reparos e correções em equipamentos com defeito',
      estimatedHours: 4,
      defaultPriority: 'alta'
    },
    {
      id: '3',
      name: 'Instalação',
      description: 'Instalação de novos equipamentos ou sistemas',
      estimatedHours: 6,
      defaultPriority: 'media'
    },
    {
      id: '4',
      name: 'Inspeção',
      description: 'Inspeção técnica e avaliação de equipamentos',
      estimatedHours: 1,
      defaultPriority: 'baixa'
    },
    {
      id: '5',
      name: 'Emergência',
      description: 'Atendimento de emergência para problemas críticos',
      estimatedHours: 8,
      defaultPriority: 'urgente'
    }
  ];
};

// Get service type by ID
export const getServiceTypeById = async (id: string): Promise<ServiceType | null> => {
  try {
    const { data, error } = await supabase
      .from('service_types')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) {
      console.error('Error fetching service type by ID:', error);
      const serviceTypes = await getServiceTypes();
      return serviceTypes.find(type => type.id === id) || null;
    }
    
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

// Create default service types - now works with database
export const createDefaultServiceTypes = async (): Promise<boolean> => {
  try {
    console.log('Checking if service types exist...');
    
    const { data: existingTypes } = await supabase
      .from('service_types')
      .select('id')
      .limit(1);
    
    if (existingTypes && existingTypes.length > 0) {
      console.log('Service types already exist');
      return true;
    }
    
    console.log('Creating default service types...');
    const defaultTypes = getDefaultServiceTypes();
    
    const { error } = await supabase
      .from('service_types')
      .insert(defaultTypes.map(type => ({
        name: type.name,
        description: type.description,
        estimated_hours: type.estimatedHours,
        default_priority: type.defaultPriority
      })));
    
    if (error) {
      console.error('Error creating default service types:', error);
      return false;
    }
    
    console.log('Default service types created successfully');
    return true;
  } catch (error) {
    console.error('Error in createDefaultServiceTypes:', error);
    return false;
  }
};
