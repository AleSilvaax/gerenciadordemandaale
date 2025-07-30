// Arquivo: src/hooks/useCalendar.ts (VERSÃO DE RECONSTRUÇÃO - PASSO 1)

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Service } from '@/types/serviceTypes'; // Usaremos o tipo Service por enquanto

export const useCalendar = () => {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const {
    data: rawServices = [], // Os dados brutos do banco
    isLoading,
    error,
    refetch
  } = useQuery<Service[]>({ // Esperamos um array de Service
    queryKey: ['calendar-raw-services', user?.id],
    
    queryFn: async () => {
      if (!user) return [];

      // A mesma consulta segura que já validamos
      let query = supabase
        .from('services')
        .select(`
          *,
          service_technicians!inner (
            profiles (
              id,
              name,
              avatar
            )
          )
        `)
        .not('due_date', 'is', null); // Apenas serviços com data são eventos

      // Aplicando a lógica de permissão
      if (user.role === 'tecnico') {
        query = query.filter('service_technicians.technician_id', 'eq', user.id);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Calendar simplified] Erro ao buscar serviços:', error);
        throw error;
      }
      
      return data || [];
    },
    enabled: !!user,
  });

  return {
    rawServices, // Por enquanto, vamos expor os dados brutos
    isLoading,
    error,
    selectedDate,
    setSelectedDate,
    refetchCalendar: refetch,
  };
};
