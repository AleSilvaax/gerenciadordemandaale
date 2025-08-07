import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Service, ServiceStatus, ServicePriority } from '@/types/serviceTypes';
import { useAuth } from '@/context/AuthContext';

export const useTechnicianServices = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['technician-services', user?.id],
    queryFn: async (): Promise<Service[]> => {
      if (!user?.id) return [];

      console.log('[TECHNICIAN SERVICES] Buscando serviços para técnico:', user.id);

      // Com as novas políticas RLS simplificadas, buscar serviços diretamente
      // A política já filtra apenas os serviços visíveis para o técnico
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select(`
          *,
          service_technicians!inner(
            technician_id,
            profiles!inner(
              id,
              name,
              avatar
            )
          )
        `)
        .eq('service_technicians.technician_id', user.id)
        .order('created_at', { ascending: false });

      if (servicesError) {
        console.error('[TECHNICIAN SERVICES] Erro ao buscar serviços:', servicesError);
        throw servicesError;
      }

      console.log('[TECHNICIAN SERVICES] Serviços encontrados:', services?.length || 0);

      if (!services) return [];

      // Transformar dados para o formato esperado
      return services.map((service) => {
        const parseJsonField = (field: any) => {
          if (!field) return undefined;
          if (typeof field === 'object') return field;
          try { return JSON.parse(field); } catch { return undefined; }
        };

        const safePriority = ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
          ? service.priority as ServicePriority : 'media' as ServicePriority;
        const safeStatus = ['pendente', 'em_andamento', 'concluido', 'cancelado', 'agendado'].includes(service.status)
          ? service.status as ServiceStatus : 'pendente' as ServiceStatus;

        // Mapear técnicos (suporte a múltiplos técnicos)
        const technicians = service.service_technicians?.map((st: any) => ({
          id: st.profiles?.id || st.technician_id,
          name: st.profiles?.name || 'Técnico',
          avatar: st.profiles?.avatar || '',
          role: 'tecnico' as const
        })) || [];

        return {
          id: service.id,
          title: service.title || 'Sem título',
          location: service.location || 'Local não informado',
          status: safeStatus,
          technicians,
          creationDate: service.created_at,
          dueDate: service.due_date,
          priority: safePriority,
          serviceType: service.service_type || 'Vistoria',
          number: service.number,
          description: service.description,
          createdBy: service.created_by,
          client: service.client,
          address: service.address,
          city: service.city,
          notes: service.notes,
          estimatedHours: service.estimated_hours,
          customFields: parseJsonField(service.custom_fields) || [],
          signatures: parseJsonField(service.signatures) || {},
          feedback: parseJsonField(service.feedback),
          messages: [],
          photos: Array.isArray(service.photos) ? service.photos : [],
          photoTitles: Array.isArray(service.photo_titles) ? service.photo_titles : [],
          date: service.date,
        } as Service;
      });
    },
    enabled: !!user,
    retry: 2,
    staleTime: 30000,
  });
};