
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Service } from "@/types/service";
import { convertDbServiceToAppService } from "./serviceAPI";

// Get service by ID
export async function getServiceById(id: string): Promise<any | null> {
  try {
    console.log("Fetching service by ID:", id);
    
    // Get service data
    const { data: service, error: serviceError } = await supabase
      .from('services')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (serviceError) {
      console.error("Error fetching service:", serviceError);
      throw serviceError;
    }
    
    if (!service) {
      console.log("Service not found");
      return null;
    }
    
    // Get service technicians
    const { data: technicianRelations, error: techError } = await supabase
      .from('service_technicians')
      .select('technician_id')
      .eq('service_id', id);
    
    if (techError) {
      console.error("Error fetching technician relations:", techError);
      // Continue with partial data
    }
    
    const technicianIds = technicianRelations?.map(r => r.technician_id) || [];
    
    // Get technician profiles
    let technicianProfiles = [];
    if (technicianIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, avatar')
        .in('id', technicianIds);
      
      if (profilesError) {
        console.error("Error fetching technician profiles:", profilesError);
      } else {
        technicianProfiles = profiles || [];
      }
    }
    
    // Get report data
    const { data: reportData, error: reportError } = await supabase
      .from('report_data')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    
    if (reportError && reportError.code !== 'PGRST116') {
      console.error("Error fetching report data:", reportError);
      // Continue with partial data
    }
    
    // Get service photos
    const { data: photosData, error: photosError } = await supabase
      .from('service_photos')
      .select('photo_url')
      .eq('service_id', id);
    
    if (photosError) {
      console.error("Error fetching service photos:", photosError);
      // Continue with partial data
    }
    
    // Return combined data
    return {
      ...service,
      technicians: technicianProfiles || [],
      reportData: reportData || null,
      photos: photosData?.map(p => p.photo_url) || []
    };
  } catch (error) {
    console.error("Error in getServiceById:", error);
    toast.error("Erro ao buscar dados da demanda");
    return null;
  }
}
