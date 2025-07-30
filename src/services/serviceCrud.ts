// Arquivo: src/services/serviceCrud.ts (VERSÃO ATUALIZADA COM CONTROLE DE ACESSO)

import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, ServicePriority, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";
import { AuthUser } from '@/context/AuthContext'; // ✅ 1. Importamos o tipo do usuário

// (O restante do arquivo, como as outras funções, permanece o mesmo)
// ...

/**
 * [VERSÃO OTIMIZADA COM CONTROLE DE ACESSO]
 * Busca serviços com base no perfil do usuário.
 * - Administradores e Gestores veem todos os serviços.
 * - Técnicos veem apenas os serviços atribuídos a eles.
 */
// ✅ 2. A função agora recebe o usuário como parâmetro
export const getServicesFromDatabase = async (user: AuthUser | null): Promise<Service[]> => {
  try {
    if (!user) {
      console.log('[SERVICES] Nenhum usuário logado, retornando lista vazia.');
      return []; // Se não houver usuário, não retorna nada.
    }

    console.log(`[SERVICES] Iniciando busca de serviços para usuário ${user.id} com papel ${user.role}`);

    // Cria a base da nossa consulta ao banco de dados
    let query = supabase
      .from('services')
      .select(`
        *,
        service_technicians (
          technician_id,
          profiles (
            id,
            name,
            avatar
          )
        ),
        service_messages (*)
      `);

    // ✅ 3. A LÓGICA DE PERMISSÃO É APLICADA AQUI
    // Se o usuário for um técnico, adicionamos um filtro à consulta.
    if (user.role === 'tecnico') {
      // Filtra a tabela 'service_technicians' para incluir apenas as linhas
      // onde o 'technician_id' é igual ao 'id' do usuário logado.
      // O Supabase é inteligente o suficiente para retornar apenas os 'services'
      // que correspondem a essa condição.
      query = query.filter('service_technicians.technician_id', 'eq', user.id);
    }
    
    // Adiciona uma ordenação padrão, por exemplo, pela data de criação
    query = query.order('created_at', { ascending: false });

    // Executa a consulta já com o filtro (se aplicável)
    const { data: servicesData, error: servicesError } = await query;

    if (servicesError) {
      console.error('[SERVICES] Erro na consulta com filtro de acesso:', servicesError);
      throw servicesError;
    }

    if (!servicesData || servicesData.length === 0) {
      console.log('[SERVICES] Nenhum serviço encontrado para este perfil.');
      return [];
    }

    console.log(`[SERVICES] ${servicesData.length} serviços encontrados para ${user.role}. Processando...`);

    // O código de transformação dos dados continua o mesmo
    const services: Service[] = servicesData.map((service: any) => {
      const techProfile = service.service_technicians?.[0]?.profiles;
      const technician: TeamMember = techProfile ? {
        id: techProfile.id,
        name: techProfile.name || 'Técnico',
        avatar: techProfile.avatar || '',
        role: 'tecnico',
      } : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico',
      };

      const serviceMessages = (service.service_messages || []).map((m: any) => ({
        senderId: m.sender_id,
        senderName: m.sender_name,
        senderRole: m.sender_role,
        message: m.message,
        timestamp: m.timestamp
      }));
      
      const parseJsonField = (field: any) => {
        if (!field) return undefined;
        if (typeof field === 'object') return field;
        try { return JSON.parse(field); } catch { return undefined; }
      };
      
      const safePriority = ['baixa', 'media', 'alta', 'urgente'].includes(service.priority)
        ? service.priority as ServicePriority : 'media' as ServicePriority;
      const safeStatus = ['pendente', 'concluido', 'cancelado'].includes(service.status)
        ? service.status as ServiceStatus : 'pendente' as ServiceStatus;

      return {
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
        customFields: parseJsonField(service.custom_fields),
        signatures: parseJsonField(service.signatures),
        feedback: parseJsonField(service.feedback),
        messages: serviceMessages,
        photos: Array.isArray(service.photos) ? service.photos : [],
        photoTitles: Array.isArray(service.photo_titles) ? service.photo_titles : [],
        date: service.date,
      };
    });

    return services;
  } catch (error: any) {
    console.error('[SERVICES] Erro geral na busca de serviços:', error);
    toast.error(`Erro ao buscar demandas: ${error.message || 'Erro desconhecido'}`);
    return [];
  }
};


