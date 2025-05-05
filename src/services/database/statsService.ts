
import { supabase } from './baseService';

// Obter estatísticas dos serviços
export const getServiceStats = async (teamId?: string): Promise<any> => {
  try {
    // Create query step by step to avoid infinite type instantiation
    let query = supabase.from('services').select('status');
    
    // Apply filter if teamId is provided
    if (teamId) {
      query = query.eq('team_id', teamId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // Inicializar contadores
    const stats = {
      total: data.length,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
    
    // Contar os serviços por status
    data.forEach((service: any) => {
      switch (service.status) {
        case 'concluido':
          stats.completed++;
          break;
        case 'pendente':
        case 'em_andamento':
          stats.pending++;
          break;
        case 'cancelado':
          stats.cancelled++;
          break;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error fetching service statistics:', error);
    return {
      total: 0,
      completed: 0,
      pending: 0,
      cancelled: 0
    };
  }
};
