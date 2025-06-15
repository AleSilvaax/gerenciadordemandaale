
import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus, CustomField } from '@/types/serviceTypes';
import { toast } from "sonner";

// Interface para a tabela de mensagens de serviço
interface ServiceMessageRow {
  id: string;
  service_id: string;
  sender_id: string;
  sender_name: string;
  sender_role: string;
  message: string;
  timestamp: string;
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

      // Buscar mensagens para este serviço
      const serviceMessages = messagesData
        .filter(m => m.service_id === service.id)
        .map(m => ({
          senderId: m.sender_id,
          senderName: m.sender_name,
          senderRole: m.sender_role,
          message: m.message,
          timestamp: m.timestamp
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

      // Arrays seguros
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

      const processedService = {
        id: service.id,
        title: service.title || 'Sem título',
        location: service.location || 'Local não informado',
        status: safeStatus,
        technician: technician,
        creationDate: service.created_at,
        dueDate: service.due_date,
        priority: safePriority,
        serviceType: service.service_type || 'Vistoria',
        number: service.number,
        description: service.description,
        createdBy: service.created_by,
        client: service.client,
        address: service.address,
        city: service.city,
        notes: service.notes,
        estimatedHours: service.estimated_hours,
        customFields: customFieldsParsed,
        signatures: signaturesParsed,
        messages: serviceMessages,
        photos: safePhotos,
        photoTitles: safePhotoTitles,
        date: service.date,
      };

      console.log('[SERVICES] Serviço processado:', processedService.id, processedService.title);
      return processedService;
    });

    console.log('[SERVICES] Total de serviços processados:', services.length);
    return services;
  } catch (error) {
    console.error('[SERVICES] Erro geral:', error);
    toast.error(`Erro ao buscar demandas: ${error.message || 'Erro desconhecido'}`);
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

    // Arrays seguros
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
        dueDate: data.due_date ?? service.dueDate,
        priority: safePriority ?? service.priority,
        serviceType: safeServiceType ?? service.serviceType,
        description: data.description ?? service.description,
        createdBy: data.created_by ?? service.createdBy,
        client: data.client ?? service.client,
        address: data.address ?? service.address,
        city: data.city ?? service.city,
        notes: data.notes ?? service.notes,
        estimatedHours: data.estimated_hours ?? service.estimatedHours,
        customFields: customFieldsParsed,
        signatures: signaturesParsed,
        messages: service.messages || [],
        photos: safePhotos,
        photoTitles: safePhotoTitles,
        date: data.date ?? service.date
      },
      technicianError
    };
  } catch (error) {
    if (typeof error?.message === "string" && error.message === "PERMISSION_DENIED") {
      toast.error("Permissão negada ao criar demanda. Consulte o administrador.");
    }
    console.error('Erro geral em createServiceInDatabase:', error);
    toast.error("Falha ao criar serviço no servidor");
    return { created: null, technicianError: null };
  }
};

// Update existing service in Supabase
export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    console.log('Updating service in database:', service);
    
    // Update the main service record
    const { data, error } = await supabase
      .from('services')
      .update({
        title: service.title,
        location: service.location,
        status: service.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', service.id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating service in Supabase:', error);
      throw error;
    }
    
    console.log('Service updated successfully:', data);

    // SEMPRE limpar relação anterior de técnico!
    const { error: deleteError } = await supabase
      .from('service_technicians')
      .delete()
      .eq('service_id', service.id);

    if (deleteError) {
      console.error('Erro ao remover técnico antigo:', deleteError);
      // Não interrompe o resto do fluxo: só loga.
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
        toast.success("Técnico atribuído no banco com sucesso.");
      }
    }
    
    // Construct and return a properly typed Service object
    return {
      id: data.id,
      title: data.title,
      location: data.location,
      status: data.status as any,
      technician: service.technician || {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      },
      creationDate: data.created_at,
      dueDate: service.dueDate,
      priority: service.priority,
      messages: service.messages || [],
    };
  } catch (error) {
    console.error('Error in updateServiceInDatabase:', error);
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
