
import { ServiceType } from '@/types/serviceTypes';
import { getServiceTypes as getServiceTypesFromApi, createDefaultServiceTypes } from './api/serviceTypesApi';

// Get all service types
export const getServiceTypes = async (): Promise<ServiceType[]> => {
  console.log('Loading service types from database...');
  
  try {
    // First try to create default service types if they don't exist
    await createDefaultServiceTypes();
    
    // Then get all service types
    const serviceTypes = await getServiceTypesFromApi();
    
    if (serviceTypes.length === 0) {
      console.log('No service types found, returning empty array');
    }
    
    return serviceTypes;
  } catch (error) {
    console.error('Error in getServiceTypes:', error);
    return [];
  }
};

export const getServiceTypeById = async (id: string): Promise<ServiceType | null> => {
  try {
    const serviceTypes = await getServiceTypes();
    return serviceTypes.find(type => type.id === id) || null;
  } catch (error) {
    console.error('Error in getServiceTypeById:', error);
    return null;
  }
};
