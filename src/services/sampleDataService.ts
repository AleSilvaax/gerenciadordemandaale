
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createSampleServices } from '@/data/sampleData';

export const createSampleData = async (): Promise<boolean> => {
  try {
    console.log('Creating sample data...');
    
    // Get current user
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.log('No user logged in');
      return false;
    }

    // Service types are managed via edge function, no need to create them here
    console.log('Service types are managed via edge function');
    
    // Create sample services
    await createSampleServices(userData.user.id);
    
    toast.success('Dados de exemplo criados com sucesso!');
    console.log('Sample data created successfully');
    return true;
  } catch (error) {
    console.error('Error creating sample data:', error);
    toast.error('Erro ao criar dados de exemplo');
    return false;
  }
};
