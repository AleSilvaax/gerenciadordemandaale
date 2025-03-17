
import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceStatus } from "@/types/service";
import { toast } from "sonner";

// Obter todas as demandas
export async function getServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        technician:technician_id (id, name, avatar),
        report_data(*),
        photos:service_photos(id, photo_url)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error("Erro ao buscar demandas:", error);
    toast.error("Erro ao carregar demandas");
    return [];
  }
}

// Obter uma demanda específica
export async function getServiceById(id: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        technician:technician_id (id, name, avatar),
        report_data(*),
        photos:service_photos(id, photo_url)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Erro ao buscar demanda ${id}:`, error);
    toast.error("Erro ao carregar dados da demanda");
    return null;
  }
}

// Criar uma nova demanda
export async function createService(serviceData: Partial<Service>) {
  try {
    // Primeiro, criamos o registro do serviço
    const { data: service, error } = await supabase
      .from('services')
      .insert({
        number: serviceData.id || `SRV${Date.now().toString().slice(-8)}`,
        title: serviceData.title || 'Nova Demanda',
        status: serviceData.status || 'pendente',
        location: serviceData.location || '',
        technician_id: serviceData.technician?.id || null
      })
      .select()
      .single();

    if (error) throw error;

    // Em seguida, criamos os dados do relatório
    if (service) {
      const { error: reportError } = await supabase
        .from('report_data')
        .insert({
          id: service.id,
          client: serviceData.reportData?.client || '',
          address: serviceData.reportData?.address || '',
          city: serviceData.reportData?.city || '',
          // ... outros campos do relatório
        });

      if (reportError) throw reportError;
    }

    // Adicionar fotos, se existirem
    if (service && serviceData.photos && serviceData.photos.length > 0) {
      const photoInserts = serviceData.photos.map(photoUrl => ({
        service_id: service.id,
        photo_url: photoUrl
      }));

      const { error: photosError } = await supabase
        .from('service_photos')
        .insert(photoInserts);

      if (photosError) throw photosError;
    }

    toast.success("Demanda criada com sucesso");
    return service;
  } catch (error) {
    console.error("Erro ao criar demanda:", error);
    toast.error("Erro ao criar demanda");
    return null;
  }
}

// Atualizar uma demanda existente
export async function updateService(id: string, serviceData: Partial<Service>) {
  try {
    // Atualizar dados básicos do serviço
    const { error } = await supabase
      .from('services')
      .update({
        title: serviceData.title,
        status: serviceData.status,
        location: serviceData.location,
        technician_id: serviceData.technician?.id,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) throw error;

    // Atualizar dados do relatório
    if (serviceData.reportData) {
      const { error: reportError } = await supabase
        .from('report_data')
        .upsert({
          id: id,
          client: serviceData.reportData.client,
          address: serviceData.reportData.address,
          city: serviceData.reportData.city,
          executed_by: serviceData.reportData.executedBy,
          installation_date: serviceData.reportData.installationDate,
          model_number: serviceData.reportData.modelNumber,
          serial_number_new: serviceData.reportData.serialNumberNew,
          serial_number_old: serviceData.reportData.serialNumberOld,
          homologated_name: serviceData.reportData.homologatedName,
          complies_with_nbr17019: serviceData.reportData.compliesWithNBR17019,
          homologated_installation: serviceData.reportData.homologatedInstallation,
          required_adjustment: serviceData.reportData.requiredAdjustment,
          adjustment_description: serviceData.reportData.adjustmentDescription,
          valid_warranty: serviceData.reportData.validWarranty,
          circuit_breaker_entry: serviceData.reportData.circuitBreakerEntry,
          charger_circuit_breaker: serviceData.reportData.chargerCircuitBreaker,
          cable_gauge: serviceData.reportData.cableGauge,
          charger_status: serviceData.reportData.chargerStatus,
          technical_comments: serviceData.reportData.technicalComments,
          updated_at: new Date().toISOString()
        });

      if (reportError) throw reportError;
    }

    toast.success("Demanda atualizada com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao atualizar demanda ${id}:`, error);
    toast.error("Erro ao atualizar demanda");
    return false;
  }
}

// Excluir uma demanda
export async function deleteService(id: string) {
  try {
    // Ao excluir o serviço, as entradas relacionadas em report_data e service_photos 
    // serão excluídas automaticamente devido à restrição ON DELETE CASCADE
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    toast.success("Demanda excluída com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao excluir demanda ${id}:`, error);
    toast.error("Erro ao excluir demanda");
    return false;
  }
}

// Adicionar foto a um serviço
export async function addServicePhoto(serviceId: string, photoUrl: string) {
  try {
    const { error } = await supabase
      .from('service_photos')
      .insert({
        service_id: serviceId,
        photo_url: photoUrl
      });

    if (error) throw error;
    
    toast.success("Foto adicionada com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao adicionar foto à demanda ${serviceId}:`, error);
    toast.error("Erro ao adicionar foto");
    return false;
  }
}

// Remover foto de um serviço
export async function removeServicePhoto(photoId: string) {
  try {
    const { error } = await supabase
      .from('service_photos')
      .delete()
      .eq('id', photoId);

    if (error) throw error;
    
    toast.success("Foto removida com sucesso");
    return true;
  } catch (error) {
    console.error(`Erro ao remover foto ${photoId}:`, error);
    toast.error("Erro ao remover foto");
    return false;
  }
}

// Conversor para compatibilidade com a estrutura original
export function convertDbServiceToAppService(dbService: any): Service {
  return {
    id: dbService.number,
    title: dbService.title,
    status: dbService.status as ServiceStatus,
    location: dbService.location,
    technician: dbService.technician || { id: '', name: '', avatar: '' },
    reportData: {
      client: dbService.report_data?.client || '',
      address: dbService.report_data?.address || '',
      city: dbService.report_data?.city || '',
      executedBy: dbService.report_data?.executed_by || '',
      installationDate: dbService.report_data?.installation_date || '',
      modelNumber: dbService.report_data?.model_number || '',
      serialNumberNew: dbService.report_data?.serial_number_new || '',
      serialNumberOld: dbService.report_data?.serial_number_old || '',
      homologatedName: dbService.report_data?.homologated_name || '',
      compliesWithNBR17019: dbService.report_data?.complies_with_nbr17019 || false,
      homologatedInstallation: dbService.report_data?.homologated_installation || false,
      requiredAdjustment: dbService.report_data?.required_adjustment || false,
      adjustmentDescription: dbService.report_data?.adjustment_description || '',
      validWarranty: dbService.report_data?.valid_warranty || false,
      circuitBreakerEntry: dbService.report_data?.circuit_breaker_entry || '',
      chargerCircuitBreaker: dbService.report_data?.charger_circuit_breaker || '',
      cableGauge: dbService.report_data?.cable_gauge || '',
      chargerStatus: dbService.report_data?.charger_status || '',
      technicalComments: dbService.report_data?.technical_comments || ''
    },
    photos: dbService.photos ? dbService.photos.map((p: any) => p.photo_url) : []
  };
}
