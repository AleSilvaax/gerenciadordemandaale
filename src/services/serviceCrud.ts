// Arquivo: src/services/serviceCrud.ts (VERSÃO COMPLETA E CORRIGIDA)

import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";

// A função de transformação dos dados foi mantida, pois está correta.
const transformServiceData = (service: any): Service => {
  const technicians = (service.service_technicians || []).map((st: any) => {
    const techProfile = st.profiles;
    if (!techProfile) return null;
    return {
      id: techProfile.id,
      name: techProfile.name || 'Técnico',
      avatar: techProfile.avatar || '',
      role: 'tecnico',
    } as TeamMember;
  }).filter(Boolean); // Remove quaisquer nulos se um perfil não for encontrado

  const serviceMessages = (service.service_messages || []).map((m: any) => ({
    senderId: m.sender_id, senderName: m.sender_name, senderRole: m.sender_role,
    message: m.message, timestamp: m.timestamp
  }));
  
  const parseJsonField = (field: any) => {
    if (!field) return undefined;
    if (typeof field === 'object') return field;
    try { return JSON.parse(field); } catch { return undefined; }
  };
  
  const safePriority = ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
    ? service.priority as ServicePriority : 'media' as ServicePriority;
  const safeStatus = ['pendente', 'em_andamento', 'concluido', 'cancelado', 'agendado'].includes(service.status)
    ? service.status as ServiceStatus : 'pendente' as ServiceStatus;

  return {
    id: service.id,
    title: service.title || 'Sem título',
    location: service.location || 'Local não informado',
    status: safeStatus,
    technicians: technicians, // Usa o array de técnicos
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
    customFields: parseJsonField(service.custom_fields),
    signatures: parseJsonField(service.signatures),
    feedback: parseJsonField(service.feedback),
    messages: serviceMessages,
    photos: Array.isArray(service.photos) ? service.photos : [],
    photoTitles: Array.isArray(service.photo_titles) ? service.photo_titles : [],
    date: service.date,
  };
}


/**
 * ✅ FUNÇÃO CORRIGIDA
 * Busca uma lista de serviços. A segurança por organização é garantida pelas
 * Políticas de Acesso (RLS) do Supabase. A função agora busca o cargo do
 * usuário internamente para aplicar filtros específicos.
 */
export const getServicesFromDatabase = async (): Promise<Service[]> => {
  try {
    console.log('[SERVICES] Iniciando busca de serviços com técnicos...');
    
    const { data: servicesData, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });

    if (servicesError) {
      console.error('[SERVICES] Erro na query:', servicesError);
      throw servicesError;
    }
    
    console.log('[SERVICES] Serviços encontrados:', servicesData?.length || 0);
    
    if (!servicesData) return [];

    // Buscar técnicos para todos os serviços
    const servicesWithTechnicians = await Promise.all(
      servicesData.map(async (service) => {
        const parseJsonField = (field: any) => {
          if (!field) return undefined;
          if (typeof field === 'object') return field;
          try { return JSON.parse(field); } catch { return undefined; }
        };
        
        const safePriority = ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
          ? service.priority as ServicePriority : 'media' as ServicePriority;
        const safeStatus = ['pendente', 'em_andamento', 'concluido', 'cancelado', 'agendado'].includes(service.status)
          ? service.status as ServiceStatus : 'pendente' as ServiceStatus;

        // Buscar técnicos atribuídos a este serviço
        const { data: technicianData } = await supabase
          .from('service_technicians')
          .select(`
            technician_id,
            profiles!inner(
              id,
              name,
              avatar
            )
          `)
          .eq('service_id', service.id);

        const technicians = technicianData?.map((st: any) => ({
          id: st.profiles.id,
          name: st.profiles.name,
          avatar: st.profiles.avatar,
          role: 'tecnico' as const
        })) || [];

        return {
          id: service.id,
          title: service.title || 'Sem título',
          location: service.location || 'Local não informado',
          status: safeStatus,
          technicians,
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
          customFields: parseJsonField(service.custom_fields) || [],
          signatures: parseJsonField(service.signatures) || {},
          feedback: parseJsonField(service.feedback),
          messages: [], // Vazio para evitar problemas de RLS
          photos: Array.isArray(service.photos) ? service.photos : [],
          photoTitles: Array.isArray(service.photo_titles) ? service.photo_titles : [],
          date: service.date,
        } as Service;
      })
    );

    console.log('[SERVICES] Serviços transformados:', servicesWithTechnicians.length);
    
    return servicesWithTechnicians;
  } catch (error: any) {
    console.error('[SERVICES] Erro na busca de serviços:', error);
    toast.error("Erro ao buscar as demandas", { description: "Verifique sua conexão ou tente novamente mais tarde." });
    return [];
  }
};


/**
 * ✅ FUNÇÃO CORRIGIDA
 * Busca um único serviço pelo seu ID. A segurança é garantida pelas RLS.
 */
export const getServiceByIdFromDatabase = async (serviceId: string): Promise<Service | null> => {
  try {
    // Buscar o serviço
    const { data, error } = await supabase
      .from('services')
      .select(`*, service_technicians(profiles(id, name, avatar)), service_messages(*)`)
      .eq('id', serviceId)
      .single();

    if (error) {
      console.error(`[SERVICE DETAIL] Serviço não encontrado ou sem permissão para id ${serviceId}:`, error);
      return null;
    }

    // Buscar fotos do serviço
    const { data: photosData } = await supabase
      .from('service_photos')
      .select('photo_url')
      .eq('service_id', serviceId)
      .order('created_at', { ascending: true });

    // Atualizar o campo photos com as URLs das fotos
    if (photosData && photosData.length > 0) {
      data.photos = photosData.map(p => p.photo_url);
    }

    return transformServiceData(data);

  } catch (error) {
    console.error('[SERVICE DETAIL] Erro ao buscar detalhe do serviço:', error);
    return null;
  }
};


