
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Service, TeamMember } from "@/types/serviceTypes";
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
      if (!user) return [];
      // Seleciona os campos do technician também
      const { data, error } = await supabase
        .from('services')
        .select(`
          *,
          service_technicians!inner(technician_id),
          technician:technicians(*)
        `)
        .eq('service_technicians.technician_id', user.id);

      if (error) {
        console.error("Erro ao buscar serviços do técnico:", error);
        throw new Error(error.message);
      }

      // Pode ser necessário mapear caso o campo technician não venha como objeto
      return (data || []).map((s: any) => ({
        ...s,
        // compatibilidade: corrige para garantir que .technician exista no resultado
        technician: s.technician || {
          id: user.id,
          name: user.name,
          avatar: user.avatar,
          role: 'tecnico',
        }
      })) as Service[];
    },
    enabled: !!user,
  });
}
