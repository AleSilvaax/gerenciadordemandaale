
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// Add photo to service
export async function addServicePhoto(serviceId: string, photoUrl: string): Promise<boolean> {
  try {
    console.log("Adding photo to service:", serviceId, photoUrl);
    
    const { error } = await supabase
      .from('service_photos')
      .insert({
        service_id: serviceId,
        photo_url: photoUrl
      });
    
    if (error) {
      console.error("Error adding photo to service:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in addServicePhoto:", error);
    toast.error("Erro ao adicionar foto ao serviço");
    return false;
  }
}

// Remove photo from service
export async function removeServicePhoto(photoUrl: string, serviceId: string): Promise<boolean> {
  try {
    console.log("Removing service photo by URL:", photoUrl);
    
    const { error } = await supabase
      .from('service_photos')
      .delete()
      .eq('photo_url', photoUrl)
      .eq('service_id', serviceId);
    
    if (error) {
      console.error("Error removing service photo:", error);
      throw error;
    }
    
    return true;
  } catch (error) {
    console.error("Error in removeServicePhoto:", error);
    toast.error("Erro ao remover foto do serviço");
    return false;
  }
}