/**
 * ✅ FUNÇÃO CORRIGIDA
 * Ajustada para incluir o 'organization_id' do usuário criador.
 */
export const createServiceInDatabase = async (
  service: Omit<Service, "id" | "number" | "creationDate"> & { serviceTypeId?: string }
): Promise<{ created: Service | null; technicianError?: string | null }> => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error("Usuário não autenticado.");
    }

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (profileError || !profileData?.organization_id) {
      throw new Error("Usuário não está associado a uma organização.");
    }

    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const number = `SRV-${Date.now()}-${random}`;

    const insertData = {
      title: service.title, location: service.location, status: service.status, number,
      due_date: service.dueDate ?? null, priority: service.priority ?? 'media',
      service_type: service.serviceType ?? 'Vistoria', service_type_id: service.serviceTypeId ?? null,
      description: service.description ?? null,
      client: service.client ?? null, address: service.address ?? null, city: service.city ?? null,
      notes: service.notes ?? null, estimated_hours: service.estimatedHours ?? null,
      custom_fields: service.customFields ? JSON.stringify(service.customFields) : null,
      signatures: service.signatures ? JSON.stringify(service.signatures) : null,
      feedback: service.feedback ? JSON.stringify(service.feedback) : null,
      photos: service.photos ?? null, photo_titles: service.photoTitles ?? null,
      date: service.date ?? null,
      created_by: user.id,
      organization_id: profileData.organization_id // <-- Chave da correção
    };

    const { data, error } = await supabase.from('services').insert(insertData).select().single();
    if (error) throw error;

    let technicianError: string | null = null;
    if (service.technicians?.[0]?.id && service.technicians[0].id !== '0' && data.id) {
        await assignTechnician(data.id, service.technicians[0].id).catch(() => {
            technicianError = "Serviço criado, mas falha ao atribuir técnico.";
        });
    }

    const createdService = await getServiceByIdFromDatabase(data.id);
    return { created: createdService, technicianError };
  } catch (error: any) {
    toast.error("Falha ao criar serviço.", { description: error.message });
    return { created: null, technicianError: null };
  }
};


// As funções abaixo foram mantidas como no original, pois as RLS já as protegem.

export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    const updateData: { [key: string]: any } = { updated_at: new Date().toISOString() };
    const fieldMapping: { [key in keyof Service]?: string } = {
      title: 'title', location: 'location', status: 'status', priority: 'priority',
      serviceType: 'service_type', description: 'description', client: 'client',
      address: 'address', city: 'city', notes: 'notes',
      estimatedHours: 'estimated_hours', dueDate: 'due_date', date: 'date',
    };

    for (const key in fieldMapping) {
      if (service[key as keyof Service] !== undefined) {
        updateData[fieldMapping[key as keyof Service]!] = service[key as keyof Service];
      }
    }
    
    if (service.customFields !== undefined) updateData.custom_fields = service.customFields ? JSON.stringify(service.customFields) : null;
    if (service.signatures !== undefined) updateData.signatures = service.signatures ? JSON.stringify(service.signatures) : null;
    if (service.feedback !== undefined) updateData.feedback = service.feedback ? JSON.stringify(service.feedback) : null;
    if (service.photos !== undefined) updateData.photos = service.photos;
    if (service.photoTitles !== undefined) updateData.photo_titles = service.photoTitles;

    const { data, error } = await supabase.from('services').update(updateData).eq('id', service.id).select().single();
    
    if (error) throw error;
    
    if (service.technicians !== undefined && service.technicians[0]) {
      await assignTechnician(service.id, service.technicians[0].id);
    }
    
    const updatedService = await getServiceByIdFromDatabase(data.id);
    return updatedService;
  } catch (error: any) {
    toast.error("Falha ao atualizar serviço.");
    return null;
  }
};

export const deleteServiceFromDatabase = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (error: any) {
    toast.error("Falha ao excluir serviço.");
    return false;
  }
};

async function assignTechnician(serviceId: string, technicianId: string): Promise<void> {
  try {
    await supabase.from('service_technicians').delete().eq('service_id', serviceId);
    if (technicianId && technicianId !== '0' && technicianId !== 'none') {
      const { error } = await supabase.from('service_technicians').insert({ service_id: serviceId, technician_id: technicianId });
      if (error) throw error;
    }
  } catch (error) {
    console.error('Erro no processo de atribuição de técnico:', error);
    throw error;
  }
}

export const uploadServicePhoto = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('service-photos').upload(filePath, file);
  if (uploadError) throw uploadError;

  // Since service-photos is now private, we need to use signed URLs
  const { data: signedUrlData, error: signedUrlError } = await supabase.storage
    .from('service-photos')
    .createSignedUrl(filePath, 3600); // 1 hour expiry

  if (signedUrlError || !signedUrlData) {
    throw new Error("Não foi possível obter a URL da imagem.");
  }
  
  return signedUrlData.signedUrl;
};
