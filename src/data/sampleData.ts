
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/serviceTypes';

export const createSampleServices = async (userId: string): Promise<void> => {
  console.log('Criando demandas de exemplo...');
  
  try {
    // Buscar outros usuários para atribuir como técnicos
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, name')
      .limit(5);
    
    const technicians = profiles || [{ id: userId, name: 'Técnico Principal' }];
    
    const sampleServices = [
      {
        title: 'Instalação de carregador residencial',
        location: 'Rua das Flores, 123 - São Paulo/SP',
        description: 'Instalação de carregador veicular de 7kW em residência. Cliente possui garagem coberta e quadro elétrico compatível.',
        status: 'pendente'
      },
      {
        title: 'Manutenção preventiva - Shopping Center',
        location: 'Shopping Plaza - Av. Paulista, 1000 - São Paulo/SP',
        description: 'Manutenção preventiva em 4 carregadores de 22kW. Verificação de conectores, limpeza e teste de funcionamento.',
        status: 'em_andamento'
      },
      {
        title: 'Vistoria técnica pós-instalação',
        location: 'Condomínio Residencial Vila Verde - Santos/SP',
        description: 'Vistoria técnica para aprovação da instalação de 2 carregadores no estacionamento do condomínio.',
        status: 'concluido'
      },
      {
        title: 'Reparo em carregador comercial',
        location: 'Posto Shell - Rodovia dos Bandeirantes, km 45',
        description: 'Carregador apresentando erro E04. Necessário diagnóstico e reparo do sistema de comunicação.',
        status: 'pendente'
      },
      {
        title: 'Instalação em empresa',
        location: 'Empresa TechCorp - Av. das Nações, 500 - Campinas/SP',
        description: 'Instalação de 3 carregadores de 11kW para frota corporativa. Inclui adequação elétrica.',
        status: 'em_andamento'
      },
      {
        title: 'Atualização de firmware',
        location: 'Rede de Hotéis Premium - Diversos endereços',
        description: 'Atualização de firmware em 12 carregadores distribuídos em 4 hotéis da rede.',
        status: 'concluido'
      },
      {
        title: 'Instalação emergencial',
        location: 'Hospital São Lucas - Rua da Saúde, 200 - São Paulo/SP',
        description: 'Instalação urgente de carregador para ambulâncias elétricas. Prioridade alta.',
        status: 'pendente'
      },
      {
        title: 'Treinamento de operação',
        location: 'Universidade Federal - Campus Central',
        description: 'Treinamento da equipe de manutenção para operação dos novos carregadores instalados.',
        status: 'concluido'
      }
    ];

    // Criar cada serviço
    for (let i = 0; i < sampleServices.length; i++) {
      const service = sampleServices[i];
      const technician = technicians[i % technicians.length];
      
      // Criar o serviço
      const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .insert({
          title: service.title,
          location: service.location,
          description: service.description,
          status: service.status,
          number: String(i + 1).padStart(6, '0')
        })
        .select('id')
        .single();
      
      if (serviceError) {
        console.error('Erro ao criar serviço:', serviceError);
        continue;
      }
      
      // Atribuir técnico ao serviço
      if (serviceData) {
        const { error: techError } = await supabase
          .from('service_technicians')
          .insert({
            service_id: serviceData.id,
            technician_id: technician.id
          });
        
        if (techError) {
          console.error('Erro ao atribuir técnico:', techError);
        }
        
        // Adicionar algumas mensagens de exemplo para alguns serviços
        if (i % 2 === 0) {
          await supabase
            .from('service_messages')
            .insert([
              {
                service_id: serviceData.id,
                sender_id: userId,
                sender_name: 'Admin',
                sender_role: 'administrador',
                message: 'Serviço criado e atribuído ao técnico responsável.'
              },
              {
                service_id: serviceData.id,
                sender_id: technician.id,
                sender_name: technician.name,
                sender_role: 'tecnico',
                message: 'Confirmado. Vou iniciar o atendimento em breve.'
              }
            ]);
        }
      }
    }
    
    console.log('Demandas de exemplo criadas com sucesso!');
  } catch (error) {
    console.error('Erro ao criar demandas de exemplo:', error);
  }
};
