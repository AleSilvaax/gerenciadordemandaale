
import { useState, useEffect, useMemo } from 'react';
import { Service } from '@/types/serviceTypes';
import { getServicesFromDatabase } from '@/services/serviceCrud';
import { toast } from "sonner";

export const useConsolidatedServices = () => {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = async () => {
    try {
      setIsLoading(true);
      console.log('[useConsolidatedServices] Iniciando busca de serviços...');
      
      const data = await getServicesFromDatabase();
      console.log('[useConsolidatedServices] Serviços recebidos:', data.length);
      
      setServices(data);
      setError(null);
    } catch (err: any) {
      console.error('[useConsolidatedServices] Erro ao buscar serviços:', err);
      setError(err.message || 'Erro ao carregar serviços');
      toast.error('Erro ao carregar serviços');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  // Estatísticas consolidadas
  const statistics = useMemo(() => {
    const total = services.length;
    const pending = services.filter(s => s.status === 'pendente').length;
    const completed = services.filter(s => s.status === 'concluido').length;
    const cancelled = services.filter(s => s.status === 'cancelado').length;
    
    // Serviços atrasados (vencidos e ainda pendentes)
    const overdue = services.filter(s => {
      if (s.status !== 'pendente' || !s.dueDate) return false;
      return new Date(s.dueDate) < new Date();
    }).length;

    // Serviços por prioridade
    const highPriority = services.filter(s => s.priority === 'alta').length;
    const mediumPriority = services.filter(s => s.priority === 'media').length;
    const lowPriority = services.filter(s => s.priority === 'baixa').length;

    // Serviços por tipo
    const byType = services.reduce((acc, service) => {
      const type = service.serviceType || 'Não definido';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      pending,
      completed,
      cancelled,
      overdue,
      byPriority: {
        high: highPriority,
        medium: mediumPriority,
        low: lowPriority
      },
      byType,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  }, [services]);

  // Filtros e ordenação
  const getFilteredServices = (filters: {
    status?: string;
    priority?: string;
    technician?: string;
    serviceType?: string;
    search?: string;
  }) => {
    return services.filter(service => {
      if (filters.status && service.status !== filters.status) return false;
      if (filters.priority && service.priority !== filters.priority) return false;
      if (filters.technician && service.technician?.id !== filters.technician) return false;
      if (filters.serviceType && service.serviceType !== filters.serviceType) return false;
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const searchableText = [
          service.title,
          service.description,
          service.client,
          service.location,
          service.number
        ].join(' ').toLowerCase();
        
        if (!searchableText.includes(searchTerm)) return false;
      }
      return true;
    });
  };

  const refreshServices = () => {
    fetchServices();
  };

  return {
    services,
    isLoading,
    error,
    statistics,
    getFilteredServices,
    refreshServices
  };
};
