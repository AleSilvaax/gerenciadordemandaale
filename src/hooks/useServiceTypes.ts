
import { useState, useEffect } from 'react';
import { getServiceTypesFromDatabase } from '@/services/serviceTypesService';
import { ServiceTypeConfig } from '@/types/serviceTypes';

export const useServiceTypes = () => {
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceTypes = async () => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('[useServiceTypes] Carregando todos os tipos de serviço...');
      
      const types = await getServiceTypesFromDatabase();
      console.log('[useServiceTypes] Tipos carregados:', types.length);
      console.log('[useServiceTypes] Lista de tipos:', types.map(t => t.name));
      
      setServiceTypes(types);
    } catch (err) {
      console.error('[useServiceTypes] Erro ao carregar tipos:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      
      // Fallback: tipos padrão se houver erro
      setServiceTypes([
        { id: '1', name: 'Vistoria', description: 'Vistoria padrão', technicalFields: [] },
        { id: '2', name: 'Instalação', description: 'Instalação padrão', technicalFields: [] },
        { id: '3', name: 'Manutenção', description: 'Manutenção padrão', technicalFields: [] }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServiceTypes();
  }, []);

  return {
    serviceTypes,
    isLoading,
    error,
    refetch: fetchServiceTypes,
  };
};
