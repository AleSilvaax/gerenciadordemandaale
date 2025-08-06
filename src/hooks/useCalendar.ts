
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendarTypes';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { parseISO, isValid } from 'date-fns';

const CALENDAR_QUERY_KEY = ['calendar-events'];

export const useCalendar = () => {
  const { user } = useEnhancedAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: calendarEvents = [],
    isLoading,
    error,
    refetch
  } = useQuery<CalendarEvent[]>({
    queryKey: [...CALENDAR_QUERY_KEY, user?.id],
    
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!user) return [];

      let query = supabase
        .from('services')
        .select(`
          id,
          title,
          description,
          status,
          due_date,
          number,
          client,
          location,
          service_technicians!inner (
            profiles (
              id,
              name
            )
          )
        `)
        .not('due_date', 'is', null);

      if (user.role === 'tecnico') {
        query = query.filter('service_technicians.technician_id', 'eq', user.id);
      }

      const { data: servicesData, error: servicesError } = await query;

      if (servicesError) {
        console.error('[Calendar] Erro ao buscar serviços:', servicesError);
        throw servicesError;
      }
      
      if (!servicesData) return [];

      const events = servicesData.map((service: any): CalendarEvent | null => {
        const startDate = parseISO(service.due_date);
        if (!isValid(startDate)) return null;

        const technicianProfile = service.service_technicians?.[0]?.profiles;

        let eventStatus: CalendarEvent['status'] = 'agendado';
        if (service.status === 'concluido') eventStatus = 'concluido';
        if (service.status === 'cancelado') eventStatus = 'cancelado';

        return {
          id: service.id,
          title: service.title,
          start: startDate,
          end: startDate,
          description: service.description,
          status: eventStatus,
          location: service.location,
          technician: technicianProfile ? {
              id: technicianProfile.id,
              name: technicianProfile.name || 'Técnico'
          } : undefined,
          service: {
              id: service.id,
              number: service.number,
              client: service.client
          }
        };
      }).filter((event): event is CalendarEvent => event !== null);

      return events;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const dayEvents = useMemo(() => {
    const selectedDayString = selectedDate.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDayString = event.start.toISOString().split('T')[0];
      return eventDayString === selectedDayString;
    });
  }, [selectedDate, calendarEvents]);

  return {
    calendarEvents,
    dayEvents,
    selectedDate,
    setSelectedDate,
    isLoading,
    error,
    refetchCalendar: refetch,
  };
};
