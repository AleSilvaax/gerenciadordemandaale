
import { useCallback } from 'react';
import { Service } from '@/types/serviceTypes';
import { getServices, createService, updateService, deleteService } from '@/services/servicesDataService';
import { useAuditLog, AUDIT_ACTIONS, RESOURCE_TYPES } from './useAuditLog';
import { useIntelligentCache } from './useIntelligentCache';
import { toast } from 'sonner';

export const useAuditedServices = () => {
  const { logAction } = useAuditLog();
  
  const {
    data: services,
    isLoading,
    error,
    mutate,
    refresh,
    isStale
  } = useIntelligentCache<Service[]>(
    'services-list',
    getServices,
    {
      ttl: 2 * 60 * 1000, // 2 minutes
      staleWhileRevalidate: true
    }
  );

  const createServiceWithAudit = useCallback(async (serviceData: Omit<Service, 'id'>) => {
    try {
      const result = await createService(serviceData);
      
      // Handle the response structure from createService
      const newService = 'created' in result ? result.created : result;
      
      // Log the action
      await logAction(
        AUDIT_ACTIONS.CREATE,
        RESOURCE_TYPES.SERVICE,
        newService.id,
        undefined,
        extractRelevantFields(serviceData),
        { source: 'web_app' }
      );

      // Update cache optimistically
      mutate(current => current ? [newService, ...current] : [newService]);
      
      toast.success('Demanda criada com sucesso!');
      return newService;
    } catch (error) {
      toast.error('Erro ao criar demanda');
      throw error;
    }
  }, [logAction, mutate]);

  const updateServiceWithAudit = useCallback(async (
    serviceId: string, 
    updates: Partial<Service>,
    oldService?: Service
  ) => {
    try {
      const updatedService = await updateService({ id: serviceId, ...updates });
      
      // Log the action with before/after values
      await logAction(
        AUDIT_ACTIONS.UPDATE,
        RESOURCE_TYPES.SERVICE,
        serviceId,
        oldService ? extractRelevantFields(oldService) : undefined,
        extractRelevantFields(updates),
        { 
          source: 'web_app',
          fields_changed: Object.keys(updates)
        }
      );

      // Update cache optimistically
      mutate(current => 
        current?.map(service => 
          service.id === serviceId ? { ...service, ...updates } : service
        )
      );

      toast.success('Demanda atualizada com sucesso!');
      return updatedService;
    } catch (error) {
      toast.error('Erro ao atualizar demanda');
      throw error;
    }
  }, [logAction, mutate]);

  const deleteServiceWithAudit = useCallback(async (serviceId: string, serviceData?: Service) => {
    try {
      const success = await deleteService(serviceId);
      
      if (success) {
        // Log the action
        await logAction(
          AUDIT_ACTIONS.DELETE,
          RESOURCE_TYPES.SERVICE,
          serviceId,
          serviceData ? extractRelevantFields(serviceData) : undefined,
          undefined,
          { source: 'web_app' }
        );

        // Update cache optimistically
        mutate(current => current?.filter(service => service.id !== serviceId));
        
        toast.success('Demanda excluída com sucesso!');
      }
      
      return success;
    } catch (error) {
      toast.error('Erro ao excluir demanda');
      throw error;
    }
  }, [logAction, mutate]);

  const viewServiceWithAudit = useCallback(async (serviceId: string) => {
    try {
      await logAction(
        AUDIT_ACTIONS.VIEW,
        RESOURCE_TYPES.SERVICE,
        serviceId,
        undefined,
        undefined,
        { 
          source: 'web_app',
          timestamp: new Date().toISOString()
        }
      );
    } catch (error) {
      console.warn('Failed to log view action:', error);
    }
  }, [logAction]);

  return {
    services: services || [],
    isLoading,
    error,
    isStale,
    refresh,
    createService: createServiceWithAudit,
    updateService: updateServiceWithAudit,
    deleteService: deleteServiceWithAudit,
    viewService: viewServiceWithAudit,
    mutate
  };
};

// Helper function to extract relevant fields for audit logging
const extractRelevantFields = (service: Partial<Service>) => {
  return {
    title: service.title,
    status: service.status,
    priority: service.priority,
    client: service.client,
    location: service.location,
    description: service.description,
    serviceType: service.serviceType,
    date: service.date,
    dueDate: service.dueDate
  };
};
