import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";

// Interface para a tabela de mensagens de serviço
interface ServiceMessageRow {
  id: string;
  service_id: string | null;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  timestamp: string | null;
}

export const getServicesFromDatabase = async (): Promise<Service[]> => {
  try {
    console.log('[SERVICES] Iniciando busca de serviços...');
    
    // Buscar serviços básicos primeiro
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*');

    console.log('[SERVICES] Query executada, resultado:', { servicesData, servicesError });

    if (servicesError) {
      console.error('[SERVICES] Erro ao buscar serviços:', servicesError);
      throw servicesError;
    }

    if (!servicesData || servicesData.length === 0) {
      console.log('[SERVICES] Nenhum serviço encontrado no banco');
      return [];
    }

    console.log('[SERVICES] Serviços encontrados no banco:', servicesData.length);

    // Buscar técnicos atribuídos
    let technicianData: any[] = [];
    try {
      const { data: techData, error: techError } = await supabase
        .from('service_technicians')
        .select(`
          service_id,
          technician_id,
          profiles!service_technicians_technician_id_fkey (
            id,
            name,
            avatar
          )
        `);

      if (techError) {
        console.error('[SERVICES] Erro ao buscar técnicos:', techError);
      } else {
        technicianData = techData || [];
        console.log('[SERVICES] Técnicos encontrados:', technicianData.length);
      }
    } catch (error) {
      console.error('[SERVICES] Erro ao buscar técnicos:', error);
    }

    // Buscar mensagens (opcional)
    let messagesData: ServiceMessageRow[] = [];
    try {
      const { data: msgs, error: messagesError } = await supabase
        .from('service_messages')
        .select('*');
      
      if (!messagesError && msgs) {
        messagesData = msgs;
        console.log('[SERVICES] Mensagens encontradas:', messagesData.length);
      }
    } catch (error) {
      console.log('[SERVICES] Não foi possível buscar mensagens:', error);
    }

    // Transformar dados
    const services: Service[] = servicesData.map(service => {
      console.log('[SERVICES] Processando serviço:', service.id);
      
      // Encontrar técnico atribuído
      const techAssignment = technicianData?.find(t => t.service_id === service.id);
      
      const technician: TeamMember = techAssignment?.profiles ? {
        id: techAssignment.profiles.id,
        name: techAssignment.profiles.name || 'Técnico',
        avatar: techAssignment.profiles.avatar || '',
        role: 'tecnico',
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      };

      // Buscar mensagens para este serviço - filtrar apenas válidas
      const serviceMessages = messagesData
        .filter(m => m.service_id === service.id)
        .map(m => ({
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          message: m.message,
          timestamp: m.timestamp || new Date().toISOString()
        }));

      // Parse seguro dos campos JSON
      let customFieldsParsed: any = undefined;
      if (service.custom_fields) {
        try {
          customFieldsParsed = typeof service.custom_fields === "string" 
            ? JSON.parse(service.custom_fields) 
            : service.custom_fields;
        } catch { 
          customFieldsParsed = undefined; 
        }
      }

      let signaturesParsed: any = undefined;
      if (service.signatures) {
        try {
          signaturesParsed = typeof service.signatures === "string" 
            ? JSON.parse(service.signatures) 
            : service.signatures;
        } catch { 
          signaturesParsed = undefined; 
        }
      }

      let feedbackParsed: any = undefined;
      if (service.feedback) {
        try {
          feedbackParsed = typeof service.feedback === "string" 
            ? JSON.parse(service.feedback) 
            : service.feedback;
        } catch { 
          feedbackParsed = undefined; 
        }
      }

      // Arrays seguros - converter null para undefined
      const safePhotoTitles = Array.isArray(service.photo_titles) 
        ? service.photo_titles.filter((x: any) => typeof x === 'string')
        : undefined;

      const safePhotos = Array.isArray(service.photos) 
        ? service.photos.filter((x: any) => typeof x === 'string')
        : undefined;

      // Validar priority
      const safePriority = typeof service.priority === 'string' &&
        ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
        ? service.priority as ServicePriority
        : 'media' as ServicePriority;

      // Validar status
      const safeStatus = typeof service.status === 'string' &&
        ['pendente', 'concluido', 'cancelado'].includes(service.status)
        ? service.status as ServiceStatus
        : 'pendente' as ServiceStatus;

      const processedService: Service = {
        id: service.id,
        title: service.title || 'Sem título',
        location: service.location || 'Local não informado',
        status: safeStatus,
        technician: technician,
        creationDate: service.created_at,
        dueDate: service.due_date || undefined,
        priority: safePriority,
        serviceType: service.service_type || 'Vistoria',
        number: service.number,
        description: service.description || undefined,
        createdBy: service.created_by || undefined,
        client: service.client || undefined,
        address: service.address || undefined,
        city: service.city || undefined,
        notes: service.notes || undefined,
        estimatedHours: service.estimated_hours || undefined,
        customFields: customFieldsParsed,
        signatures: signaturesParsed,
        feedback: feedbackParsed,
        messages: serviceMessages,
        photos: safePhotos,
        photoTitles: safePhotoTitles,
        date: service.date || undefined,
      };

      console.log('[SERVICES] Serviço processado:', processedService.id, processedService.title);
      return processedService;
    });

    console.log('[SERVICES] Total de serviços processados:', services.length);
    return services;
  } catch (error: any) {
    console.error('[SERVICES] Erro geral:', error);
    toast.error(`Erro ao buscar demandas: ${error?.message || 'Erro desconhecido'}`);
    return [];
  }
};

