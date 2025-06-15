
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

/**
 * Busca todos os serviços VINCULADOS AO técnico logado,
 * sempre garantindo a presença do campo .technician.
 */
export function useTechnicianServices() {
  const { user } = useAuth();

  return useQuery<Service[]>({
    queryKey: ['technician-services', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("[useTechnicianServices] Nenhum usuário logado.");
        return [];
      }
      
      // Buscar todos os service_ids vinculados a este técnico
      const { data: stData, error: stError } = await supabase
        .from('service_technicians')
        .select('service_id')
        .eq('technician_id', user.id);

      if (stError) {
        console.error("[useTechnicianServices] Erro ao buscar vinculações de serviços do técnico:", stError);
        throw new Error(stError.message);
      }

      const serviceIds = stData?.map((row: any) => row.service_id) ?? [];
      console.log("[useTechnicianServices] service_technicians encontrados para técnico:", user.id, serviceIds);

      if (serviceIds.length === 0) {
        console.warn("[useTechnicianServices] Nenhuma demanda vinculada ao técnico.");
        return [];
      }

      const { data: servicesData, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('id', serviceIds);

      if (servicesError) {
        console.error("[useTechnicianServices] Erro ao buscar serviços vinculados ao técnico:", servicesError);
        throw new Error(servicesError.message);
      }

      console.log("[useTechnicianServices] Serviços retornados:", servicesData);

      // Adiciona manualmente os dados do técnico (que está logado)
      return (servicesData ?? []).map((service: any) => ({
        ...service,
        technician: {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '',
          role: 'tecnico',
        }
      })) as Service[];
    },
    enabled: !!user,
  });
}
