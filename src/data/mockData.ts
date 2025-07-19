
import { Service, TeamMember } from '@/types/serviceTypes';

export const mockTeamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    role: 'tecnico',
    avatar: '/avatars/joao.jpg',
    email: 'joao@empresa.com',
    phone: '(11) 99999-9999',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '2',
    name: 'Maria Santos',
    role: 'gestor',
    avatar: '/avatars/maria.jpg',
    email: 'maria@empresa.com',
    phone: '(11) 88888-8888',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  },
  {
    id: '3',
    name: 'Carlos Oliveira',
    role: 'administrador',
    avatar: '/avatars/carlos.jpg',
    email: 'carlos@empresa.com',
    phone: '(11) 77777-7777',
    signature: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
  }
];

export const mockServices: Service[] = [
  {
    id: '1',
    title: 'Vistoria Elétrica - Shopping Center',
    location: 'Shopping Center ABC',
    status: 'pendente',
    technician: mockTeamMembers[0],
    creationDate: '2024-01-15T10:00:00Z',
    dueDate: '2024-01-20T18:00:00Z',
    priority: 'alta',
    serviceType: 'Vistoria',
    number: 'SRV-2024-001',
    description: 'Vistoria completa do sistema elétrico do shopping center, incluindo verificação de painéis e tomadas.',
    createdBy: 'user123',
    client: 'Shopping Center ABC Ltda',
    address: 'Av. Principal, 1000',
    city: 'São Paulo',
    notes: 'Cliente solicitou urgência devido à renovação de alvará',
    estimatedHours: 8,
    messages: [],
    photos: [],
    photoTitles: []
  },
  {
    id: '2',
    title: 'Instalação de Medidor - Residência',
    location: 'Rua das Flores, 123',
    status: 'concluido',
    technician: mockTeamMembers[1],
    creationDate: '2024-01-10T09:00:00Z',
    dueDate: '2024-01-15T17:00:00Z',
    priority: 'media',
    serviceType: 'Instalação',
    number: 'SRV-2024-002',
    description: 'Instalação de novo medidor de energia elétrica em residência.',
    createdBy: 'user456',
    client: 'José da Silva',
    address: 'Rua das Flores, 123',
    city: 'São Paulo',
    notes: 'Instalação realizada com sucesso',
    estimatedHours: 4,
    messages: [],
    photos: [],
    photoTitles: []
  }
];
