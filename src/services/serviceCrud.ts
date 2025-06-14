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
    console.log('Fetching services from database');
    
    // Get all services with all relevant fields
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select(`
        *,
        service_type,
        service_type_id,
        priority,
        status,
        due_date,
        number,
        description,
        client,
        address,
        city,
        notes,
        estimated_hours,
        photo_titles,
        photos,
        created_by
      `);

    if (servicesError) {
      console.error('Error fetching services from Supabase:', servicesError);
      throw servicesError;
    }

    // Get all service_technicians relationships
    const { data: technicianData, error: technicianError } = await supabase
      .from('service_technicians')
      .select('*, profiles:technician_id(*)');

    if (technicianError) {
      console.error('Error fetching service technicians from Supabase:', technicianError);
      throw technicianError;
    }

    // Get all service messages - Using a raw query approach to work around TypeScript limitations
    const { data: messagesData, error: messagesError } = await supabase
      .rpc('get_service_messages') as unknown as { 
        data: ServiceMessageRow[] | null, 
        error: any 
      };

    if (messagesError) {
      console.error('Error fetching service messages from Supabase:', messagesError);
      // Continue without messages if there's an error
      console.log('Continuing without messages due to error');
    }

    // Transform the data to match our Service type
    const services: Service[] = servicesData.map(service => {
      // Find technician for this service
      const techRelation = technicianData?.find(t => t.service_id === service.id);

      // Get technician details or use a default
      const technician: TeamMember = techRelation?.profiles ? {
        id: techRelation.profiles.id,
        name: techRelation.profiles.name || 'Desconhecido',
        avatar: techRelation.profiles.avatar || '',
        role: 'tecnico', // Default role
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      };

      // Get messages for this service from our function result
      const serviceMessages = Array.isArray(messagesData)
        ? messagesData
            .filter(m => m.service_id === service.id)
            .map(m => ({
              senderId: m.sender_id,
              senderName: m.sender_name,
              senderRole: m.sender_role,
              message: m.message,
              timestamp: m.timestamp
            }))
        : [];
        
      // Parse possible JSON fields
      let customFieldsParsed: any = undefined;
      if (service.custom_fields) {
        try {
          const parsed = typeof service.custom_fields === "string" ? JSON.parse(service.custom_fields) : service.custom_fields;
          customFieldsParsed = Array.isArray(parsed) ? parsed : undefined;
        } catch { customFieldsParsed = undefined; }
      }
      let signaturesParsed: any = undefined;
      if (service.signatures) {
        try {
          signaturesParsed = typeof service.signatures === "string" ? JSON.parse(service.signatures) : service.signatures;
        } catch { signaturesParsed = undefined; }
      }

      // Arrays seguros
      const safePhotoTitles =
        Array.isArray(service.photo_titles)
          ? service.photo_titles.filter((x: any) => typeof x === 'string')
          : undefined;

      const safePhotos =
        Array.isArray(service.photos)
          ? service.photos.filter((x: any) => typeof x === 'string')
          : undefined;

      // Helpers - type correction for priority and serviceType
      const safePriority = typeof service.priority === 'string' &&
        ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
        ? service.priority as ServicePriority
        : undefined;

      const safeServiceType = typeof service.service_type === 'string'
        ? service.service_type
        : undefined;

      // Return all relevant fields
      return {
        id: service.id,
        title: service.title,
        location: service.location,
        status: service.status as ServiceStatus,
        technician: technician,
        creationDate: service.created_at,
        dueDate: service.due_date ?? undefined,
        priority: safePriority,
        serviceType: safeServiceType,
        number: service.number ?? undefined,
        description: service.description ?? undefined,
        createdBy: service.created_by ?? undefined,
        client: service.client ?? undefined,
        address: service.address ?? undefined,
        city: service.city ?? undefined,
        notes: service.notes ?? undefined,
        estimatedHours: service.estimated_hours ?? undefined,
        customFields: customFieldsParsed,
        signatures: signaturesParsed,
        messages: serviceMessages,
        photos: safePhotos,
        photoTitles: safePhotoTitles,
        date: service.date ?? undefined,
      };
    });

    console.log('Services fetched successfully:', services);
    return services;
  } catch (error) {
    console.error('Error in getServicesFromDatabase:', error);
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
    
    // Update technician if provided
    if (service.technician && service.technician.id && service.technician.id !== '0') {
      await assignTechnician(service.id, service.technician.id);
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
      // Provide defaults for required properties
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
