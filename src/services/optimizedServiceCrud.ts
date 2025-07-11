
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/serviceTypes';
import { toast } from 'sonner';

export interface ServiceFilters {
  search?: string;
  status?: string;
  priority?: string;
  technicianId?: string;
  startDate?: string;
  endDate?: string;
}

export interface PaginatedServicesResponse {
  data: Service[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const optimizedServiceCrud = {
  async getServicesFromDatabase(
    page: number = 1,
    pageSize: number = 20,
    filters: ServiceFilters = {}
  ): Promise<PaginatedServicesResponse> {
    try {
      console.log('[SERVICES] Buscando serviços:', { page, pageSize, filters });

      let query = supabase
        .from('services')
        .select(`
          *,
          service_technicians!left (
            technician:profiles!technician_id (
              id, name, avatar
            )
          ),
          profiles:created_by (
            id, name, avatar
          )
        `, { count: 'exact' });

      // Aplicar filtros server-side
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%,client.ilike.%${filters.search}%`);
      }

      if (filters.status) {
        query = query.eq('status', filters.status);
      }

      if (filters.priority) {
        query = query.eq('priority', filters.priority);
      }

      if (filters.technicianId) {
        // Buscar service_ids atribuídos ao técnico
        const { data: assignedServices } = await supabase
          .from('service_technicians')
          .select('service_id')
          .eq('technician_id', filters.technicianId);

        const serviceIds = assignedServices?.map(a => a.service_id) || [];
        if (serviceIds.length > 0) {
          query = query.in('id', serviceIds);
        } else {
          // Se não há serviços atribuídos, retornar array vazio
          return {
            data: [],
            total: 0,
            page,
            pageSize,
            totalPages: 0
          };
        }
      }

      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }

      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }

      // Aplicar paginação server-side
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;
      query = query.range(startIndex, endIndex);

      // Ordenar por data de criação (mais recentes primeiro)
      query = query.order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        console.error('[SERVICES] Erro na consulta:', error);
        throw error;
      }

      // Transformar dados para o formato esperado
      const services: Service[] = (data || []).map((service: any) => {
        const technicians = service.service_technicians?.map((st: any) => st.technician) || [];
        
        return {
          ...service,
          technician: technicians.length > 0 ? technicians[0] : {
            id: '0',
            name: 'Não atribuído',
            avatar: '',
            role: 'tecnico'
          },
          technicians,
          creator: service.profiles || null,
          messages: [], // Carregadas separadamente se necessário
        };
      });

      const totalPages = Math.ceil((count || 0) / pageSize);

      console.log('[SERVICES] Dados carregados:', {
        total: count,
        returned: services.length,
        page,
        totalPages
      });

      return {
        data: services,
        total: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('[SERVICES] Erro ao buscar serviços:', error);
      toast.error('Erro ao carregar serviços');
      throw error;
    }
  },

  async createServiceInDatabase(serviceData: Partial<Service>): Promise<Service | null> {
    try {
      console.log('[SERVICES] Criando serviço:', serviceData);

      // Gerar número sequencial
      const { data: numberData } = await supabase.rpc('nextval_for_service');
      const serviceNumber = numberData?.toString().padStart(6, '0') || '000001';

      // Obter organization_id do usuário atual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('organization_id')
        .eq('id', userData.user.id)
        .single();

      if (!profile?.organization_id) {
        throw new Error('Usuário não pertence a nenhuma organização');
      }

      // Preparar dados para inserção
      const insertData = {
        title: serviceData.title,
        description: serviceData.description,
        location: serviceData.location,
        status: serviceData.status || 'pendente',
        priority: serviceData.priority || 'media',
        service_type: serviceData.serviceType,
        client: serviceData.client,
        address: serviceData.address,
        city: serviceData.city,
        date: serviceData.date,
        notes: serviceData.notes,
        estimated_hours: serviceData.estimatedHours,
        number: serviceNumber,
        created_by: userData.user.id,
        organization_id: profile.organization_id,
        custom_fields: serviceData.customFields ? JSON.stringify(serviceData.customFields) : null,
        feedback: serviceData.feedback ? JSON.stringify(serviceData.feedback) : null
      };

      const { data, error } = await supabase
        .from('services')
        .insert(insertData)
        .select(`
          *,
          service_technicians!left (
            technician:profiles!technician_id (
              id, name, avatar
            )
          )
        `)
        .single();

      if (error) {
        console.error('[SERVICES] Erro ao criar serviço:', error);
        throw error;
      }

      console.log('[SERVICES] Serviço criado:', data);
      toast.success('Serviço criado com sucesso!');

      return this.transformServiceData(data);
    } catch (error) {
      console.error('[SERVICES] Erro ao criar serviço:', error);
      toast.error('Erro ao criar serviço');
      return null;
    }
  },

  async updateServiceInDatabase(serviceData: Partial<Service>): Promise<Service | null> {
    try {
      if (!serviceData.id) {
        throw new Error('ID do serviço é obrigatório');
      }

      console.log('[SERVICES] Atualizando serviço:', serviceData.id);

      // Preparar dados para atualização
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      // Mapear apenas os campos que existem na tabela
      if (serviceData.title !== undefined) updateData.title = serviceData.title;
      if (serviceData.description !== undefined) updateData.description = serviceData.description;
      if (serviceData.location !== undefined) updateData.location = serviceData.location;
      if (serviceData.status !== undefined) updateData.status = serviceData.status;
      if (serviceData.priority !== undefined) updateData.priority = serviceData.priority;
      if (serviceData.serviceType !== undefined) updateData.service_type = serviceData.serviceType;
      if (serviceData.client !== undefined) updateData.client = serviceData.client;
      if (serviceData.address !== undefined) updateData.address = serviceData.address;
      if (serviceData.city !== undefined) updateData.city = serviceData.city;
      if (serviceData.date !== undefined) updateData.date = serviceData.date;
      if (serviceData.notes !== undefined) updateData.notes = serviceData.notes;
      if (serviceData.estimatedHours !== undefined) updateData.estimated_hours = serviceData.estimatedHours;
      if (serviceData.customFields !== undefined) updateData.custom_fields = JSON.stringify(serviceData.customFields);
      if (serviceData.feedback !== undefined) updateData.feedback = JSON.stringify(serviceData.feedback);

      const { data, error } = await supabase
        .from('services')
        .update(updateData)
        .eq('id', serviceData.id)
        .select(`
          *,
          service_technicians!left (
            technician:profiles!technician_id (
              id, name, avatar
            )
          )
        `)
        .single();

      if (error) {
        console.error('[SERVICES] Erro ao atualizar serviço:', error);
        throw error;
      }

      console.log('[SERVICES] Serviço atualizado:', data);
      toast.success('Serviço atualizado com sucesso!');

      return this.transformServiceData(data);
    } catch (error) {
      console.error('[SERVICES] Erro ao atualizar serviço:', error);
      toast.error('Erro ao atualizar serviço');
      return null;
    }
  },

  async deleteServiceFromDatabase(serviceId: string): Promise<boolean> {
    try {
      console.log('[SERVICES] Deletando serviço:', serviceId);

      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', serviceId);

      if (error) {
        console.error('[SERVICES] Erro ao deletar serviço:', error);
        throw error;
      }

      console.log('[SERVICES] Serviço deletado com sucesso');
      toast.success('Serviço removido com sucesso!');
      return true;
    } catch (error) {
      console.error('[SERVICES] Erro ao deletar serviço:', error);
      toast.error('Erro ao remover serviço');
      return false;
    }
  },

  async getMyServices(userId: string, page: number = 1, pageSize: number = 20): Promise<PaginatedServicesResponse> {
    try {
      console.log('[MY-SERVICES] Buscando serviços do técnico:', userId);

      // Buscar IDs dos serviços atribuídos ao técnico
      const { data: assignments } = await supabase
        .from('service_technicians')
        .select('service_id')
        .eq('technician_id', userId);

      const serviceIds = assignments?.map(a => a.service_id) || [];

      if (serviceIds.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          pageSize,
          totalPages: 0
        };
      }

      // Buscar os serviços com paginação
      const startIndex = (page - 1) * pageSize;
      const endIndex = startIndex + pageSize - 1;

      const { data, error, count } = await supabase
        .from('services')
        .select(`
          *,
          service_technicians!left (
            technician:profiles!technician_id (
              id, name, avatar
            )
          )
        `, { count: 'exact' })
        .in('id', serviceIds)
        .range(startIndex, endIndex)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[MY-SERVICES] Erro na consulta:', error);
        throw error;
      }

      const services = (data || []).map(service => this.transformServiceData(service));
      const totalPages = Math.ceil((count || 0) / pageSize);

      return {
        data: services,
        total: count || 0,
        page,
        pageSize,
        totalPages
      };
    } catch (error) {
      console.error('[MY-SERVICES] Erro ao buscar meus serviços:', error);
      toast.error('Erro ao carregar meus serviços');
      throw error;
    }
  },

  transformServiceData(data: any): Service {
    const technicians = data.service_technicians?.map((st: any) => st.technician) || [];
    
    return {
      ...data,
      technician: technicians.length > 0 ? technicians[0] : {
        id: '0',
        name: 'Não atribuído',
        avatar: '',
        role: 'tecnico'
      },
      technicians,
      messages: [],
      customFields: data.custom_fields ? JSON.parse(data.custom_fields) : [],
      feedback: data.feedback ? JSON.parse(data.feedback) : undefined
    };
  }
};
