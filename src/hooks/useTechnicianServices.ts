
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

/**
 * Busca todos os serviços VINCULADOS AO técnico logado
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
      
      console.log("[useTechnicianServices] Buscando serviços para técnico:", user.id);
      
      // Buscar IDs dos serviços vinculados ao técnico
      const { data: assignments, error: assignmentsError } = await supabase
        .from('service_technicians')
        .select('service_id')
        .eq('technician_id', user.id);

      if (assignmentsError) {
        console.error("[useTechnicianServices] Erro ao buscar atribuições:", assignmentsError);
        throw new Error(assignmentsError.message);
      }

      const serviceIds = assignments?.map(a => a.service_id) || [];
      console.log("[useTechnicianServices] Service IDs encontrados:", serviceIds);

      if (serviceIds.length === 0) {
        console.log("[useTechnicianServices] Nenhuma demanda atribuída ao técnico.");
        return [];
      }

      // Buscar os serviços completos
      const { data: services, error: servicesError } = await supabase
        .from('services')
        .select('*')
        .in('id', serviceIds);

      if (servicesError) {
        console.error("[useTechnicianServices] Erro ao buscar serviços:", servicesError);
        throw new Error(servicesError.message);
      }

      console.log("[useTechnicianServices] Serviços encontrados:", services);

      // Transformar para o formato esperado
      return (services || []).map((service: any) => ({
        ...service,
        technician: {
          id: user.id,
          name: user.name,
          avatar: user.avatar || '',
          role: 'tecnico',
        },
        status: service.status || 'pendente',
        priority: service.priority || 'media',
        serviceType: service.service_type || 'Vistoria',
        messages: [],
      })) as Service[];
    },
    enabled: !!user,
  });
}
