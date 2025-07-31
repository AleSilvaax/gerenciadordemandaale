
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { AuthUser } from '@/types/auth';

// Update profile in Supabase
export const updateUserProfile = async (userId: string, userData: Partial<AuthUser>): Promise<boolean> => {
  try {
    console.log('Updating profile for user:', userId, 'with data:', userData);
    
    // Extract the data we want to save to the profile
    const { name, email, phone, avatar } = userData;
    
    // Get current profile to preserve organization_id
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('organization_id')
      .eq('id', userId)
      .single();

    // Update the profiles table in Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId,
        name,
        avatar,
        organization_id: currentProfile?.organization_id || '00000000-0000-0000-0000-000000000001',
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false,
      });
    
    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }

    console.log('Profile updated successfully in Supabase');
    toast.success("Perfil atualizado com sucesso!");
    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    toast.error("Falha ao salvar o perfil no servidor");
    return false;
  }
};

// Fetch profile from Supabase
export const fetchUserProfile = async (userId: string): Promise<Partial<AuthUser> | null> => {
  try {
    console.log('Fetching profile for user:', userId);
    
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) {
      console.error('Error fetching profile from Supabase:', error);
      
      // If the error is 'not found', we just return null instead of throwing
      if (error.code === 'PGRST116') {
        return null;
      }
      
      throw error;
    }

    console.log('Profile fetched successfully:', data);
    return data;
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};
