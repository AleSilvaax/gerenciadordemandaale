
import { ServiceType } from '@/types/serviceTypes';

// Mock data para tipos de serviço - em produção viria do banco
const mockServiceTypes: ServiceType[] = [
  {
    id: '1',
    name: 'Manutenção Preventiva',
    description: 'Serviços de manutenção preventiva em equipamentos',
    estimatedHours: 2,
    defaultPriority: 'media'
  },
  {
    id: '2',
    name: 'Manutenção Corretiva',
    description: 'Reparos e correções em equipamentos com defeito',
    estimatedHours: 4,
    defaultPriority: 'alta'
  },
  {
    id: '3',
    name: 'Instalação',
    description: 'Instalação de novos equipamentos ou sistemas',
    estimatedHours: 6,
    defaultPriority: 'media'
  },
  {
    id: '4',
    name: 'Inspeção',
    description: 'Inspeção técnica e avaliação de equipamentos',
    estimatedHours: 1,
    defaultPriority: 'baixa'
  },
  {
    id: '5',
    name: 'Emergência',
    description: 'Atendimento de emergência para problemas críticos',
    estimatedHours: 8,
    defaultPriority: 'urgente'
  }
];

export const getServiceTypes = async (): Promise<ServiceType[]> => {
  // Simular delay de API
  await new Promise(resolve => setTimeout(resolve, 300));
  
  console.log('Carregando tipos de serviço:', mockServiceTypes);
  return mockServiceTypes;
};

export const getServiceTypeById = async (id: string): Promise<ServiceType | null> => {
  const serviceType = mockServiceTypes.find(type => type.id === id);
  return serviceType || null;
};