// Create a new service in Supabase, generating the service number client-side (no supabase.rpc)
export const createServiceInDatabase = async (
  service: Omit<Service, "id"> & { serviceTypeId?: string }
): Promise<{ created: Service | null; technicianError?: string | null }> => {
  try {
    console.log('Criando service no banco (Supabase):', service);

    if (!service.createdBy) {
      throw new Error("Usuário não autenticado ou campo createdBy não preenchido.");
    }

    // Geração do número único do serviço (client-side)
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0");
    const timestamp = Date.now();
    const number = `SRV-${timestamp}-${random}`;

    // Prepare all fields
    const insertData: any = {
      title: service.title,
      location: service.location,
      status: service.status,
      number: number,
      due_date: service.dueDate ?? null,
      priority: service.priority ?? 'media',
      service_type: service.serviceType ?? 'Vistoria',
      service_type_id: service.serviceTypeId ?? null,
      description: service.description ?? null,
      created_by: service.createdBy ?? null,
      client: service.client ?? null,
      address: service.address ?? null,
      city: service.city ?? null,
      notes: service.notes ?? null,
      estimated_hours: service.estimatedHours ?? null,
      custom_fields: service.customFields ? JSON.stringify(service.customFields) : null,
      signatures: service.signatures ? JSON.stringify(service.signatures) : null,
      feedback: service.feedback ? JSON.stringify(service.feedback) : null,
      photos: service.photos ?? null,
      photo_titles: service.photoTitles ?? null,
      date: service.date ?? null
    };
    Object.keys(insertData).forEach(key => {
      if (insertData[key] === undefined) {
        delete insertData[key];
      }
    });

    const { data, error } = await supabase
      .from('services')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar service (Supabase):', error);
      if (
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("permission denied")
      ) {
        throw new Error("PERMISSION_DENIED");
      }
      throw error;
    }

    console.log('Service criado com sucesso:', data);

    let technicianError: string | null = null;

    if (service.technician && service.technician.id && service.technician.id !== '0' && data.id) {
      try {
        await assignTechnician(data.id, service.technician.id);
      } catch (err: any) {
        technicianError = "Erro ao atribuir técnico. Verifique permissões ou tente posteriormente.";
        console.error(technicianError, err);
      }
    }

    // Helpers - safe type assertions and parse functions
    const safePriority = typeof data.priority === 'string' &&
      ['baixa', 'media', 'alta', 'urgente'].includes(data.priority)
        ? data.priority as ServicePriority
        : undefined;
    const safeServiceType = typeof data.service_type === 'string' &&
      ['Vistoria', 'Instalação', 'Manutenção'].includes(data.service_type)
        ? data.service_type
        : undefined;

    // Parse possible JSON fields
    let customFieldsParsed: any = undefined;
    if (data.custom_fields) {
      try {
        const parsed = typeof data.custom_fields === "string" ? JSON.parse(data.custom_fields) : data.custom_fields;
        customFieldsParsed = Array.isArray(parsed) ? parsed : undefined;
      } catch { customFieldsParsed = undefined; }
    }
    let signaturesParsed: any = undefined;
    if (data.signatures) {
      try {
        signaturesParsed = typeof data.signatures === "string" ? JSON.parse(data.signatures) : data.signatures;
      } catch { signaturesParsed = undefined; }
    }
    let feedbackParsed: any = undefined;
    if (data.feedback) {
      try {
        feedbackParsed = typeof data.feedback === "string" ? JSON.parse(data.feedback) : data.feedback;
      } catch { feedbackParsed = undefined; }
    }

    // Arrays seguros - converter null para undefined
    const safePhotoTitles =
      Array.isArray(data.photo_titles)
        ? data.photo_titles.filter((x: any) => typeof x === 'string')
        : service.photoTitles?.filter((x: any) => typeof x === 'string');

    const safePhotos =
      Array.isArray(data.photos)
        ? data.photos.filter((x: any) => typeof x === 'string')
        : service.photos?.filter((x: any) => typeof x === 'string');

    return {
      created: {
        id: data.id,
        title: data.title,
        location: data.location,
        status: data.status as ServiceStatus,
        technician: service.technician || {
          id: '0',
          name: 'Não atribuído',
          avatar: '',
          role: 'tecnico',
        },
        creationDate: data.created_at,
        dueDate: data.due_date || service.dueDate,
        priority: safePriority || service.priority,
        serviceType: safeServiceType || service.serviceType,
        description: data.description || service.description,
        createdBy: data.created_by || service.createdBy,
        client: data.client || service.client,
        address: data.address || service.address,
        city: data.city || service.city,
        notes: data.notes || service.notes,
        estimatedHours: data.estimated_hours || service.estimatedHours,
        customFields: customFieldsParsed,
        signatures: signaturesParsed,
        feedback: feedbackParsed,
        messages: service.messages || [],
        photos: safePhotos,
        photoTitles: safePhotoTitles,
        date: data.date || service.date
      },
      technicianError
    };
  } catch (error: any) {
    if (typeof error?.message === "string" && error.message === "PERMISSION_DENIED") {
      toast.error("Permissão negada ao criar demanda. Consulte o administrador.");
    }
    console.error('Erro geral em createServiceInDatabase:', error);
    toast.error("Falha ao criar serviço no servidor");
    return { created: null, technicianError: null };
  }
};

