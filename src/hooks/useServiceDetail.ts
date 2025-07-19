
import { useState, useEffect } from 'react';
import { Service } from '@/types/serviceTypes';
import { getService } from '@/services/servicesDataService';
import { toast } from "sonner";

export const useServiceDetail = (serviceId: string | undefined) => {
  const [service, setService] = useState<Service | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchService = async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.log('[useServiceDetail] Buscando serviço:', id);
      
      const serviceData = await getService(id);
      
      if (serviceData) {
        console.log('[useServiceDetail] Serviço encontrado:', serviceData);
        setService(serviceData);
      } else {
        console.log('[useServiceDetail] Serviço não encontrado');
        setError('Serviço não encontrado');
        toast.error('Serviço não encontrado');
      }
    } catch (err: any) {
      console.error('[useServiceDetail] Erro ao buscar serviço:', err);
      const errorMessage = err.message || 'Erro ao carregar serviço';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (serviceId) {
      fetchService(serviceId);
    } else {
      setService(null);
      setIsLoading(false);
      setError(null);
    }
  }, [serviceId]);

  const refreshService = () => {
    if (serviceId) {
      fetchService(serviceId);
    }
  };

  const updateService = (updatedService: Service) => {
    setService(updatedService);
  };

  return {
    service,
    isLoading,
    error,
    refreshService,
    updateService
  };
};