// 👇 NENHUMA MUDANÇA NECESSÁRIA NO RESTANTE DO ARQUIVO 👇
// Create, Update, Delete, etc., continuam como estão.

export const createServiceInDatabase = async (
  service: Omit<Service, "id" | "number" | "creationDate"> & { serviceTypeId?: string }
): Promise<{ created: Service | null; technicianError?: string | null }> => {
  try {
    console.log('Criando service no banco (Supabase):', service);

    if (!service.createdBy) {
      throw new Error("Usuário não autenticado ou campo createdBy não preenchido.");
    }

    const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0");
    const timestamp = Date.now();
    const number = `SRV-${timestamp}-${random}`;

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

    const { data, error } = await supabase
      .from('services')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao criar service (Supabase):', error);
      if (error.message.toLowerCase().includes("permission denied")) {
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

    // Após criar, busca o serviço completo com o usuário atual para consistência
    const currentUser = { id: service.createdBy, role: 'gestor' } as AuthUser; // Simula um usuário para buscar
    const createdService = await getServicesFromDatabase(currentUser).then(services => services.find(s => s.id === data.id));

    return {
      created: createdService || null,
      technicianError
    };
  } catch (error: any) {
    if (error.message === "PERMISSION_DENIED") {
      toast.error("Permissão negada ao criar demanda. Consulte o administrador.");
    } else {
        console.error('Erro geral em createServiceInDatabase:', error);
        toast.error("Falha ao criar serviço no servidor");
    }
    return { created: null, technicianError: null };
  }
};


export const updateServiceInDatabase = async (service: Partial<Service> & { id: string }): Promise<Service | null> => {
  try {
    console.log('Atualizando serviço no banco:', service);
    
    const updateData: any = {
      updated_at: new Date().toISOString()
    };

    const fieldMapping: { [key in keyof Service]?: string } = {
        title: 'title',
        location: 'location',
        status: 'status',
        priority: 'priority',
        serviceType: 'service_type',
        description: 'description',
        client: 'client',
        address: 'address',
        city: 'city',
        notes: 'notes',
        estimatedHours: 'estimated_hours',
        dueDate: 'due_date',
        date: 'date',
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

    if (service.technician !== undefined) {
      await assignTechnician(service.id, service.technician.id);
    }
    
    // Simula um usuário admin para garantir que a busca do serviço atualizado funcione
    const adminUser = { id: '', role: 'administrador' } as AuthUser;
    const updatedService = await getServicesFromDatabase(adminUser).then(services => services.find(s => s.id === data.id));

    return updatedService || null;
  } catch (error: any) {
    console.error('Erro em updateServiceInDatabase:', error);
    toast.error("Falha ao atualizar serviço no servidor");
    return null;
  }
};


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
  } catch (error: any) {
    console.error('Error in deleteServiceFromDatabase:', error);
    toast.error("Falha ao excluir serviço do servidor");
    return false;
  }
};


async function assignTechnician(serviceId: string, technicianId: string): Promise<void> {
    console.log(`Atribuindo técnico ${technicianId} ao serviço ${serviceId}`);
    try {
      const { error: deleteError } = await supabase
        .from('service_technicians')
        .delete()
        .eq('service_id', serviceId);
      
      if (deleteError) {
        console.error('Erro ao limpar técnicos antigos:', deleteError);
      }
      
      if (technicianId && technicianId !== '0' && technicianId !== 'none') {
        const { error } = await supabase
          .from('service_technicians')
          .insert({
            service_id: serviceId,
            technician_id: technicianId
          });
        
        if (error) throw error;
        console.log('Técnico atribuído com sucesso.');
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

  const { error: uploadError } = await supabase.storage
    .from('service-photos')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Erro no upload da imagem:', uploadError);
    throw uploadError;
  }

  const { data: publicUrlData } = supabase.storage
    .from('service-photos')
    .getPublicUrl(filePath);

  if (!publicUrlData) {
    throw new Error("Não foi possível obter a URL pública da imagem.");
  }
  
  console.log('Imagem enviada com sucesso para:', publicUrlData.publicUrl);
  return publicUrlData.publicUrl;
};
