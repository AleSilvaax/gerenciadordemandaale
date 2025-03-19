
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Service, ServiceStatus } from "@/types/service";

// Create a new service
export async function createService(data: {
  title: string;
  location: string;
  technician_ids: string[]
}): Promise<string | null> {
  try {
    console.log("Creating new service:", data);
    
    // Generate a service number using the sequence
    const { data: numberData, error: numberError } = await supabase.rpc('nextval_for_service');
    
    if (numberError) {
      console.error("Error generating service number:", numberError);
      throw numberError;
    }
    
    if (numberData === null) {
      throw new Error("Failed to generate service number");
    }
    
    const serviceNumber = `SVC${numberData.toString().padStart(6, '0')}`;
    console.log("Generated service number:", serviceNumber);
    
    // Insert the new service
    const { data: serviceData, error: serviceError } = await supabase
      .from('services')
      .insert({
        title: data.title,
        location: data.location,
        status: 'pendente',
        number: serviceNumber
      })
      .select('id')
      .single();
    
    if (serviceError) {
      console.error("Error creating service:", serviceError);
      throw serviceError;
    }
    
    const serviceId = serviceData?.id;
    if (!serviceId) {
      throw new Error("Service ID not returned after creation");
    }
    
    console.log("Service created with ID:", serviceId);
    
    // Add technicians to the service
    if (data.technician_ids.length > 0) {
      const techniciansToInsert = data.technician_ids.map(techId => ({
        service_id: serviceId,
        technician_id: techId
      }));
      
      const { error: techniciansError } = await supabase
        .from('service_technicians')
        .insert(techniciansToInsert);
      
      if (techniciansError) {
        console.error("Error adding technicians to service:", techniciansError);
        // Continue with the service creation even if technician assignment fails
      }
    }
    
    return serviceId;
  } catch (error) {
    console.error("Error in createService:", error);
    toast.error("Erro ao criar demanda");
    return null;
  }
}

// Get all services
export async function getAllServices(): Promise<Service[]> {
  try {
    console.log("Fetching all services");
    
    // Get all services
    const { data: services, error: servicesError } = await supabase
      .from('services')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (servicesError) {
      console.error("Error fetching services:", servicesError);
      throw servicesError;
    }
    
    if (!services) {
      return [];
    }
    
    // Get all service technicians
    const { data: allTechRelations, error: techError } = await supabase
      .from('service_technicians')
      .select('service_id, technician_id');
    
    if (techError) {
      console.error("Error fetching technician relations:", techError);
      // Continue with partial data
    }
    
    // Get all technician profiles
    const { data: allProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar');
    
    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      // Continue with partial data
    }
    
    // Process data
    const result = services.map(service => {
      // Get technicians for this service
      const techRelations = allTechRelations?.filter(r => r.service_id === service.id) || [];
      const technicianIds = techRelations.map(r => r.technician_id);
      const technicians = allProfiles?.filter(p => technicianIds.includes(p.id)) || [];
      
      // Convert to app format
      return {
        id: service.id,
        title: service.title,
        status: service.status as ServiceStatus,
        location: service.location,
        technicians: technicians.map(t => ({
          id: t.id,
          name: t.name || 'Sem nome',
          avatar: t.avatar || ''
        })),
        reportData: {
          client: "",
          address: "",
          city: "",
          executedBy: "",
          installationDate: "",
          modelNumber: "",
          serialNumberNew: "",
          serialNumberOld: "",
          homologatedName: "",
          compliesWithNBR17019: false,
          homologatedInstallation: false,
          requiredAdjustment: false,
          adjustmentDescription: "",
          validWarranty: false,
          circuitBreakerEntry: "",
          chargerCircuitBreaker: "",
          cableGauge: "",
          chargerStatus: "",
          technicalComments: ""
        },
        photos: [],
        number: service.number
      };
    });
    
    return result;
  } catch (error) {
    console.error("Error in getAllServices:", error);
    toast.error("Erro ao buscar demandas");
    return [];
  }
}

// Update service
export async function updateService(id: string, data: Partial<Service>): Promise<boolean> {
  try {
    console.log("Updating service:", id, data);
    
    // Update basic service data
    if (data.title || data.location || data.status) {
      const { error: serviceError } = await supabase
        .from('services')
        .update({
          title: data.title,
          location: data.location,
          status: data.status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id);
      
      if (serviceError) {
        console.error("Error updating service:", serviceError);
        throw serviceError;
      }
    }
    
    // Update technicians if provided
    if (data.technicians) {
      // First, remove all existing technician relations
      const { error: deleteError } = await supabase
        .from('service_technicians')
        .delete()
        .eq('service_id', id);
      
      if (deleteError) {
        console.error("Error removing technician relations:", deleteError);
        throw deleteError;
      }
      
      // Then add new relations
      const technicianIds = data.technicians.map(tech => tech.id).filter(Boolean);
      
      if (technicianIds.length > 0) {
        const techniciansToInsert = technicianIds.map(techId => ({
          service_id: id,
          technician_id: techId
        }));
        
        const { error: insertError } = await supabase
          .from('service_technicians')
          .insert(techniciansToInsert);
        
        if (insertError) {
          console.error("Error adding technician relations:", insertError);
          throw insertError;
        }
      }
    }
    
    return true;
  } catch (error) {
    console.error("Error in updateService:", error);
    toast.error("Erro ao atualizar demanda");
    return false;
  }
}

// Delete a service
export async function deleteService(id: string): Promise<boolean> {
  try {
    console.log("Deleting service:", id);
    
    // Delete related data
    const tables = ['service_photos', 'service_technicians', 'report_data'];
    
    for (const table of tables) {
      if (table === 'report_data') {
        const { error } = await supabase
          .from('report_data')
          .delete()
          .eq('id', id);
        
        if (error && error.code !== 'PGRST116') {
          console.error(`Error deleting related data from report_data:`, error);
        }
      } else if (table === 'service_photos') {
        const { error } = await supabase
          .from('service_photos')
          .delete()
          .eq('service_id', id);
        
        if (error && error.code !== 'PGRST116') {
          console.error(`Error deleting related data from service_photos:`, error);
        }
      } else if (table === 'service_technicians') {
        const { error } = await supabase
          .from('service_technicians')
          .delete()
          .eq('service_id', id);
        
        if (error && error.code !== 'PGRST116') {
          console.error(`Error deleting related data from service_technicians:`, error);
        }
      }
    }
    
    // Then delete the service
    const { error } = await supabase
      .from('services')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error("Error deleting service:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in deleteService:", error);
    toast.error("Erro ao excluir demanda");
    return false;
  }
}

// Convert database service to app service format
export function convertDbServiceToAppService(dbService: any): Service {
  return {
    id: dbService.id,
    title: dbService.title,
    status: dbService.status as ServiceStatus,
    location: dbService.location,
    technicians: dbService.technicians || [],
    reportData: dbService.reportData || {
      client: "",
      address: "",
      city: "",
      executedBy: "",
      installationDate: "",
      modelNumber: "",
      serialNumberNew: "",
      serialNumberOld: "",
      homologatedName: "",
      compliesWithNBR17019: false,
      homologatedInstallation: false,
      requiredAdjustment: false,
      adjustmentDescription: "",
      validWarranty: false,
      circuitBreakerEntry: "",
      chargerCircuitBreaker: "",
      cableGauge: "",
      chargerStatus: "",
      technicalComments: ""
    },
    photos: dbService.photos || [],
    number: dbService.number
  };
}
