
import { supabase } from '@/integrations/supabase/client';
import { ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { toast } from "sonner";

export const addServiceMessage = async (serviceId: string, message: ServiceMessage): Promise<void> => {
  try {
    console.log('[MESSAGING] Adicionando mensagem:', { serviceId, message });
    
    // Salva a mensagem na tabela service_messages
    const { error } = await supabase
      .from('service_messages')
      .insert({
        service_id: serviceId,
        sender_id: message.senderId,
        sender_name: message.senderName,
        sender_role: message.senderRole,
        message: message.message,
      });
    
    if (error) {
      console.error('[MESSAGING] Erro ao salvar mensagem:', error);
      throw error;
    }

    console.log('[MESSAGING] Mensagem salva com sucesso');
  } catch (error) {
    console.error('[MESSAGING] Erro geral:', error);
    toast.error('Erro ao enviar mensagem');
    throw error;
  }
};

export const addServiceFeedback = async (serviceId: string, feedback: ServiceFeedback): Promise<void> => {
  try {
    console.log('[FEEDBACK] Salvando feedback:', { serviceId, feedback });
    
    // Atualizar o serviço com o feedback
    const { error } = await supabase
      .from('services')
      .update({
        feedback: JSON.stringify(feedback),
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId);
    
    if (error) {
      console.error('[FEEDBACK] Erro ao salvar feedback:', error);
      throw error;
    }

    console.log('[FEEDBACK] Feedback salvo com sucesso');
  } catch (error) {
    console.error('[FEEDBACK] Erro geral:', error);
    toast.error('Erro ao salvar feedback');
    throw error;
  }
};
