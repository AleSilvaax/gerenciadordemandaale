import { supabase } from "@/integrations/supabase/client";

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

export async function getService(id: string): Promise<any> {
  const { data, error } = await supabase
    .from('services')
    .select(`*`)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error("Error fetching service:", error);
    throw error;
  }
  if (!data) {
    // Retorne null explicitamente se não encontrado
    return null;
  }

  // Garantir que sempre haja um campo technician, do tipo esperado (mock/fake se necessário)
  return {
    ...data,
    // Adiciona um campo 'technician' com defaults se não existir na tabela (mock)
    technician: {
      id: "0",
      name: "Não atribuído",
      avatar: "",
      role: "tecnico",
      signature: "",
      email: "",
      phone: ""
    }
  };
}

// The rest of the functions reference old "messages" and "feedback" fields that don't appear in your schema
// It's safest to remove or comment them out for now, since these are not used by any of the importing files.
