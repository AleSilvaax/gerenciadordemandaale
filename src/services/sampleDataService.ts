
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

    // Check if service types exist, if not create them
    const { data: existingTypes } = await supabase
      .from('service_types')
      .select('id')
      .limit(1);

    if (!existingTypes || existingTypes.length === 0) {
      console.log('Creating default service types...');
      
      const defaultTypes = [
        {
          name: 'Manutenção Preventiva',
          description: 'Serviços de manutenção preventiva em equipamentos',
          estimated_hours: 2,
          default_priority: 'media'
        },
        {
          name: 'Manutenção Corretiva',
          description: 'Reparos e correções em equipamentos com defeito',
          estimated_hours: 4,
          default_priority: 'alta'
        },
        {
          name: 'Instalação',
          description: 'Instalação de novos equipamentos ou sistemas',
          estimated_hours: 6,
          default_priority: 'media'
        },
        {
          name: 'Inspeção',
          description: 'Inspeção técnica e avaliação de equipamentos',
          estimated_hours: 1,
          default_priority: 'baixa'
        },
        {
          name: 'Emergência',
          description: 'Atendimento de emergência para problemas críticos',
          estimated_hours: 8,
          default_priority: 'urgente'
        }
      ];
      
      const { error: typesError } = await supabase
        .from('service_types')
        .insert(defaultTypes);
      
      if (typesError) {
        console.error('Error creating service types:', typesError);
      }
    }
    
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
