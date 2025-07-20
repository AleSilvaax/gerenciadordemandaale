import { supabase } from "@/integrations/supabase/client";
import { Service } from "@/types/serviceTypes";

// Atualiza qualquer campo da demanda, incluindo dados aninhados
export async function updateService(data: any): Promise<any> {
  if (!data.id) throw new Error("ID da demanda não informado");

  // Remover o id do body do update (não pode ser atualizado)
  const { id, ...updateData } = data;

  // Atualizar updated_at automaticamente
  updateData.updated_at = new Date().toISOString();

  const { data: updated, error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return updated;
}

// A função getService será a versão completa de servicesDataService.ts
export const getService = async (id: string): Promise<Service | null> => {
  console.log('[DEBUG] getService foi chamada com ID:', id); // NOVO LOG AQUI!

  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:service_technicians!left(
        profiles!technician_id(id, name, avatar)
      )
    `)
    .eq('id', id)
    .maybeSingle(); // Use maybeSingle para não quebrar se vier vazio

  console.log('[DEBUG] Retorno do Supabase RAW DATA:', data); // Log para depuração
  console.log('[DEBUG] Retorno do Supabase ERROR:', error); // Log do erro
  console.log('[DEBUG] Technician data from Supabase query:', data?.technician); // Adicionado para depurar o objeto technician

  if (error) {
    console.error("Erro ao buscar serviço único:", error);
    throw error; // Lança o erro para ser tratado no ServiceDetail.tsx
  }

  if (!data || !data.id) {
    console.warn("[API] Nenhum serviço encontrado com o ID:", id);
    return null;
  }

  // Monta o técnico se existir
  let safeTechnician = { id: '0', name: 'Não atribuído', avatar: '', role: 'tecnico' };
  if (Array.isArray(data.technician) && data.technician.length > 0 && data.technician[0]?.profiles) {
    const t = data.technician[0].profiles;
    safeTechnician = {
      id: t.id || '0',
      name: t.name || 'Não atribuído',
      avatar: t.avatar || '',
      role: 'tecnico', // Definir um valor padrão ou buscar de outra fonte se necessário
      // email: undefined, // Removido pois não está na consulta direta de profiles
      // phone: undefined, // Removido pois não está na consulta direta de profiles
      // signature: undefined, // Removido pois não está na consulta direta de profiles
    };
  }

  // Corrigir feedback e customFields para tipos esperados
  let safeFeedback = undefined;
  if (data.feedback) {
    try {
      safeFeedback = typeof data.feedback === 'string' ? JSON.parse(data.feedback) : data.feedback;
    } catch { safeFeedback = undefined; }
  }
  if (!safeFeedback) {
    safeFeedback = {
      rating: 0,
      comment: '',
      wouldRecommend: false,
      clientRating: 0,
      clientComment: '',
      technicianFeedback: '',
      userId: '',
      userName: '',
      timestamp: '',
    };
  }
  let safeCustomFields = undefined;
  if (data.custom_fields) {
    try {
      safeCustomFields = typeof data.custom_fields === 'string' ? JSON.parse(data.custom_fields) : data.custom_fields;
    } catch { safeCustomFields = undefined; }
  }

  return {
    ...data,
    technician: safeTechnician,
    feedback: safeFeedback,
    customFields: safeCustomFields
  } as Service;
};

// The rest of the functions reference old "messages" and "feedback" fields that don't appear in your schema
// It's safest to remove or comment them out for now, since these are not used by any of the importing files.
