import { supabase } from '@/integrations/supabase/client';
import { Service, TeamMember, UserRole, ServiceTypeConfig, ServicePriority, ServiceType, ServiceStatus } from '@/types/serviceTypes';
import { toast } from "sonner";
import { CustomField } from '@/types/serviceTypes';
import { TechnicalField } from "@/types/serviceTypes";

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

// Get all services from Supabase
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

      // Return all relevant fields
      return {
        id: service.id,
        title: service.title,
        location: service.location,
        status: service.status as ServiceStatus,
        technician: technician,
        creationDate: service.created_at,
        dueDate: service.due_date ?? undefined,
        priority: service.priority ?? undefined,
        serviceType: service.service_type ?? undefined,
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
export const createServiceInDatabase = async (service: Omit<Service, "id"> & { serviceTypeId?: string }): Promise<Service | null> => {
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
      // Adicione mais campos se necessário
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
      // Retira tratamento de funções específicas (nextval_for_service)
      if (
        typeof error?.message === "string" &&
        error.message.toLowerCase().includes("permission denied")
      ) {
        throw new Error("PERMISSION_DENIED");
      }
      throw error;
    }

    console.log('Service criado com sucesso:', data);

    if (service.technician && service.technician.id && service.technician.id !== '0' && data.id) {
      await assignTechnician(data.id, service.technician.id);
    }

    // Helpers - safe type assertions and parse functions
    const safePriority = typeof data.priority === 'string' &&
      ['baixa', 'media', 'alta', 'urgente'].includes(data.priority)
      ? data.priority as ServicePriority
      : undefined;
    const safeServiceType = typeof data.service_type === 'string' &&
      ['Vistoria', 'Instalação', 'Manutenção'].includes(data.service_type)
      ? data.service_type as ServiceType
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
    };
  } catch (error) {
    // Exibe erro de permissão genérico
    if (typeof error?.message === "string" && error.message === "PERMISSION_DENIED") {
      toast.error("Permissão negada ao criar demanda. Consulte o administrador.");
    }
    console.error('Erro geral em createServiceInDatabase:', error);
    toast.error("Falha ao criar serviço no servidor");
    return null;
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

// Add a message to a service
export const addServiceMessageToDatabase = async (
  serviceId: string, 
  message: { text: string, type: string, author: string, author_name?: string }
): Promise<boolean> => {
  try {
    console.log('Adding message to service:', serviceId, message);
    
    // Call the Edge Function to add a message
    const { data, error } = await supabase.functions.invoke('add_service_message', {
      body: { 
        serviceId, 
        message: {
          text: message.text,
          type: message.type,
          author: message.author,
          author_name: message.author_name
        }
      }
    });
    
    if (error) {
      console.error('Error adding message to service:', error);
      throw error;
    }
    
    console.log('Message added successfully', data);
    return true;
  } catch (error) {
    console.error('Error in addServiceMessageToDatabase:', error);
    toast.error("Falha ao adicionar mensagem ao serviço");
    return false;
  }
};

// Fetch all team members (profiles + role)
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  // Get all profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*');
  if (profileError) throw profileError;
  if (!profiles || !Array.isArray(profiles)) return [];

  // Get all user_roles
  const { data: roles, error: roleError } = await supabase
    .from('user_roles')
    .select('user_id, role');
  if (roleError) throw roleError;

  // Merge profiles with their roles
  const members: TeamMember[] = profiles.map(profile => {
    const role = roles?.find(r => r.user_id === profile.id)?.role as UserRole || "tecnico";
    return {
      id: profile.id,
      name: profile.name || "Sem Nome",
      avatar: profile.avatar || "",
      role
    };
  });
  return members;
};

// Add a new team member (profile + user_role)
export const addTeamMember = async (member: {
  name: string;
  role: UserRole;
  // Do NOT insert email, phone, or signature, as they're not in the profiles DB schema
  avatar?: string;
  id?: string; // Only needed if explicitly setting, otherwise leave for Supabase
}): Promise<TeamMember> => {
  // Prepare safe insert object
  const insertData: any = {
    name: member.name,
    avatar: member.avatar || null
  };
  if (member.id) {
    insertData.id = member.id;
  }
  // Insert profile (id is only set if provided)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .insert(insertData)
    .select()
    .single();

  if (profileError) throw profileError;

  // Add user_role for this member
  const { error: roleError } = await supabase
    .from('user_roles')
    .insert({
      user_id: profile.id,
      role: member.role
    });
  if (roleError) throw roleError;

  // Return new member with role
  return {
    id: profile.id,
    name: profile.name || "",
    avatar: profile.avatar || "",
    role: member.role
  };
};

// Update a team member
export const updateTeamMember = async (memberId: string, data: Partial<TeamMember>): Promise<boolean> => {
  // Update the profile
  const { error } = await supabase
    .from('profiles')
    .update({
      name: data.name,
      avatar: data.avatar,
      email: data.email,
      phone: data.phone,
      signature: data.signature
    })
    .eq('id', memberId);

  if (error) throw error;

  // If changing role, update user_roles
  if (data.role) {
    const { error: roleError } = await supabase
      .from('user_roles')
      .update({ role: data.role })
      .eq('user_id', memberId);
    if (roleError) throw roleError;
  }
  return true;
};

