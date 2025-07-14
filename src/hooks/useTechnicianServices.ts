
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";
import { useAuth } from "@/context/AuthContext";

export function useTechnicianServices() {
  const { user } = useAuth();

  return useQuery<Service[]>({
    queryKey: ['technician-services', user?.id],
    queryFn: async () => {
      if (!user) {
        console.log("[TECH-SERVICES] Nenhum usuário logado.");
        return [];
      }
      
      console.log("[TECH-SERVICES] Buscando serviços para técnico:", user.id);
      
      try {
        // Primeiro buscar IDs dos serviços vinculados ao técnico
        const { data: assignments, error: assignmentsError } = await supabase
          .from('service_technicians')
          .select('service_id')
          .eq('technician_id', user.id);

        console.log("[TECH-SERVICES] Query assignments executada:", { assignments, assignmentsError });

        if (assignmentsError) {
          console.error("[TECH-SERVICES] Erro ao buscar atribuições:", assignmentsError);
          return [];
        }

        const serviceIds = assignments?.map(a => a.service_id) || [];
        console.log("[TECH-SERVICES] Service IDs encontrados:", serviceIds);

        if (serviceIds.length === 0) {
          console.log("[TECH-SERVICES] Nenhuma demanda atribuída ao técnico.");
          return [];
        }

        // Buscar os serviços completos
        const { data: services, error: servicesError } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds);

        console.log("[TECH-SERVICES] Query services executada:", { services, servicesError });

        if (servicesError) {
          console.error("[TECH-SERVICES] Erro ao buscar serviços:", servicesError);
          return [];
        }

        console.log("[TECH-SERVICES] Serviços encontrados:", services?.length || 0);

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
      } catch (error) {
        console.error("[TECH-SERVICES] Erro geral:", error);
        return [];
      }
    },
    enabled: !!user && user.role === 'tecnico',
    retry: 1,
    staleTime: 30000,
    refetchOnWindowFocus: false,
  });
}
