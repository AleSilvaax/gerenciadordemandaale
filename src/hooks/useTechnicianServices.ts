
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getServicesFromDatabase } from '@/services/servicesDataService';
import { Service } from '@/types/serviceTypes';

export const useTechnicianServices = () => {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTechnicianServices = async () => {
      if (!user || user.role !== 'tecnico') {
        setServices([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log('[TechnicianServices] Buscando serviços do técnico:', user.id);
        
        const allServices = await getServicesFromDatabase();
        
        // Filtrar apenas os serviços atribuídos ao técnico logado
        const technicianServices = allServices.filter(service => 
          service.technician && service.technician.id === user.id
        );
        
        console.log('[TechnicianServices] Serviços encontrados:', technicianServices.length);
        setServices(technicianServices);
        
      } catch (err) {
        console.error('[TechnicianServices] Erro ao buscar serviços:', err);
        setError('Erro ao carregar suas demandas');
        setServices([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTechnicianServices();
  }, [user]);

  const refreshServices = async () => {
    if (!user || user.role !== 'tecnico') return;
    
    try {
      const allServices = await getServicesFromDatabase();
      const technicianServices = allServices.filter(service => 
        service.technician && service.technician.id === user.id
      );
      setServices(technicianServices);
    } catch (err) {
      console.error('[TechnicianServices] Erro ao atualizar serviços:', err);
    }
  };

  return {
    services,
    isLoading,
    error,
    refreshServices
  };
};
