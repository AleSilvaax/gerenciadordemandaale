
import { supabase } from "@/integrations/supabase/client";
import { Service, ServiceStatus, ReportData, TeamMember } from "@/types/service";
import { toast } from "sonner";

// Get next sequence value for service number
async function getNextSequenceValue(sequenceName: string) {
  try {
    const { data, error } = await supabase
      .rpc('nextval_for_service', {
        seq_name: sequenceName
      });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error getting next sequence value:", error);
    return null;
  }
}

// Create a new service
export async function createService(serviceData: {
  title: string;
  location: string;
  technician_ids: string[];
}) {
  try {
    const nextVal = await getNextSequenceValue('service_number_sequence');
    
    if (!nextVal) {
      throw new Error("Could not generate sequential number");
    }
    
    const serviceNumber = `SV${String(nextVal).padStart(5, '0')}`;
    
    const { data, error } = await supabase
      .from('services')
      .insert({
        number: serviceNumber,
        title: serviceData.title,
        status: 'pendente',
        location: serviceData.location,
      })
      .select()
      .single();
    
    if (error) throw error;
    
    if (data) {
      // Add associated technicians
      if (serviceData.technician_ids.length > 0) {
        const technicianInserts = serviceData.technician_ids.map(techId => ({
          service_id: data.id,
          technician_id: techId
        }));

        const { error: techError } = await supabase
          .from('service_technicians')
          .insert(technicianInserts);
            
        if (techError) throw techError;
      }
      
      // Create initial report data entry
      await supabase
        .from('report_data')
        .insert({
          id: data.id,
          client: '',
          address: '',
          city: '',
        });
      
      return data.id;
    }
    
    return null;
  } catch (error) {
    console.error("Error creating service:", error);
    toast.error("Error creating new service");
    return null;
  }
}

// Get a specific service by ID
export async function getServiceById(serviceId: string) {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_technicians!inner (
          technician:profiles!inner(id, name, avatar)
        ),
        report_data(*),
        service_photos(photo_url)
      `)
      .eq('id', serviceId)
      .single();
    
    if (error) throw error;
    
    if (!data) return null;
    
    // Transform data to match Service type
    const service: Service = {
      id: data.id,
      title: data.title,
      status: data.status as ServiceStatus,
      location: data.location,
      number: data.number,
      technicians: data.service_technicians.map((st: any) => ({
        id: st.technician.id,
        name: st.technician.name,
        avatar: st.technician.avatar
      })),
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
        technicalComments: data.report_data.technical_comments || ""
      } : {} as ReportData,
      photos: data.service_photos?.map((photo: any) => photo.photo_url) || []
    };
    
    return service;
  } catch (error) {
    console.error("Error getting service:", error);
    toast.error("Error loading service details");
    return null;
  }
}

// Get all services
export async function getAllServices() {
  try {
    const { data, error } = await supabase
      .from('services')
      .select(`
        *,
        service_technicians!inner (
          technician:profiles!inner(id, name, avatar)
        ),
        report_data(*),
        service_photos(photo_url)
      `);

    if (error) throw error;

    return data.map((item: any) => ({
      id: item.id,
      title: item.title,
      status: item.status as ServiceStatus,
      location: item.location,
      number: item.number,
      technicians: item.service_technicians.map((st: any) => ({
        id: st.technician.id,
        name: st.technician.name,
        avatar: st.technician.avatar
      })),
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
        technicalComments: item.report_data.technical_comments || ""
      } : {} as ReportData,
      photos: item.service_photos?.map((photo: any) => photo.photo_url) || []
    }));
  } catch (error) {
    console.error("Error getting services:", error);
    toast.error("Error loading services");
    return [];
  }
}

// Update service
export async function updateService(serviceId: string, serviceData: Partial<Service>) {
  try {
    // Update main service data
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
    
    // Update technicians
    if (serviceData.technicians) {
      // First remove existing associations
      await supabase
        .from('service_technicians')
        .delete()
        .eq('service_id', serviceId);
      
      // Add new associations
      const technicianInserts = serviceData.technicians.map(tech => ({
        service_id: serviceId,
        technician_id: tech.id
      }));
      
      if (technicianInserts.length > 0) {
        const { error: insertError } = await supabase
          .from('service_technicians')
          .insert(technicianInserts);
            
        if (insertError) throw insertError;
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error updating service:", error);
    toast.error("Error updating service");
    return false;
  }
}

// Update report data
export async function updateReportData(serviceId: string, reportData: Partial<ReportData>) {
  try {
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
      .upsert(dbReportData);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error updating report data:", error);
    toast.error("Error saving report data");
    return false;
  }
}

// Add service photo
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
    console.error("Error adding photo:", error);
    toast.error("Error adding photo");
    return false;
  }
}

// Remove service photo
export async function removeServicePhoto(photoId: string) {
  try {
    const { error } = await supabase
      .from('service_photos')
      .delete()
      .eq('id', photoId);
    
    if (error) throw error;
    
    return true;
  } catch (error) {
    console.error("Error removing photo:", error);
    toast.error("Error removing photo");
    return false;
  }
}