// Update existing service in Supabase - CORRIGIDO PARA SALVAR TODOS OS CAMPOS
export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    console.log('Atualizando serviço no banco:', service);
    
    // Preparar dados para atualização - incluindo TODOS os campos
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    // Campos básicos - converter undefined para null para o banco
    if (service.title !== undefined) updateData.title = service.title;
    if (service.location !== undefined) updateData.location = service.location;
    if (service.status !== undefined) updateData.status = service.status;
    if (service.priority !== undefined) updateData.priority = service.priority;
    if (service.serviceType !== undefined) updateData.service_type = service.serviceType;
    if (service.description !== undefined) updateData.description = service.description || null;
    if (service.client !== undefined) updateData.client = service.client || null;
    if (service.address !== undefined) updateData.address = service.address || null;
    if (service.city !== undefined) updateData.city = service.city || null;
    if (service.notes !== undefined) updateData.notes = service.notes || null;
    if (service.estimatedHours !== undefined) updateData.estimated_hours = service.estimatedHours || null;
    if (service.dueDate !== undefined) updateData.due_date = service.dueDate || null;
    if (service.date !== undefined) updateData.date = service.date || null;

    // Campos JSON - serializar corretamente
    if (service.customFields !== undefined) {
      updateData.custom_fields = service.customFields ? JSON.stringify(service.customFields) : undefined;
    }
    if (service.signatures !== undefined) {
      updateData.signatures = service.signatures ? JSON.stringify(service.signatures) : undefined;
      console.log('Salvando assinaturas no banco:', updateData.signatures);
    }
    if (service.feedback !== undefined) {
      updateData.feedback = service.feedback ? JSON.stringify(service.feedback) : undefined;
      console.log('Salvando feedback no banco:', updateData.feedback);
    }

    // Arrays de fotos
    if (service.photos !== undefined) {
      updateData.photos = service.photos || undefined;
      console.log('Salvando fotos no banco:', service.photos?.length, 'fotos');
    }
    if (service.photoTitles !== undefined) {
      updateData.photo_titles = service.photoTitles || undefined;
      console.log('Salvando títulos das fotos no banco:', service.photoTitles?.length, 'títulos');
    }

    // Atualizar o serviço principal
    const { data, error } = await supabase
      .from('services')
      .update(updateData)
      .eq('id', service.id)
      .select()
      .single();
    
    if (error) {
      console.error('Erro ao atualizar serviço no Supabase:', error);
      throw error;
    }
    
    console.log('Serviço atualizado com sucesso:', data);

    // Gerenciar atribuição de técnico
    if (service.technician !== undefined) {
      // SEMPRE limpar relação anterior de técnico!
      const { error: deleteError } = await supabase
        .from('service_technicians')
        .delete()
        .eq('service_id', service.id);

      if (deleteError) {
        console.error('Erro ao remover técnico antigo:', deleteError);
      }

      // Reatribuir, se houver técnico válido (não null/não '0')
      if (
        service.technician &&
        service.technician.id &&
        service.technician.id !== '0' &&
        service.technician.id !== 'none'
      ) {
        const { error: insertError } = await supabase
          .from('service_technicians')
          .insert({
            service_id: service.id,
            technician_id: service.technician.id
          });

        if (insertError) {
          console.error('Erro ao atribuir novo técnico:', insertError);
          toast.error(`Erro ao atribuir técnico: ${insertError.message || "erro desconhecido"}`);
        } else {
          console.log("Técnico atribuído no banco com sucesso.");
        }
      }
    }
    
    // Parse dos campos JSON para retorno
    let signaturesParsed: any = undefined;
    if (data.signatures) {
      try {
        signaturesParsed = typeof data.signatures === "string" ? JSON.parse(data.signatures) : data.signatures;
      } catch { signaturesParsed = undefined; }
    }

    let feedbackParsed: any = undefined;
    if (data.feedback) {
      try {
        feedbackParsed = typeof data.feedback === "string" ? JSON.parse(data.feedback) : data.feedback;
      } catch { feedbackParsed = undefined; }
    }

    let customFieldsParsed: any = undefined;
    if (data.custom_fields) {
      try {
        customFieldsParsed = typeof data.custom_fields === "string" ? JSON.parse(data.custom_fields) : data.custom_fields;
      } catch { customFieldsParsed = undefined; }
    }
    
    // Construir e retornar objeto Service corretamente tipado
    return {
      id: data.id,
      title: data.title,
      location: data.location,
      status: data.status as ServiceStatus,
      technician: service.technician || {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      },
      creationDate: data.created_at,
      dueDate: data.due_date || undefined,
      priority: data.priority as ServicePriority,
      serviceType: data.service_type,
      number: data.number,
      description: data.description || undefined,
      createdBy: data.created_by || undefined,
      client: data.client || undefined,
      address: data.address || undefined,
      city: data.city || undefined,
      notes: data.notes || undefined,
      estimatedHours: data.estimated_hours || undefined,
      customFields: customFieldsParsed,
      signatures: signaturesParsed,
      feedback: feedbackParsed,
      messages: service.messages || [],
      photos: data.photos || undefined,
      photoTitles: data.photo_titles || undefined,
      date: data.date || undefined,
    };
  } catch (error) {
    console.error('Erro em updateServiceInDatabase:', error);
    toast.error("Falha ao atualizar serviço no servidor");
    return null;
  }
};

