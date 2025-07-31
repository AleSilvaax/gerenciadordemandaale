// Arquivo: src/services/serviceCrud.ts (VERSÃO ATUALIZADA E COMPLETA)

import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";
import { AuthUser } from '@/context/AuthContext';

// ✅ ATUALIZADO: A função agora transforma uma lista de técnicos
const transformServiceData = (service: any): Service => {
  const technicians: TeamMember[] = (service.service_technicians || []).map((st: any) => {
    // Garante que o perfil existe antes de tentar acessá-lo
    if (!st.profiles) return null;
    return {
      id: st.profiles.id,
      name: st.profiles.name || 'Técnico',
      avatar: st.profiles.avatar || '',
      role: 'tecnico',
    };
  }).filter(Boolean); // Remove quaisquer técnicos nulos da lista

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
    id: service.id, title: service.title || 'Sem título', location: service.location || 'Local não informado',
    status: safeStatus, 
    technicians: technicians, // ✅ ATUALIZADO para a lista
    creationDate: service.created_at,
    dueDate: service.due_date, priority: safePriority, serviceType: service.service_type || 'Vistoria',
    number: service.number, description: service.description, createdBy: service.created_by,
    client: service.client, address: service.address, city: service.city,
    notes: service.notes, estimatedHours: service.estimated_hours,
    customFields: parseJsonField(service.custom_fields), signatures: parseJsonField(service.signatures),
    feedback: parseJsonField(service.feedback), messages: serviceMessages,
    photos: Array.isArray(service.photos) ? service.photos : [],
    photoTitles: Array.isArray(service.photo_titles) ? service.photo_titles : [],
    date: service.date,
  };
}

export const getServicesFromDatabase = async (user: AuthUser | null): Promise<Service[]> => {
  try {
    if (!user) return [];
    let query = supabase
      .from('services')
      .select(`*, service_technicians!inner(profiles(id, name, avatar)), service_messages(*)`);
    if (user.role === 'tecnico') {
      query = query.filter('service_technicians.technician_id', 'eq', user.id);
    }
    const { data: servicesData, error: servicesError } = await query.order('created_at', { ascending: false });
    if (servicesError) throw servicesError;
    if (!servicesData) return [];
    return servicesData.map(transformServiceData);
  } catch (error: any) {
    toast.error(`Erro ao buscar demandas: ${error.message || 'Erro desconhecido'}`);
    return [];
  }
};

export const getServiceByIdFromDatabase = async (serviceId: string, user: AuthUser | null): Promise<Service | null> => {
  if (!user) return null;
  let query = supabase
    .from('services')
    .select(`*, service_technicians(profiles(id, name, avatar)), service_messages(*)`)
    .eq('id', serviceId);
  if (user.role === 'tecnico') {
    query = query.filter('service_technicians.technician_id', 'eq', user.id);
  }
  const { data, error } = await query.single();
  if (error || !data) {
    return null;
  }
  return transformServiceData(data);
};

// ✅ ATUALIZADO: Renomeado de assignTechnician para lidar com múltiplos
async function assignTechnicians(serviceId: string, technicians: TeamMember[]): Promise<void> {
  try {
    await supabase.from('service_technicians').delete().eq('service_id', serviceId);
    if (technicians && technicians.length > 0) {
      const newAssignments = technicians.map(tech => ({
        service_id: serviceId,
        technician_id: tech.id,
      }));
      const { error } = await supabase.from('service_technicians').insert(newAssignments);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Erro no processo de atribuição de técnicos:', error);
    throw error;
  }
}

export const createServiceInDatabase = async (
  service: Omit<Service, "id" | "number" | "creationDate"> & { serviceTypeId?: string }
): Promise<{ created: Service | null; technicianError?: string | null }> => {
  try {
    if (!service.createdBy) {
      throw new Error("Usuário não autenticado.");
    }

    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const timestamp = Date.now();
    const number = `SRV-${timestamp}-${random}`;

    const insertData = {
      title: service.title, location: service.location, status: service.status, number,
      due_date: service.dueDate ?? null, priority: service.priority ?? 'media',
      service_type: service.serviceType ?? 'Vistoria', service_type_id: service.serviceTypeId ?? null,
      description: service.description ?? null, created_by: service.createdBy ?? null,
      client: service.client ?? null, address: service.address ?? null, city: service.city ?? null,
      notes: service.notes ?? null, estimated_hours: service.estimatedHours ?? null,
      custom_fields: service.customFields ? JSON.stringify(service.customFields) : null,
      signatures: service.signatures ? JSON.stringify(service.signatures) : null,
      feedback: service.feedback ? JSON.stringify(service.feedback) : null,
      photos: service.photos ?? null, photo_titles: service.photoTitles ?? null,
      date: service.date ?? null
    };

    const { data, error } = await supabase.from('services').insert(insertData).select().single();
    if (error) throw error;

    let technicianError: string | null = null;
    // ✅ ATUALIZADO: Chama a nova função para atribuir a lista de técnicos
    if (service.technicians && service.technicians.length > 0) {
      try {
        await assignTechnicians(data.id, service.technicians);
      } catch (err: any) {
        technicianError = "Erro ao atribuir técnicos.";
      }
    }

    const currentUser = { id: service.createdBy, role: 'gestor' } as AuthUser;
    const createdService = await getServiceByIdFromDatabase(data.id, currentUser);
    return { created: createdService, technicianError };
  } catch (error: any) {
    toast.error("Falha ao criar serviço.");
    return { created: null, technicianError: null };
  }
};

export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    const updateData: { [key: string]: any } = { updated_at: new Date().toISOString() };
    const fieldMapping: { [key in keyof Omit<Service, 'technicians'>]?: string } = {
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
    
    if (service.customFields !== undefined) updateData.custom_fields = JSON.stringify(service.customFields);
    if (service.signatures !== undefined) updateData.signatures = JSON.stringify(service.signatures);
    if (service.feedback !== undefined) updateData.feedback = JSON.stringify(service.feedback);
    if (service.photos !== undefined) updateData.photos = service.photos;
    if (service.photoTitles !== undefined) updateData.photo_titles = service.photoTitles;

    const { data, error } = await supabase.from('services').update(updateData).eq('id', service.id).select().single();
    if (error) throw error;
    
    // ✅ ATUALIZADO: Verifica se a propriedade 'technicians' foi enviada para atualização
    if (service.technicians !== undefined) {
      await assignTechnicians(service.id, service.technicians);
    }
    
    const adminUser = { id: '', role: 'administrador' } as AuthUser;
    const updatedService = await getServiceByIdFromDatabase(data.id, adminUser);
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

export const uploadServicePhoto = async (file: File): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
  const filePath = `public/${fileName}`;

  const { error: uploadError } = await supabase.storage.from('service-photos').upload(filePath, file);
  if (uploadError) throw uploadError;

  const { data: publicUrlData } = supabase.storage.from('service-photos').getPublicUrl(filePath);
  if (!publicUrlData) throw new Error("Não foi possível obter a URL pública da imagem.");
  
  return publicUrlData.publicUrl;
};
