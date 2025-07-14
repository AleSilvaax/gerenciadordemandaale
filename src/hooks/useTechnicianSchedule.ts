
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
      
      // Por enquanto, usando uma query raw até os tipos serem atualizados
      const { data, error } = await supabase
        .rpc('get_technician_schedule', {
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString(),
          technician_id: technicianId || user?.id
        });

      if (error) {
        console.log('Tabela technician_schedule ainda não disponível nos tipos:', error);
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
      // Por enquanto retorna sucesso mockado
      toast.success('Agendamento será criado quando a funcionalidade estiver completa');
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
