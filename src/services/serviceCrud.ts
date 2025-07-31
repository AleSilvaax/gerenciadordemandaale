// Arquivo: src/services/serviceCrud.ts (VERSÃO COMPLETA E CORRIGIDA)

import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";
import { AuthUser } from '@/context/AuthContext';

const transformServiceData = (service: any): Service => {
  const technicians: TeamMember[] = (service.service_technicians || []).map((st: any) => {
    if (!st.profiles) return null;
    return { id: st.profiles.id, name: st.profiles.name || 'Técnico', avatar: st.profiles.avatar || '', role: 'tecnico' };
  }).filter(Boolean);
  const serviceMessages = (service.service_messages || []).map((m: any) => ({ senderId: m.sender_id, senderName: m.sender_name, senderRole: m.sender_role, message: m.message, timestamp: m.timestamp }));
  const parseJsonField = (field: any) => {
    if (!field) return undefined;
    if (typeof field === 'object') return field;
    try { return JSON.parse(field); } catch { return undefined; }
  };
  const safePriority = ['baixa', 'media', 'alta', 'urgente'].includes(service.priority) ? service.priority as ServicePriority : 'media' as ServicePriority;
  const safeStatus = ['pendente', 'em_andamento', 'concluido', 'cancelado', 'agendado'].includes(service.status) ? service.status as ServiceStatus : 'pendente' as ServiceStatus;

  return {
    id: service.id, title: service.title || 'Sem título', location: service.location || 'Local não informado',
    status: safeStatus, technicians: technicians, creationDate: service.created_at,
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
    let query = supabase.from('services').select(`*, service_technicians!inner(profiles(id, name, avatar)), service_messages(*)`);
    if (user.role === 'tecnico') {
      query = query.filter('service_technicians.technician_id', 'eq', user.id);
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return [];
    return data.map(transformServiceData);
  } catch (error: any) {
    toast.error(`Erro ao buscar demandas: ${error.message || 'Erro desconhecido'}`);
    return [];
  }
};

export const getServiceByIdFromDatabase = async (serviceId: string, user: AuthUser | null): Promise<Service | null> => {
  if (!user) return null;
  let query = supabase.from('services').select(`*, service_technicians(profiles(id, name, avatar)), service_messages(*)`).eq('id', serviceId);
  if (user.role === 'tecnico') {
    query = query.filter('service_technicians.technician_id', 'eq', user.id);
  }
  const { data, error } = await query.single();
  if (error || !data) return null;
  return transformServiceData(data);
};

async function assignTechnicians(serviceId: string, technicians: TeamMember[]): Promise<void> {
  try {
    await supabase.from('service_technicians').delete().eq('service_id', serviceId);
    if (technicians && technicians.length > 0) {
      const newAssignments = technicians.map(tech => ({ service_id: serviceId, technician_id: tech.id }));
      const { error } = await supabase.from('service_technicians').insert(newAssignments);
      if (error) throw error;
    }
  } catch (error) {
    console.error('Erro no processo de atribuição de técnicos:', error);
    throw error;
  }
}

export const createServiceInDatabase = async (service: Partial<Omit<Service, 'id' | 'creationDate'>> & { createdBy: string }): Promise<{ created: Service | null; technicianError?: string | null }> => {
  try {
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const timestamp = Date.now();
    const number = `SRV-${timestamp}-${random}`;
    const { technicians, ...serviceData } = service;
    const insertData = { ...serviceData, number, status: 'pendente' };

    const { data, error } = await supabase.from('services').insert(insertData).select().single();
    if (error) throw error;

    let technicianError: string | null = null;
    if (technicians && technicians.length > 0) {
      try {
        await assignTechnicians(data.id, technicians);
      } catch (err: any) { technicianError = "Erro ao atribuir técnicos."; }
    }
    const createdService = await getServiceByIdFromDatabase(data.id, { id: service.createdBy, role: 'gestor' } as AuthUser);
    return { created: createdService, technicianError };
  } catch (error: any) {
    toast.error("Falha ao criar serviço.");
    return { created: null, technicianError: null };
  }
};

export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    const { technicians, ...serviceData } = service;
    const { data, error } = await supabase.from('services').update(serviceData).eq('id', service.id).select().single();
    if (error) throw error;
    if (technicians !== undefined) {
      await assignTechnicians(service.id, technicians);
    }
    const adminUser = { id: '', role: 'administrador' } as AuthUser;
    return await getServiceByIdFromDatabase(data.id, adminUser);
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
  const { error } = await supabase.storage.from('service-photos').upload(filePath, file);
  if (error) throw error;
  const { data } = supabase.storage.from('service-photos').getPublicUrl(filePath);
  if (!data) throw new Error("Não foi possível obter a URL pública da imagem.");
  return data.publicUrl;
};
