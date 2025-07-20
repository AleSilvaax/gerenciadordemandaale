
import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { TechnicianSchedule, CalendarEvent, CreateScheduleData, UpdateScheduleData } from '@/types/calendarTypes';
import { useEnhancedAuth } from '@/context/EnhancedAuthContext';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';

const CALENDAR_QUERY_KEY = ['calendar'];

export const useCalendar = () => {
  const { user } = useEnhancedAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  // Fetch schedules based on user role
  const {
    data: schedules = [],
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: [...CALENDAR_QUERY_KEY, user?.id, user?.role],
    queryFn: async () => {
      if (!user) return [];

      let query = supabase
        .from('technician_schedule')
        .select(`
          *,
          profiles:technician_id (
            id,
            name
          ),
          services:service_id (
            id,
            number,
            title,
            client
          )
        `)
        .order('start_time', { ascending: true });

      // Se for técnico, só vê os próprios agendamentos
      if (user.role === 'tecnico') {
        query = query.eq('technician_id', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Calendar] Erro ao buscar agendamentos:', error);
        throw error;
      }

      return data || [];
    },
    enabled: !!user,
    staleTime: 2 * 60 * 1000, // 2 minutos
    gcTime: 5 * 60 * 1000, // 5 minutos
  });

  // Transform schedules to calendar events
  const calendarEvents = useMemo(() => {
    return schedules.map((schedule: any): CalendarEvent => ({
      id: schedule.id,
      title: schedule.title,
      start: parseISO(schedule.start_time),
      end: parseISO(schedule.end_time),
      description: schedule.description,
      status: schedule.status,
      technician: schedule.profiles ? {
        id: schedule.profiles.id,
        name: schedule.profiles.name
      } : undefined,
      service: schedule.services ? {
        id: schedule.services.id,
        number: schedule.services.number,
        client: schedule.services.client
      } : undefined,
      location: schedule.location
    }));
  }, [schedules]);

  // Create schedule mutation
  const createScheduleMutation = useMutation({
    mutationFn: async (data: CreateScheduleData) => {
      if (!user) throw new Error('Usuário não autenticado');

      const scheduleData = {
        ...data,
        technician_id: user.id,
        status: 'agendado' as const
      };

      const { data: newSchedule, error } = await supabase
        .from('technician_schedule')
        .insert(scheduleData)
        .select()
        .single();

      if (error) throw error;
      return newSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      toast.success('Agendamento criado com sucesso!');
    },
    onError: (error) => {
      console.error('[Calendar] Erro ao criar agendamento:', error);
      toast.error('Erro ao criar agendamento');
    }
  });

  // Update schedule mutation
  const updateScheduleMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateScheduleData }) => {
      const { data: updatedSchedule, error } = await supabase
        .from('technician_schedule')
        .update(data)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return updatedSchedule;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      toast.success('Agendamento atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('[Calendar] Erro ao atualizar agendamento:', error);
      toast.error('Erro ao atualizar agendamento');
    }
  });

  // Delete schedule mutation
  const deleteScheduleMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('technician_schedule')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CALENDAR_QUERY_KEY });
      toast.success('Agendamento removido com sucesso!');
    },
    onError: (error) => {
      console.error('[Calendar] Erro ao remover agendamento:', error);
      toast.error('Erro ao remover agendamento');
    }
  });

  // Get events for selected date
  const getDayEvents = (date: Date) => {
    const dayStart = format(date, 'yyyy-MM-dd');
    return calendarEvents.filter(event => 
      format(event.start, 'yyyy-MM-dd') === dayStart
    );
  };

  // Check for conflicts
  const checkConflicts = (startTime: string, endTime: string, excludeId?: string) => {
    const newStart = parseISO(startTime);
    const newEnd = parseISO(endTime);

    return calendarEvents.filter(event => {
      if (excludeId && event.id === excludeId) return false;
      
      const eventStart = event.start;
      const eventEnd = event.end;

      return (
        (newStart >= eventStart && newStart < eventEnd) ||
        (newEnd > eventStart && newEnd <= eventEnd) ||
        (newStart <= eventStart && newEnd >= eventEnd)
      );
    });
  };

  return {
    // Data
    schedules,
    calendarEvents,
    selectedDate,
    
    // State
    isLoading,
    error,
    
    // Actions
    setSelectedDate,
    createSchedule: createScheduleMutation.mutate,
    updateSchedule: updateScheduleMutation.mutate,
    deleteSchedule: deleteScheduleMutation.mutate,
    getDayEvents,
    checkConflicts,
    refetch,
    
    // Loading states
    isCreating: createScheduleMutation.isPending,
    isUpdating: updateScheduleMutation.isPending,
    isDeleting: deleteScheduleMutation.isPending,
  };
};
