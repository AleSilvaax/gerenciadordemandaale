
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

/**
 * Fetches services assigned to the currently logged-in technician.
 * Always does a join with service_technicians.
 */
export function useTechnicianServices() {
  const { user } = useAuth();

  return useQuery<Service[]>({
    queryKey: ['technician-services', user?.id],
    queryFn: async () => {
      if (!user) return [];
      // Faz uma query que retorna todas as demandas em que o técnico está atribuído
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_technicians!inner(technician_id)
        `)
        .eq('service_technicians.technician_id', user.id);

      if (error) {
        console.error("Erro ao buscar serviços do técnico:", error);
        throw new Error(error.message);
      }

      return data as Service[];
    },
    enabled: !!user,
  });
}
