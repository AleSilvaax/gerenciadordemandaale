import { useMemo } from 'react';
import { usePermissions } from '@/hooks/usePermissions';
import { useTechnicianServices } from '@/hooks/useTechnicianServices';
import { useConsolidatedServices } from '@/hooks/useConsolidatedServices';
import { Service } from '@/types/serviceTypes';

/**
 * Hook inteligente que decide automaticamente qual estratégia de busca usar
 * baseado no role do usuário logado
 */
export const useSmartServices = () => {
  const { user, hasRoleOrHigher } = usePermissions();
  
  // Para técnicos: usar serviços atribuídos
  const technicianServicesQuery = useTechnicianServices();
  
  // Para outros roles: usar serviços consolidados
  const consolidatedServicesQuery = useConsolidatedServices();
  
  // Determinar qual query usar baseado no role
  const shouldUseTechnicianView = useMemo(() => {
    if (!user?.role) return false;
    return user.role === 'tecnico' && !hasRoleOrHigher('gestor');
  }, [user?.role, hasRoleOrHigher]);
  
  // Retornar dados da query apropriada com interface unificada
  if (shouldUseTechnicianView) {
    return {
      ...technicianServicesQuery,
      services: technicianServicesQuery.data || [],
      isTechnicianView: shouldUseTechnicianView,
      isManager: hasRoleOrHigher('gestor'),
      isAdmin: hasRoleOrHigher('administrador'),
    };
  }
  
  return {
    ...consolidatedServicesQuery,
    services: consolidatedServicesQuery.services || [],
    isTechnicianView: shouldUseTechnicianView,
    isManager: hasRoleOrHigher('gestor'),
    isAdmin: hasRoleOrHigher('administrador'),
    // Manter compatibilidade com refreshServices
    refreshServices: consolidatedServicesQuery.actions?.refreshServices,
  };
};