// Delete a service from Supabase
export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    console.log('Deleting service from database:', id);
    
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting service from Supabase:', error);
      throw error;
    }
    
    console.log('Service deleted successfully');
    return true;
  } catch (error) {
    console.error('Error in deleteServiceFromDatabase:', error);
    toast.error("Falha ao excluir serviço do servidor");
    return false;
  }
};

// Helper function to assign a technician to a service
async function assignTechnician(serviceId: string, technicianId: string): Promise<void> {
  try {
    // First, remove existing technician assignments
    const { error: deleteError } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', serviceId);
    
    if (deleteError) throw deleteError;
    
    // Then add the new assignment
    const { error } = await supabase
      .from('service_technicians')
      .insert({
        service_id: serviceId,
        technician_id: technicianId
      });
    
    if (error) throw error;
  } catch (error) {
    console.error('Error assigning technician:', error);
    throw error;
  }
}

/**
 * Faz o upload de um arquivo de imagem para o Supabase Storage.
 * @param file O arquivo da imagem a ser enviado.
 * @returns A URL pública e permanente da imagem.
 */
export const uploadServicePhoto = async (file: File): Promise<string> => {
  // Cria um nome de arquivo único para evitar conflitos
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
  const filePath = `public/${fileName}`; // É uma boa prática usar uma pasta 'public'

  // Faz o upload para o bucket 'service-photos'
  const { error: uploadError } = await supabase.storage
    .from('service_photos') // <- Nome do seu bucket que já existe
    .upload(filePath, file);

  if (uploadError) {
    console.error('Erro no upload da imagem:', uploadError);
    throw uploadError;
  }

  // Se o upload for bem-sucedido, obtemos a URL pública
  const { data: publicUrlData } = supabase.storage
    .from('service-photos')
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    throw new Error("Não foi possível obter a URL pública da imagem.");
  }
  
  console.log('Imagem enviada com sucesso para:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};
