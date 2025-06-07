
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// Criar dados de exemplo básicos
export const createSampleData = async (): Promise<boolean> => {
  try {
    console.log('Criando dados de exemplo...');
    
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
    
    // Criar algumas demandas de exemplo
    const sampleServices = [
      {
        title: 'Instalação de carregador residencial',
        location: 'Rua das Flores, 123 - São Paulo/SP',
        description: 'Instalação de carregador veicular de 7kW em residência',
        status: 'pendente',
        number: `SAMPLE-${Date.now()}-001`
      },
      {
        title: 'Manutenção preventiva - Shopping',
        location: 'Shopping Plaza - Av. Paulista, 1000',
        description: 'Manutenção preventiva em carregadores de 22kW',
        status: 'em_andamento',
        number: `SAMPLE-${Date.now()}-002`
      },
      {
        title: 'Reparo emergencial',
        location: 'Posto Shell - Rodovia dos Bandeirantes',
        description: 'Carregador apresentando erro E04',
        status: 'pendente',
        number: `SAMPLE-${Date.now()}-003`
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
