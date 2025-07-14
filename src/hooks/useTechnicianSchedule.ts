
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import { startOfDay, endOfDay } from 'date-fns';

interface ScheduleEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  location?: string;
  service_id?: string;
  technician_id: string;
  status: string;
  created_at: string;
}

export function useTechnicianSchedule(selectedDate?: Date) {
  const { user } = useAuth();
  const [events, setEvents] = useState<ScheduleEvent[]>([]);
  const [technicians, setTechnicians] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load technicians for admins/managers
  useEffect(() => {
    const loadTechnicians = async () => {
      if (user?.role === 'administrador' || user?.role === 'gestor') {
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select(`
              id, name, avatar,
              user_roles!inner(role)
            `)
            .eq('user_roles.role', 'tecnico');

          if (error) throw error;
          setTechnicians(data || []);
        } catch (error) {
          console.error('Erro ao carregar técnicos:', error);
        }
      }
    };

    loadTechnicians();
  }, [user]);

  // Load events for selected date and technician
  const loadEvents = async (technicianId?: string) => {
    if (!selectedDate) return;

    setIsLoading(true);
    try {
      const startDate = startOfDay(selectedDate);
      const endDate = endOfDay(selectedDate);
      
      // Buscar eventos diretamente da tabela technician_schedule
      const { data, error } = await supabase
        .from('technician_schedule')
        .select('*')
        .eq('technician_id', technicianId || user?.id)
        .gte('start_time', startDate.toISOString())
        .lte('end_time', endDate.toISOString());

      if (error) {
        console.error('Erro ao carregar eventos:', error);
        setEvents([]);
        return;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Erro ao carregar eventos:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const createEvent = async (eventData: Omit<ScheduleEvent, 'id' | 'created_at'>) => {
    try {
      const { data, error } = await supabase
        .from('technician_schedule')
        .insert([eventData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Agendamento criado com sucesso!');
      return true;
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      toast.error('Erro ao criar evento');
      return false;
    }
  };

  useEffect(() => {
    if (selectedDate && user) {
      loadEvents();
    }
  }, [selectedDate, user]);

  return {
    events,
    technicians,
    isLoading,
    loadEvents,
    createEvent
  };
}
