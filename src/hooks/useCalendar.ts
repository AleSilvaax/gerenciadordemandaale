import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendarTypes';
import { useAuth } from '@/context/AuthContext';
import { format, parseISO, addDays } from 'date-fns';

const CALENDAR_QUERY_KEY = ['calendar'];

export const useCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: services = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('services')
        .select(`
          *,
          profiles:created_by (
            id,
            name
          )
        `)
        .order('created_at', { ascending: true });

      // Se for técnico, filtrar por serviços atribuídos
      if (user.role === 'tecnico') {
        const { data: technicianServices, error: techError } = await supabase
          .from('service_technicians')
          .select('service_id')
          .eq('technician_id', user.id);

        if (techError) {
          console.error('[Calendar] Erro ao buscar serviços do técnico:', techError);
          throw techError; // Propaga o erro para o react-query
        }

        // --- A CORREÇÃO ESTÁ AQUI ---
        // Se o técnico não tiver serviços, a lista de IDs estará vazia.
        const serviceIds = technicianServices?.map(st => st.service_id) || [];
        
        // Se a lista de IDs estiver vazia, não há nada para buscar.
        // Retornamos um array vazio imediatamente para evitar a requisição inválida.
        if (serviceIds.length === 0) {
          return [];
        }
        
        // Se houver IDs, aplicamos o filtro.
        query = query.in('id', serviceIds);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Calendar] Erro ao buscar serviços:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
  });

  // Transform services to calendar events
  const calendarEvents = useMemo(() => {
    return services.map((service: any): CalendarEvent => {
      const serviceDate = service.due_date ? parseISO(service.due_date) : parseISO(service.created_at);
      
      return {
        id: service.id,
        title: service.title,
        start: serviceDate,
        end: addDays(serviceDate, 1),
        description: service.description,
        status: service.status,
        technician: service.profiles ? {
          id: service.profiles.id,
          name: service.profiles.name
        } : undefined,
        service: {
          id: service.id,
          number: service.number,
          client: service.client
        },
        location: service.location
      };
    });
  }, [services]);

  // Get events for selected date
  const getDayEvents = (date: Date) => {
    const dayStart = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter(event => 
      format(event.start, 'yyyy-MM-dd') === dayStart
    );
  };

  return {
    schedules: services,
    calendarEvents,
    selectedDate,
    isLoading,
    error,
    setSelectedDate,
    getDayEvents,
    refetch,
    isCreating: false,
    isUpdating: false,
    isDeleting: false,
  };
};
