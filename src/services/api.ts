import { supabase } from "@/integrations/supabase/client";

// Atualiza qualquer campo da demanda, incluindo dados aninhados
export async function updateService(data: any): Promise<any> {
  if (!data.id) throw new Error("ID da demanda não informado");

  // Remover o id do body do update (não pode ser atualizado)
  const { id, ...updateData } = data;

  // Atualizar updated_at automaticamente
  updateData.updated_at = new Date().toISOString();

  // Envia os campos aninhados normalmente (Supabase/SQlite lida com JSON sem problemas)
  const { data: updated, error } = await supabase
    .from("services")
    .update(updateData)
    .eq("id", id)
    .select("*")
    .maybeSingle();

  if (error) throw error;
  return updated;
}

export async function getService(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('services')
    .select(`
      *,
      technician:technicians (
        id,
        name,
        email,
        phone,
        avatar,
        signature
      )
    `)
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching service:", error);
    throw error;
  }

  return data;
}

export async function addServiceMessage(id: string, messageData: any): Promise<any> {
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error("Error fetching service:", error);
    throw error;
  }

  const updatedMessages = [...(data.messages || []), messageData];

  const { data: updated, error: updateError } = await supabase
    .from('services')
    .update({ messages: updatedMessages })
    .eq('id', id)
    .select('*')
    .single();

  if (updateError) {
    console.error("Error updating service with new message:", updateError);
    throw updateError;
  }

  return updated;
}

export async function addServiceFeedback(id: string, feedbackData: any): Promise<any> {
  const { data, error } = await supabase
    .from('services')
    .update({ feedback: feedbackData })
    .eq('id', id)
    .select('*')
    .single();

  if (error) {
    console.error("Error adding service feedback:", error);
    throw error;
  }

  return data;
}
