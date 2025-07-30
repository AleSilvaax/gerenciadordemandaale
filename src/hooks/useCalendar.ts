// Arquivo: src/hooks/useCalendar.ts (VERSÃO FINAL E CORRIGIDA)

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendarTypes';
import { useAuth } from '@/context/AuthContext';
import { parseISO, isValid } from 'date-fns';

const CALENDAR_QUERY_KEY = ['calendar-events'];

export const useCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: calendarEvents = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, user?.id],
    
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!user) return [];

      console.log(`[Calendar] Buscando eventos para usuário: ${user.id} (${user.role})`);

      // ✅ Usando a tabela 'technician_schedule' confirmada pela imagem
      let query = supabase
        .from('technician_schedule')
        .select(`
          id,
          title,
          description,
          start_time,
          end_time,
          status,
          location,
          technician_id,
          service: service_id (
            id,
            number,
            client
          ),
          technician: technician_id (
            id,
            name,
            avatar
          )
        `);

      // Aplicando a lógica de permissão diretamente na consulta
      if (user.role === 'tecnico') {
        query = query.eq('technician_id', user.id);
      }

      const { data: scheduleData, error: scheduleError } = await query;

      if (scheduleError) {
        console.error('[Calendar] Erro ao buscar agendamentos:', scheduleError);
        throw scheduleError;
      }
      
      if (!scheduleData) return [];

      // Mapeamento preciso para o tipo CalendarEvent
      const events = scheduleData.map((item: any): CalendarEvent | null => {
        const startDate = parseISO(item.start_time);
        const endDate = parseISO(item.end_time);

        if (!isValid(startDate) || !isValid(endDate)) return null;

        return {
          id: item.id,
          title: item.title,
          start: startDate,
          end: endDate,
          description: item.description,
          status: item.status,
          location: item.location,
          technician: item.technician ? {
              id: item.technician.id,
              name: item.technician.name || 'Técnico',
          } : undefined,
          service: item.service ? {
              id: item.service.id,
              number: item.service.number,
              client: item.service.client
          } : undefined
        };
      }).filter((event): event is CalendarEvent => event !== null);

      console.log(`[Calendar] ${events.length} eventos formatados.`);
      return events;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });

  const dayEvents = useMemo(() => {
    if (!selectedDate) return [];
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