// Delete a team member
export const deleteTeamMember = async (memberId: string): Promise<boolean> => {
  // Delete profile (this should cascade via FK to user_roles)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', memberId);
  if (error) throw error;
  return true;
};

// Service messaging - persistente no banco
import { ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';

// Adicionar mensagem ao serviço e retornar as mensagens atualizadas do serviço
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

// Funções para Tipo de Serviço e Campos Técnicos (Banco de Dados Supabase)

// Busca todos os tipos de serviço
export const getServiceTypesFromDatabase = async (): Promise<ServiceTypeConfig[]> => {
  try {
    const { data: types, error } = await supabase
      .from("service_types")
      .select("*");

    if (error || !types) {
      throw error || new Error("Falha ao carregar tipos");
    }

    // Busca fields para cada tipo de serviço
    const { data: allFields, error: fieldsError } = await supabase
      .from("technical_fields")
      .select("*");

    if (fieldsError) throw fieldsError;

    return types.map((type) => ({
      id: type.id,
      name: type.name,
      description: type.description ?? "",
      fields: (allFields || [])
        .filter((f) => f.service_type_id === type.id)
        .map((f) => {
          let options: string[] | undefined = undefined;
          if (f.options) {
            if (Array.isArray(f.options)) {
              // Safely map to strings
              const strArray = f.options.map(opt => String(opt));
              if (strArray.every(x => typeof x === "string")) {
                options = strArray;
              }
            } else if (typeof f.options === "string") {
              try {
                const parsed = JSON.parse(f.options);
                if (Array.isArray(parsed) && parsed.every(x => typeof x === "string")) {
                  options = parsed;
                }
              } catch {
                options = undefined;
              }
            } else if (typeof f.options === "object" && f.options !== null) {
              // Convert values to string array if possible
              const asArray = Object.values(f.options);
              if (Array.isArray(asArray) && asArray.every(x => typeof x === "string")) {
                options = asArray as string[];
              } else if (Array.isArray(asArray) && asArray.every(x => typeof x === "number" || typeof x === "boolean")) {
                options = asArray.map(x => String(x));
              }
              // If not all strings (after conversion), leave options undefined
            }
          }

          return {
            id: f.id,
            name: f.name,
            type: f.type as TechnicalField["type"],
            required: f.required,
            description: f.description,
            options,
          } as TechnicalField;
        }),
    }));
  } catch (e) {
    console.error("Erro ao buscar tipos de serviço:", e);
    return [];
  }
};

// Cria novo tipo de serviço
export const createServiceType = async (type: Partial<ServiceTypeConfig>) => {
  const { data, error } = await supabase
    .from("service_types")
    .insert({ name: type.name, description: type.description })
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Atualiza tipo de serviço
export const updateServiceType = async (type: ServiceTypeConfig) => {
  const { data, error } = await supabase
    .from("service_types")
    .update({ name: type.name, description: type.description })
    .eq("id", type.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

// Exclui tipo de serviço (e cascade nos campos)
export const deleteServiceType = async (id: string) => {
  const { error } = await supabase.from("service_types").delete().eq("id", id);
  if (error) throw error;
};

// CRUD campos técnicos
export const createTechnicalField = async (serviceTypeId: string, field: Omit<TechnicalField, "id">) => {
  const { data, error } = await supabase
    .from("technical_fields")
    .insert({
      service_type_id: serviceTypeId,
      name: field.name,
      description: field.description,
      type: field.type,
      required: field.required,
      options: field.options ? JSON.stringify(field.options) : null,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const updateTechnicalField = async (field: TechnicalField) => {
  const { data, error } = await supabase
    .from("technical_fields")
    .update({
      name: field.name,
      description: field.description,
      type: field.type,
      required: field.required,
      options: field.options ? JSON.stringify(field.options) : null,
    })
    .eq("id", field.id)
    .select()
    .single();
  if (error) throw error;
  return data;
};

export const deleteTechnicalField = async (fieldId: string) => {
  const { error } = await supabase.from("technical_fields").delete().eq("id", fieldId);
  if (error) throw error;
};

// Unified exports for codebase compatibility

// Data retrieval
export const getServices = getServicesFromDatabase;

// Service CRUD
export const createService = createServiceInDatabase;
export const updateService = updateServiceInDatabase;
export const deleteService = deleteServiceFromDatabase;

// Service Types
export const getServiceTypes = getServiceTypesFromDatabase;

// Service messaging - placeholder stubs, adapt as needed
// export const addServiceMessage = () => {
//   throw new Error("addServiceMessage implementation missing");
// };
// export const addServiceFeedback = () => {
//   throw new Error("addServiceFeedback implementation missing");
// };
