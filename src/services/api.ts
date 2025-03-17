
import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceStatus, ReportData } from "@/types/service";
import { toast } from "sonner";

// Obter todas as demandas (serviços)
export async function getAllServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        technician:profiles(id, name, avatar),
        report_data(*),
        service_photos(photo_url)
      `);

    if (error) throw error;

    // Transformar os dados para o formato da interface Service
    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      status: item.status as ServiceStatus,
      location: item.location,
      number: item.number,
      technician: {
        id: item.technician?.id || "",
        name: item.technician?.name || "Não atribuído",
        avatar: item.technician?.avatar || "",
      },
      reportData: item.report_data ? {
        client: item.report_data.client || "",
        address: item.report_data.address || "",
        city: item.report_data.city || "",
        executedBy: item.report_data.executed_by || "",
        installationDate: item.report_data.installation_date || "",
        modelNumber: item.report_data.model_number || "",
        serialNumberNew: item.report_data.serial_number_new || "",
        serialNumberOld: item.report_data.serial_number_old || "",
        homologatedName: item.report_data.homologated_name || "",
        compliesWithNBR17019: item.report_data.complies_with_nbr17019 || false,
        homologatedInstallation: item.report_data.homologated_installation || false,
        requiredAdjustment: item.report_data.required_adjustment || false,
        adjustmentDescription: item.report_data.adjustment_description || "",
        validWarranty: item.report_data.valid_warranty || false,
        circuitBreakerEntry: item.report_data.circuit_breaker_entry || "",
        chargerCircuitBreaker: item.report_data.charger_circuit_breaker || "",
        cableGauge: item.report_data.cable_gauge || "",
        chargerStatus: item.report_data.charger_status || "",
        technicalComments: item.report_data.technical_comments || "",
      } : {} as ReportData,
      photos: (item.service_photos || []).map((photo: any) => photo.photo_url),
    }));
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    toast.error("Erro ao carregar as demandas");
    return [];
  }
}

// Criar uma nova demanda (serviço)
export async function createService(serviceData: {
  title: string;
  location: string;
  technician_id?: string;
}) {
  try {
    // Gerar um número sequencial para o serviço
    const { count, error: countError } = await supabase
      .from('services')
      .select('*', { count: 'exact' });
    
    if (countError) throw countError;
    
    const serviceNumber = `SV${(count || 0) + 1}`.padStart(6, '0');
    
    const { data, error } = await supabase
      .from('services')
      .insert({
        number: serviceNumber,
        title: serviceData.title,
        status: 'pendente',
        location: serviceData.location,
        technician_id: serviceData.technician_id || null,
      })
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      // Criar entrada inicial de dados do relatório
      await supabase
        .from('report_data')
        .insert({
          id: data[0].id,
          client: '',
          address: '',
          city: '',
        });
      
      return data[0].id;
    }
    
    return null;
  } catch (error) {
    console.error("Erro ao criar serviço:", error);
    toast.error("Erro ao criar nova demanda");
    return null;
  }
}

// Salvar fotos para uma demanda
export async function saveServicePhotos(serviceId: string, photoUrls: string[]) {
  try {
    const photosToInsert = photoUrls.map(url => ({
      service_id: serviceId,
      photo_url: url,
    }));
    
    const { error } = await supabase
      .from('service_photos')
      .insert(photosToInsert);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao salvar fotos:", error);
    toast.error("Erro ao salvar fotos do serviço");
    return false;
  }
}

// Atualizar uma demanda
export async function updateService(serviceId: string, serviceData: {
  title?: string;
  status?: ServiceStatus;
  location?: string;
  technician_id?: string;
}) {
  try {
    const { error } = await supabase
      .from('services')
      .update({
        title: serviceData.title,
        status: serviceData.status,
        location: serviceData.location,
        technician_id: serviceData.technician_id,
        updated_at: new Date().toISOString(),
      })
      .eq('id', serviceId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar serviço:", error);
    toast.error("Erro ao atualizar demanda");
    return false;
  }
}

// Atualizar os dados do relatório
export async function updateReportData(serviceId: string, reportData: Partial<ReportData>) {
  try {
    // Converter dados do frontend para o formato do banco
    const dbReportData = {
      id: serviceId,
      client: reportData.client,
      address: reportData.address,
      city: reportData.city,
      executed_by: reportData.executedBy,
      installation_date: reportData.installationDate,
      model_number: reportData.modelNumber,
      serial_number_new: reportData.serialNumberNew,
      serial_number_old: reportData.serialNumberOld,
      homologated_name: reportData.homologatedName,
      complies_with_nbr17019: reportData.compliesWithNBR17019,
      homologated_installation: reportData.homologatedInstallation,
      required_adjustment: reportData.requiredAdjustment,
      adjustment_description: reportData.adjustmentDescription,
      valid_warranty: reportData.validWarranty,
      circuit_breaker_entry: reportData.circuitBreakerEntry,
      charger_circuit_breaker: reportData.chargerCircuitBreaker,
      cable_gauge: reportData.cableGauge,
      charger_status: reportData.chargerStatus,
      technical_comments: reportData.technicalComments,
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('report_data')
      .upsert(dbReportData, { onConflict: 'id' });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar dados do relatório:", error);
    toast.error("Erro ao salvar dados do relatório");
    return false;
  }
}

// Obter uma demanda específica pelo ID
export async function getServiceById(serviceId: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        technician:profiles(id, name, avatar),
        report_data(*),
        service_photos(photo_url)
      `)
      .eq('id', serviceId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Transformar os dados para o formato da interface Service
    return {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      number: data.number,
      technician: {
        id: data.technician?.id || "",
        name: data.technician?.name || "Não atribuído",
        avatar: data.technician?.avatar || "",
      },
      reportData: data.report_data ? {
        client: data.report_data.client || "",
        address: data.report_data.address || "",
        city: data.report_data.city || "",
        executedBy: data.report_data.executed_by || "",
        installationDate: data.report_data.installation_date || "",
        modelNumber: data.report_data.model_number || "",
        serialNumberNew: data.report_data.serial_number_new || "",
        serialNumberOld: data.report_data.serial_number_old || "",
        homologatedName: data.report_data.homologated_name || "",
        compliesWithNBR17019: data.report_data.complies_with_nbr17019 || false,
        homologatedInstallation: data.report_data.homologated_installation || false,
        requiredAdjustment: data.report_data.required_adjustment || false,
        adjustmentDescription: data.report_data.adjustment_description || "",
        validWarranty: data.report_data.valid_warranty || false,
        circuitBreakerEntry: data.report_data.circuit_breaker_entry || "",
        chargerCircuitBreaker: data.report_data.charger_circuit_breaker || "",
        cableGauge: data.report_data.cable_gauge || "",
        chargerStatus: data.report_data.charger_status || "",
        technicalComments: data.report_data.technical_comments || "",
      } : {} as ReportData,
      photos: (data.service_photos || []).map((photo: any) => photo.photo_url),
    };
  } catch (error) {
    console.error("Erro ao buscar serviço:", error);
    toast.error("Erro ao carregar detalhes da demanda");
    return null;
  }
}

// Adicionar uma foto a um serviço
export async function addServicePhoto(serviceId: string, photoUrl: string) {
  try {
    const { error } = await supabase
      .from('service_photos')
      .insert({
        service_id: serviceId,
        photo_url: photoUrl,
      });
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao adicionar foto:", error);
    toast.error("Erro ao adicionar foto");
    return false;
  }
}

// Excluir uma demanda
export async function deleteService(serviceId: string) {
  try {
    // As tabelas relacionadas serão excluídas automaticamente devido ao ON DELETE CASCADE
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', serviceId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao excluir serviço:", error);
    toast.error("Erro ao excluir demanda");
    return false;
  }
}
