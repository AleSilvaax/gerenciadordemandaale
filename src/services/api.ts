
import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceStatus, ReportData, TeamMember } from "@/types/service";
import { toast } from "sonner";

// Convert database service format to application service format
export function convertDbServiceToAppService(dbService: any): Service {
  // Default empty array for technicians
  const technicians = dbService.technicians || [];
  
  return {
    id: dbService.id,
    title: dbService.title,
    status: dbService.status as ServiceStatus,
    location: dbService.location,
    number: dbService.number,
    technicians: technicians.map((tech: any) => ({
      id: tech.technician?.id || "",
      name: tech.technician?.name || "Não atribuído",
      avatar: tech.technician?.avatar || "",
      role: tech.technician?.role || "tecnico"
    })).filter((tech: any) => tech.id),
    reportData: dbService.report_data ? {
      client: dbService.report_data.client || "",
      address: dbService.report_data.address || "",
      city: dbService.report_data.city || "",
      executedBy: dbService.report_data.executed_by || "",
      installationDate: dbService.report_data.installation_date || "",
      modelNumber: dbService.report_data.model_number || "",
      serialNumberNew: dbService.report_data.serial_number_new || "",
      serialNumberOld: dbService.report_data.serial_number_old || "",
      homologatedName: dbService.report_data.homologated_name || "",
      compliesWithNBR17019: dbService.report_data.complies_with_nbr17019 || false,
      homologatedInstallation: dbService.report_data.homologated_installation || false,
      requiredAdjustment: dbService.report_data.required_adjustment || false,
      adjustmentDescription: dbService.report_data.adjustment_description || "",
      validWarranty: dbService.report_data.valid_warranty || false,
      circuitBreakerEntry: dbService.report_data.circuit_breaker_entry || "",
      chargerCircuitBreaker: dbService.report_data.charger_circuit_breaker || "",
      cableGauge: dbService.report_data.cable_gauge || "",
      chargerStatus: dbService.report_data.charger_status || "",
      technicalComments: dbService.report_data.technical_comments || "",
    } : {} as ReportData,
    photos: (dbService.service_photos || []).map((photo: any) => photo.photo_url),
  };
}

// Function aliases to ensure backwards compatibility
export const getServices = getAllServices;

// Obter todas as demandas (serviços)
export async function getAllServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_technicians(
          technician:profiles(id, name, avatar)
        ),
        report_data(*),
        service_photos(photo_url)
      `);

    if (error) throw error;

    // Transformar os dados para o formato da interface Service
    return data.map((item: any) => {
      // Extract technicians from nested structure
      const technicians = item.service_technicians 
        ? item.service_technicians.map((tech: any) => tech.technician).filter(Boolean)
        : [];

      return {
        id: item.id,
        title: item.title,
        status: item.status as ServiceStatus,
        location: item.location,
        number: item.number,
        technicians: technicians,
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
      };
    });
  } catch (error) {
    console.error("Erro ao buscar serviços:", error);
    toast.error("Erro ao carregar as demandas");
    return [];
  }
}

// Função para obter o próximo valor de sequência
async function getNextSequenceValue(sequenceName: string) {
  try {
    // Using raw SQL query since rpc has typing issues
    const { data, error } = await supabase
      .rpc('nextval_for_service', { seq_name: sequenceName });
    
    if (error) throw error;
    
    return data;
  } catch (error) {
    console.error("Erro ao obter próximo valor de sequência:", error);
    return null;
  }
}

// Criar uma nova demanda (serviço)
export async function createService(serviceData: {
  title: string;
  location: string;
  technician_ids: string[];
}) {
  try {
    // Gerar um número sequencial para o serviço
    const nextVal = await getNextSequenceValue('service_number_sequence');
    
    if (!nextVal) {
      throw new Error("Não foi possível gerar número sequencial");
    }
    
    const serviceNumber = `SV${String(nextVal).padStart(5, '0')}`;
    
    // Criar o serviço
    const { data, error } = await supabase
      .from('services')
      .insert({
        number: serviceNumber,
        title: serviceData.title,
        status: 'pendente',
        location: serviceData.location,
      })
      .select();
    
    if (error) throw error;
    
    if (data && data.length > 0) {
      const serviceId = data[0].id;
      
      // Adicionar os técnicos associados
      if (serviceData.technician_ids.length > 0) {
        for (const techId of serviceData.technician_ids) {
          const { error: techError } = await supabase
            .from('service_technicians')
            .insert({
              service_id: serviceId,
              technician_id: techId
            });
            
          if (techError) throw techError;
        }
      }
      
      // Criar entrada inicial de dados do relatório
      await supabase
        .from('report_data')
        .insert({
          id: serviceId,
          client: '',
          address: '',
          city: '',
        });
      
      return serviceId;
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
    for (const url of photoUrls) {
      const { error } = await supabase
        .from('service_photos')
        .insert({
          service_id: serviceId,
          photo_url: url,
        });
      
      if (error) throw error;
    }
    
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
  technician_ids?: string[];
}) {
  try {
    // Atualizar o serviço
    if (serviceData.title || serviceData.status || serviceData.location) {
      const { error } = await supabase
        .from('services')
        .update({
          title: serviceData.title,
          status: serviceData.status,
          location: serviceData.location,
          updated_at: new Date().toISOString(),
        })
        .eq('id', serviceId);
      
      if (error) throw error;
    }
    
    // Atualizar os técnicos associados
    if (serviceData.technician_ids) {
      // Primeiro remove todas as associações existentes
      const { error: deleteError } = await supabase
        .from('service_technicians')
        .delete()
        .eq('service_id', serviceId);
      
      if (deleteError) throw deleteError;
      
      // Adiciona as novas associações
      if (serviceData.technician_ids.length > 0) {
        for (const techId of serviceData.technician_ids) {
          const { error: insertError } = await supabase
            .from('service_technicians')
            .insert({
              service_id: serviceId,
              technician_id: techId
            });
            
          if (insertError) throw insertError;
        }
      }
    }
    
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
        service_technicians(
          technician:profiles(id, name, avatar)
        ),
        report_data(*),
        service_photos(photo_url)
      `)
      .eq('id', serviceId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Extract technicians from nested structure
    const technicians = data.service_technicians 
      ? data.service_technicians.map((tech: any) => tech.technician).filter(Boolean)
      : [];
    
    // Transformar os dados para o formato da interface Service
    return {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      number: data.number,
      technicians: technicians,
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

// Remover uma foto de um serviço
export async function removeServicePhoto(photoId: string) {
  try {
    const { error } = await supabase
      .from('service_photos')
      .delete()
      .eq('id', photoId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao remover foto:", error);
    toast.error("Erro ao remover foto");
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

// Atualizar avatar do técnico
export async function updateTechnicianAvatar(technicianId: string, photoUrl: string) {
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ avatar: photoUrl })
      .eq('id', technicianId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Erro ao atualizar avatar:", error);
    toast.error("Erro ao atualizar foto do técnico");
    return false;
  }
}
