
import { supabase } from '@/integrations/supabase/client';
import { ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { toast } from "sonner";

export const addServiceMessage = async (serviceId: string, message: ServiceMessage): Promise<void> => {
  try {
    console.log('[MESSAGING] Adicionando mensagem:', { serviceId, message });
    
    // Primeiro, verificar se o serviço existe
    const { data: serviceExists, error: serviceError } = await supabase
      .from('services')
      .select('id')
      .eq('id', serviceId)
      .single();

    if (serviceError || !serviceExists) {
      console.error('[MESSAGING] Serviço não encontrado:', serviceError);
      toast.error('Serviço não encontrado');
      return;
    }
    
    // Salvar a mensagem na tabela service_messages
    const { data, error } = await supabase
      .from('service_messages')
      .insert({
        service_id: serviceId,
        sender_id: message.sender_id || 'system',
        sender_name: message.sender_name || 'Sistema',
        sender_role: message.sender_role || 'system',
        message: message.message,
        timestamp: new Date().toISOString()
      })
      .select()
      .single();
    
    if (error) {
      console.error('[MESSAGING] Erro ao salvar mensagem:', error);
      // Tentar salvar via edge function como fallback
      await saveMessageViaEdgeFunction(serviceId, message);
      return;
    }

    console.log('[MESSAGING] Mensagem salva com sucesso:', data);
    toast.success('Mensagem enviada com sucesso');
  } catch (error) {
    console.error('[MESSAGING] Erro geral:', error);
    // Fallback: tentar via edge function
    try {
      await saveMessageViaEdgeFunction(serviceId, message);
    } catch (fallbackError) {
      console.error('[MESSAGING] Fallback também falhou:', fallbackError);
      toast.error('Erro ao enviar mensagem');
    }
  }
};

const saveMessageViaEdgeFunction = async (serviceId: string, message: ServiceMessage): Promise<void> => {
  try {
    console.log('[MESSAGING] Tentando salvar via edge function...');
    
    const { data, error } = await supabase.functions.invoke('add_service_message', {
      body: {
        serviceId,
        message: {
          author: message.sender_id || 'system',
          author_name: message.sender_name || 'Sistema',
          type: message.sender_role || 'system',
          text: message.message
        }
      }
    });

    if (error) {
      console.error('[MESSAGING] Erro na edge function:', error);
      throw error;
    }

    console.log('[MESSAGING] Mensagem salva via edge function:', data);
    toast.success('Mensagem enviada com sucesso');
  } catch (error) {
    console.error('[MESSAGING] Erro na edge function:', error);
    throw error;
  }
};

export const addServiceFeedback = async (serviceId: string, feedback: ServiceFeedback): Promise<void> => {
  try {
    console.log('[FEEDBACK] Salvando feedback:', { serviceId, feedback });
    
    // Atualizar o serviço com o feedback
    const { data, error } = await supabase
      .from('services')
      .update({
        feedback: JSON.stringify(feedback),
        updated_at: new Date().toISOString()
      })
      .eq('id', serviceId)
      .select()
      .single();
    
    if (error) {
      console.error('[FEEDBACK] Erro ao salvar feedback:', error);
      toast.error('Erro ao salvar feedback');
      throw error;
    }

    console.log('[FEEDBACK] Feedback salvo com sucesso:', data);
    toast.success('Feedback salvo com sucesso');
  } catch (error) {
    console.error('[FEEDBACK] Erro geral:', error);
    toast.error('Erro ao salvar feedback');
    throw error;
  }
};
