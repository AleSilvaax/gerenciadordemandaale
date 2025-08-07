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
    
    console.log('[SMART SERVICES] User role:', user.role);
    console.log('[SMART SERVICES] Has role gestor or higher:', hasRoleOrHigher('gestor'));
    
    // Técnicos puros (sem role de gestor ou superior) usam vista de técnico
    const isTechnician = user.role === 'tecnico' && !hasRoleOrHigher('gestor');
    
    console.log('[SMART SERVICES] Should use technician view:', isTechnician);
    
    return isTechnician;
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