
import { useState, useEffect } from 'react';
import { getServiceTypesFromDatabase } from '@/services/servicesDataService';
import { ServiceTypeConfig } from '@/types/serviceTypes';

export const useServiceTypes = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const fetchServiceTypes = async () => {
      try {
        const types = await getServiceTypesFromDatabase();
        setServiceTypes(types);
      } catch (err) {
        setError(err as Error);
        console.error('Erro ao carregar tipos de serviço:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceTypes();
  }, []);

  return { serviceTypes, isLoading, error };
};
