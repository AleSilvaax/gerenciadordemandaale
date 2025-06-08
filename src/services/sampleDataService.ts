
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { createDefaultServiceTypes } from './api/serviceTypesApi';

// Criar dados de exemplo básicos compatíveis com usuários reais
export const createSampleData = async (): Promise<boolean> => {
  try {
    console.log('Criando dados de exemplo...');
    
    // First ensure service types exist
    await createDefaultServiceTypes();
    
    // Verificar se já existem serviços
    const { data: existingServices, error: servicesError } = await supabase
      .from('services')
      .select('id')
      .limit(1);
    
    if (servicesError) {
      console.error('Erro ao verificar serviços existentes:', servicesError);
      return false;
    }
    
    // Se já existem serviços, não criar dados de exemplo
    if (existingServices && existingServices.length > 0) {
      console.log('Dados de exemplo já existem');
      return true;
    }

    // Get current user info
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      console.log('Usuário não autenticado');
      toast.error('Você precisa estar logado para criar dados de exemplo');
      return false;
    }

    // Get user's team
    const { data: profileData } = await supabase
      .from('profiles')
      .select('team_id')
      .eq('id', userData.user.id)
      .single();

    const teamId = profileData?.team_id;

    // Get service types to use in examples
    const { data: serviceTypes } = await supabase
      .from('service_types')
      .select('id, name')
      .limit(3);

    if (!serviceTypes || serviceTypes.length === 0) {
      console.error('Nenhum tipo de serviço encontrado');
      return false;
    }
    
    // Criar algumas demandas de exemplo
    const sampleServices = [
      {
        title: 'Instalação de carregador residencial',
        location: 'Rua das Flores, 123 - São Paulo/SP',
        description: 'Instalação de carregador veicular de 7kW em residência',
        status: 'pendente',
        number: `SAMPLE-${Date.now()}-001`,
        team_id: teamId,
        service_type_id: serviceTypes.find(t => t.name.includes('Instalação'))?.id || serviceTypes[0].id
      },
      {
        title: 'Manutenção preventiva - Shopping',
        location: 'Shopping Plaza - Av. Paulista, 1000',
        description: 'Manutenção preventiva em carregadores de 22kW',
        status: 'em_andamento',
        number: `SAMPLE-${Date.now()}-002`,
        team_id: teamId,
        service_type_id: serviceTypes.find(t => t.name.includes('Preventiva'))?.id || serviceTypes[1].id
      },
      {
        title: 'Reparo emergencial',
        location: 'Posto Shell - Rodovia dos Bandeirantes',
        description: 'Carregador apresentando erro E04',
        status: 'pendente',
        number: `SAMPLE-${Date.now()}-003`,
        team_id: teamId,
        service_type_id: serviceTypes.find(t => t.name.includes('Emergência'))?.id || serviceTypes[2].id
      }
    ];
    
    const { data: createdServices, error: createError } = await supabase
      .from('services')
      .insert(sampleServices)
      .select('*');
    
    if (createError) {
      console.error('Erro ao criar dados de exemplo:', createError);
      return false;
    }
    
    console.log('Dados de exemplo criados:', createdServices);
    toast.success('Dados de exemplo criados com sucesso!');
    return true;
    
  } catch (error) {
    console.error('Erro geral ao criar dados de exemplo:', error);
    return false;
  }
};
