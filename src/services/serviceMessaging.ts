import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServiceMessage, ServiceFeedback, CustomField } from '@/types/serviceTypes';
import { toast } from "sonner";

export const addServiceMessage = async (serviceId: string, message: ServiceMessage): Promise<Service> => {
  try {
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
    if (error) throw error;

    // Busca o serviço atualizado, incluindo todas as mensagens deste serviço
    const { data: serviceRow } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .maybeSingle();

    const { data: messagesData } = await supabase
      .from('service_messages')
      .select('*')
      .eq('service_id', serviceId)
      .order('timestamp', { ascending: true });

    const messages: ServiceMessage[] = Array.isArray(messagesData)
      ? messagesData.map((m) => ({
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          message: m.message,
          timestamp: m.timestamp,
        }))
      : [];

    // Mock buscar técnico se não vier do backend (ajuste conforme necessário)
    const technician: TeamMember = {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico',
    };

    if (!serviceRow) throw new Error('Serviço não encontrado.');

    // Correção dos tipos para signatures e customFields
    let safeSignatures: { client?: string; technician?: string } | undefined = undefined;
    if (serviceRow.signatures) {
      if (typeof serviceRow.signatures === 'string') {
        try {
          safeSignatures = JSON.parse(serviceRow.signatures);
        } catch { /* deixa undefined */ }
      } else if (typeof serviceRow.signatures === 'object' && serviceRow.signatures !== null) {
        safeSignatures = serviceRow.signatures as { client?: string; technician?: string };
      }
    }
    let safeCustomFields: CustomField[] | undefined = undefined;
    if (serviceRow.custom_fields) {
      if (typeof serviceRow.custom_fields === 'string') {
        try {
          const parsed = JSON.parse(serviceRow.custom_fields);
          if (Array.isArray(parsed)) safeCustomFields = parsed as unknown as CustomField[];
        } catch { /* deixa undefined */ }
      } else if (Array.isArray(serviceRow.custom_fields)) {
        safeCustomFields = serviceRow.custom_fields as unknown as CustomField[];
      }
    }

    // Retorna o serviço atualizado, "completa" os campos obrigatórios (uso de cast manual)
    const updatedService: Service = {
      id: serviceRow.id,
      title: serviceRow.title,
      status: serviceRow.status as Service['status'],
      location: serviceRow.location,
      technician,
      creationDate: serviceRow.created_at,
      dueDate: serviceRow.due_date ?? undefined,
      priority: serviceRow.priority as Service['priority'],
      messages,
      serviceType: serviceRow.service_type as Service['serviceType'],
      reportData: (serviceRow as any).report_data ?? undefined,
      photos: serviceRow.photos ?? [],
      photoTitles: serviceRow.photo_titles ?? [],
      signatures: safeSignatures,
      date: serviceRow.date ?? undefined,
      description: serviceRow.description ?? undefined,
      client: serviceRow.client ?? undefined,
      address: serviceRow.address ?? undefined,
      city: serviceRow.city ?? undefined,
      notes: serviceRow.notes ?? undefined,
      estimatedHours: serviceRow.estimated_hours ?? undefined,
      feedback: undefined,
      customFields: safeCustomFields,
      createdBy: serviceRow.created_by ?? undefined,
    };

    return updatedService;
  } catch (error) {
    console.error('Erro ao adicionar mensagem ao serviço:', error);
    throw error;
  }
};

// Salva feedback no serviço (simplificado)
export const addServiceFeedback = async (serviceId: string, feedback: ServiceFeedback): Promise<Service> => {
  try {
    // Busca o serviço
    const { data: serviceRow } = await supabase
      .from('services')
      .select('*')
      .eq('id', serviceId)
      .maybeSingle();
    if (!serviceRow) throw new Error('Serviço não encontrado.');

    // Mock buscar técnico se não vier do backend (ajuste conforme necessário)
    const technician: TeamMember = {
      id: '0',
      name: 'Não atribuído',
      avatar: '',
      role: 'tecnico',
    };

    // Correção dos tipos para signatures e customFields
    let feedbackSafeSignatures: { client?: string; technician?: string } | undefined = undefined;
    if (serviceRow.signatures) {
      if (typeof serviceRow.signatures === 'string') {
        try {
          feedbackSafeSignatures = JSON.parse(serviceRow.signatures);
        } catch { /* deixa undefined */ }
      } else if (typeof serviceRow.signatures === 'object' && serviceRow.signatures !== null) {
        feedbackSafeSignatures = serviceRow.signatures as { client?: string; technician?: string };
      }
    }
    let feedbackSafeCustomFields: CustomField[] | undefined = undefined;
    if (serviceRow.custom_fields) {
      if (typeof serviceRow.custom_fields === 'string') {
        try {
          const parsed = JSON.parse(serviceRow.custom_fields);
          if (Array.isArray(parsed)) feedbackSafeCustomFields = parsed as unknown as CustomField[];
        } catch { /* deixa undefined */ }
      } else if (Array.isArray(serviceRow.custom_fields)) {
        feedbackSafeCustomFields = serviceRow.custom_fields as unknown as CustomField[];
      }
    }

    // Retorna o serviço preenchendo as propriedades corretas
    const fullService: Service = {
      id: serviceRow.id,
      title: serviceRow.title,
      status: serviceRow.status as Service['status'],
      location: serviceRow.location,
      technician,
      creationDate: serviceRow.created_at,
      dueDate: serviceRow.due_date ?? undefined,
      priority: serviceRow.priority as Service['priority'],
      messages: [], // nesse ponto não busca do backend
      feedback, // atribui na memória
      serviceType: serviceRow.service_type as Service['serviceType'],
      reportData: (serviceRow as any).report_data ?? undefined,
      photos: serviceRow.photos ?? [],
      photoTitles: serviceRow.photo_titles ?? [],
      signatures: feedbackSafeSignatures,
      date: serviceRow.date ?? undefined,
      description: serviceRow.description ?? undefined,
      client: serviceRow.client ?? undefined,
      address: serviceRow.address ?? undefined,
      city: serviceRow.city ?? undefined,
      notes: serviceRow.notes ?? undefined,
      estimatedHours: serviceRow.estimated_hours ?? undefined,
      customFields: feedbackSafeCustomFields,
      createdBy: serviceRow.created_by ?? undefined,
    };

    return fullService;
  } catch (error) {
    console.error('Erro ao salvar feedback:', error);
    throw error;
  }
};
