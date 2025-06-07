
import { supabase } from '@/integrations/supabase/client';
import { toast } from "sonner";
import { AuthUser } from '@/types/auth';

// Update profile in Supabase
export const updateUserProfile = async (userId: string, userData: Partial<AuthUser>): Promise<boolean> => {
  try {
    console.log('Updating profile for user:', userId, 'with data:', userData);
    
    // Extract the data we want to save to the profile
    const { name, email, phone, avatar } = userData;
    
    // Update the profiles table in Supabase
    const { error } = await supabase
      .from('profiles')
      .upsert({ 
        id: userId,
        name,
        avatar,
        // Note: phone is not in the profiles table schema, so we skip it for now
        updated_at: new Date().toISOString()
      }, { 
        onConflict: 'id',
        ignoreDuplicates: false,
      });
    
    if (error) {
      console.error('Error updating profile in Supabase:', error);
      throw error;
    }

    // Verificar se a atualização foi bem-sucedida
    const { data: updatedProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (fetchError) {
      console.error('Error fetching updated profile:', fetchError);
    } else {
      console.log('Profile updated successfully in Supabase:', updatedProfile);
    }

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
        console.log('Profile not found, will create on next update');
        return null;
      }
      
      throw error;
    }

    console.log('Profile fetched successfully:', data);
    
    // Garantir que os dados estão no formato correto
    return {
      id: data.id,
      name: data.name || '',
      avatar: data.avatar || '',
      phone: '', // Phone is not stored in profiles table currently
      email: '', // Email vem do auth, não do profile
    };
  } catch (error) {
    console.error('Error in fetchUserProfile:', error);
    return null;
  }
};

// Create initial profile for new users
export const createUserProfile = async (userId: string, userData: Partial<AuthUser>): Promise<boolean> => {
  try {
    console.log('Creating initial profile for user:', userId, 'with data:', userData);
    
    const { name, avatar } = userData;
    
    const { error } = await supabase
      .from('profiles')
      .insert({
        id: userId,
        name: name || 'Usuário',
        avatar: avatar || '',
        // Note: phone is not in the profiles table schema
      });
    
    if (error) {
      console.error('Error creating profile:', error);
      return false;
    }

    console.log('Profile created successfully');
    return true;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return false;
  }
};
