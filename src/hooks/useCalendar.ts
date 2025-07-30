// Arquivo: src/hooks/useCalendar.ts (VERSÃO FINAL E CORRIGIDA)

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { CalendarEvent } from '@/types/calendarTypes';
import { useAuth } from '@/context/AuthContext';
import { parseISO } from 'date-fns';

const CALENDAR_QUERY_KEY = ['calendar-events'];

export const useCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: calendarEvents = [], // O hook agora vai retornar os eventos já formatados
    isLoading,
    error,
    refetch
  } = useQuery({
    // A chave da query garante que os dados sejam re-buscados se o usuário mudar
    queryKey: [...CALENDAR_QUERY_KEY, user?.id],
    
    queryFn: async (): Promise<CalendarEvent[]> => {
      if (!user) return []; // Se não há usuário, não há eventos

      console.log(`[Calendar] Buscando eventos para usuário: ${user.id} (${user.role})`);

      // ✅ 1. A consulta agora é feita na tabela 'technician_schedule', que é a fonte correta para a agenda.
      // Se a sua lógica de agendamento está na tabela 'services', podemos ajustar.
      // Por agora, vamos assumir que 'technician_schedule' guarda os eventos.
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
          service: services (
            id,
            number,
            client
          ),
          technician: profiles (
            id,
            name,
            avatar
          )
        `);

      // ✅ 2. A LÓGICA DE PERMISSÃO APLICADA DIRETAMENTE NA CONSULTA
      // Se o usuário é um técnico, filtramos a busca para retornar apenas seus próprios agendamentos.
      if (user.role === 'tecnico') {
        query = query.eq('technician_id', user.id);
      }
      // Se for gestor ou admin, nenhum filtro é aplicado e todos os eventos são retornados.

      const { data: scheduleData, error: scheduleError } = await query;

      if (scheduleError) {
        console.error('[Calendar] Erro ao buscar agendamentos:', scheduleError);
        throw scheduleError;
      }
      
      if (!scheduleData) return [];

      // ✅ 3. A TRANSFORMAÇÃO É FEITA AQUI, UMA ÚNICA VEZ
      // Convertendo os dados do banco para o formato que o calendário espera.
      const events = scheduleData.map((item: any): CalendarEvent => ({
        id: item.id,
        title: item.title,
        start: parseISO(item.start_time),
        end: parseISO(item.end_time),
        description: item.description,
        status: item.status,
        location: item.location,
        technician: item.technician ? {
            id: item.technician.id,
            name: item.technician.name || 'Técnico',
            avatar: item.technician.avatar || ''
        } : undefined,
        service: item.service ? {
            id: item.service.id,
            number: item.service.number,
            client: item.service.client
        } : undefined
      }));

      console.log(`[Calendar] ${events.length} eventos formatados.`);
      return events;
    },
    // A busca só é ativada se houver um usuário logado
    enabled: !!user, 
    staleTime: 5 * 60 * 1000, // 5 minutos de cache
  });

  // Filtra os eventos do dia selecionado a partir da lista já formatada
  const dayEvents = useMemo(() => {
    const selectedDayString = selectedDate.toISOString().split('T')[0];
    return calendarEvents.filter(event => {
      const eventDayString = event.start.toISOString().split('T')[0];
      return eventDayString === selectedDayString;
    });
  }, [selectedDate, calendarEvents]);


  return {
    calendarEvents, // A lista completa de eventos para o calendário
    dayEvents,      // A lista de eventos apenas para o dia selecionado
    selectedDate,
    setSelectedDate,
    isLoading,
    error,
    refetchCalendar: refetch, // Renomeado para clareza
  };
};
