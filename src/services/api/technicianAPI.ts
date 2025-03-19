
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TeamMember } from "@/types/service";

// Get all technicians
export async function getAllTechnicians(): Promise<TeamMember[]> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .order('name');
    
    if (error) {
      console.error("Error fetching technicians:", error);
      throw error;
    }
    
    return data?.map(profile => ({
      id: profile.id,
      name: profile.name || 'Sem nome',
      avatar: profile.avatar || '',
      role: 'tecnico'
    })) || [];
  } catch (error) {
    console.error("Error in getAllTechnicians:", error);
    toast.error("Erro ao buscar técnicos");
    return [];
  }
}

// Get technicians by service ID
export async function getTechniciansByServiceId(serviceId: string): Promise<TeamMember[]> {
  try {
    const { data: techRelations, error: techError } = await supabase
      .from('service_technicians')
      .select('technician_id')
      .eq('service_id', serviceId);
    
    if (techError) {
      console.error("Error fetching technician relations:", techError);
      return [];
    }
    
    const technicianIds = techRelations?.map(r => r.technician_id) || [];
    
    if (technicianIds.length === 0) {
      return [];
    }
    
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, name, avatar')
      .in('id', technicianIds);
    
    if (profilesError) {
      console.error("Error fetching technician profiles:", profilesError);
      return [];
    }
    
    return profiles?.map(profile => ({
      id: profile.id,
      name: profile.name || 'Sem nome',
      avatar: profile.avatar || '',
      role: 'tecnico'
    })) || [];
  } catch (error) {
    console.error("Error in getTechniciansByServiceId:", error);
    return [];
  }
}
