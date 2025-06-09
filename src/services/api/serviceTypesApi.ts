
import { supabase } from '@/integrations/supabase/client';
import { ServiceType } from '@/types/serviceTypes';
import { toast } from 'sonner';

// Get all service types using edge function
export const getServiceTypes = async (): Promise<ServiceType[]> => {
  try {
    console.log('Fetching service types from edge function...');
    
    const { data, error } = await supabase.functions.invoke('get_service_types_data');
    
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
    const serviceTypes = await getServiceTypes();
    return serviceTypes.find(type => type.id === id) || null;
  } catch (error) {
    console.error('Error in getServiceTypeById:', error);
    return null;
  }
};

// Create default service types - simplified version
export const createDefaultServiceTypes = async (): Promise<boolean> => {
  try {
    console.log('Service types are managed via edge function');
    return true;
  } catch (error) {
    console.error('Error in createDefaultServiceTypes:', error);
    return false;
  }
};
