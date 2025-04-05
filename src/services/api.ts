import { Service, TeamMember, StatData, ChartData, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { services as mockServices, stats as mockStats, monthlyData as mockMonthlyData, weeklyData as mockWeeklyData, serviceTypeData as mockServiceTypeData, regionData as mockRegionData } from '@/data/mockData';
import { toast } from 'sonner';

// Re-export ServiceStatus type for components that need it
export type { ServiceStatus } from '@/types/serviceTypes';

// Helper function to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Get all services
export const getServices = async (): Promise<Service[]> => {
  try {
    // Simulate API call delay
    await delay(800);
    return [...mockServices];
  } catch (error) {
    console.error('Error fetching services:', error);
    toast.error('Falha ao carregar demandas');
    return [];
  }
};

// Get service by ID
export const getServiceById = async (id: string): Promise<Service | null> => {
  try {
    // Simulate API call delay
    await delay(600);
    const service = mockServices.find(service => service.id === id);
    return service || null;
  } catch (error) {
    console.error(`Error fetching service ${id}:`, error);
    toast.error('Falha ao carregar demanda');
    return null;
  }
};

// Alias for getServiceById to fix function name mismatch
export const getService = getServiceById;

// Update service
export const updateService = async (updatedService: Service): Promise<Service> => {
  try {
    // Simulate API call delay
    await delay(1000);
    console.log('Service updated:', updatedService);
    toast.success('Demanda atualizada com sucesso');
    
    // Update the mock service in the mock services array
    const index = mockServices.findIndex(s => s.id === updatedService.id);
    if (index !== -1) {
      mockServices[index] = updatedService;
    }
    
    return updatedService;
  } catch (error) {
    console.error('Error updating service:', error);
    toast.error('Falha ao atualizar demanda');
    throw error;
  }
};

// Create new service
export const createService = async (newService: Partial<Service>): Promise<Service> => {
  try {
    // Simulate API call delay
    await delay(1000);
    
    // Create a new service with an ID
    const createdService: Service = {
      id: `SERVICE-${Date.now()}`,
      title: newService.title || 'Nova Demanda',
      status: newService.status || 'pendente',
      location: newService.location || '',
      technician: newService.technician || { id: '', name: '', avatar: '' },
      priority: newService.priority || 'media',
      dueDate: newService.dueDate || '',
      creationDate: new Date().toISOString().split('T')[0], // Today's date
      date: new Date().toISOString().split('T')[0], // Add date field
      photos: newService.photos || [],
      photoTitles: newService.photoTitles || [],
      reportData: newService.reportData || {},
      signatures: newService.signatures || {},
      serviceType: newService.serviceType || 'inspection',
      description: newService.description || '',
      client: newService.client || '',
      address: newService.address || '',
      city: newService.city || '',
      notes: newService.notes || '',
      estimatedHours: newService.estimatedHours || 0,
      messages: [],
      feedback: undefined,
      customFields: []
    };
    
    // Add the new service to the mock services array
    mockServices.push(createdService);
    
    console.log('Service created:', createdService);
    toast.success('Demanda criada com sucesso');
    return createdService;
  } catch (error) {
    console.error('Error creating service:', error);
    toast.error('Falha ao criar demanda');
    throw error;
  }
};

// Delete service
export const deleteService = async (id: string): Promise<boolean> => {
  try {
    // Simulate API call delay
    await delay(800);
    
    // Remove the service from the mock services array
    const index = mockServices.findIndex(service => service.id === id);
    if (index !== -1) {
      mockServices.splice(index, 1);
    }
    
    console.log('Service deleted:', id);
    toast.success('Demanda excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    toast.error('Falha ao excluir demanda');
    return false;
  }
};

// Team members mock data
const mockTeamMembers: TeamMember[] = [
  { id: 'user-1', name: 'João Silva', avatar: '/avatars/user-1.png', role: 'tecnico', phone: '(11) 98765-4321' },
  { id: 'user-2', name: 'Maria Oliveira', avatar: '/avatars/user-2.png', role: 'administrador', phone: '(11) 91234-5678' },
  { id: 'user-3', name: 'Carlos Santos', avatar: '/avatars/user-3.png', role: 'tecnico', phone: '(11) 99876-5432' },
  { id: 'user-4', name: 'Ana Pereira', avatar: '/avatars/user-4.png', role: 'tecnico', phone: '(11) 94321-8765' },
  { id: 'user-5', name: 'Pedro Costa', avatar: '/avatars/user-5.png', role: 'gestor', phone: '(11) 95678-1234' }
];

// Get team members
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  try {
    // Simulate API call delay
    await delay(600);
    return [...mockTeamMembers];
  } catch (error) {
    console.error('Error fetching team members:', error);
    toast.error('Falha ao carregar membros da equipe');
    return [];
  }
};

// Update team member
export const updateTeamMember = async (updatedMember: TeamMember): Promise<TeamMember> => {
  try {
    // Simulate API call delay
    await delay(800);
    
    // Update the mock team member
    const index = mockTeamMembers.findIndex(member => member.id === updatedMember.id);
    if (index !== -1) {
      mockTeamMembers[index] = updatedMember;
    }
    
    console.log('Team member updated:', updatedMember);
    toast.success('Membro da equipe atualizado com sucesso');
    return updatedMember;
  } catch (error) {
    console.error('Error updating team member:', error);
    toast.error('Falha ao atualizar membro da equipe');
    throw error;
  }
};

// Add team member
export const addTeamMember = async (newMember: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
  try {
    // Simulate API call delay
    await delay(800);
    
    // Create a new team member with an ID
    const createdMember: TeamMember = {
      id: `user-${Date.now()}`,
      ...newMember
    };
    
    // Add the new team member to the mock team members array
    mockTeamMembers.push(createdMember);
    
    console.log('Team member added:', createdMember);
    toast.success('Membro da equipe adicionado com sucesso');
    return createdMember;
  } catch (error) {
    console.error('Error adding team member:', error);
    toast.error('Falha ao adicionar membro da equipe');
    throw error;
  }
};

// Delete team member
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  try {
    // Simulate API call delay
    await delay(600);
    
    // Remove the team member from the mock team members array
    const index = mockTeamMembers.findIndex(member => member.id === id);
    if (index !== -1) {
      mockTeamMembers.splice(index, 1);
    }
    
    console.log('Team member deleted:', id);
    toast.success('Membro da equipe excluído com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting team member:', error);
    toast.error('Falha ao excluir membro da equipe');
    return false;
  }
};

// Add service message
export const addServiceMessage = async (serviceId: string, message: Omit<ServiceMessage, 'timestamp'>): Promise<Service> => {
  try {
    // Simulate API call delay
    await delay(500);
    
    // Find the service
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Add the message with timestamp
    const newMessage: ServiceMessage = {
      ...message,
      timestamp: new Date().toISOString()
    };
    
    // Initialize messages array if it doesn't exist
    if (!service.messages) {
      service.messages = [];
    }
    
    // Add the new message
    service.messages.push(newMessage);
    
    console.log('Message added to service:', serviceId, newMessage);
    return service;
  } catch (error) {
    console.error('Error adding message to service:', error);
    toast.error('Falha ao adicionar mensagem');
    throw error;
  }
};

// Add service feedback
export const addServiceFeedback = async (serviceId: string, feedback: ServiceFeedback): Promise<Service> => {
  try {
    // Simulate API call delay
    await delay(700);
    
    // Find the service
    const service = mockServices.find(s => s.id === serviceId);
    if (!service) {
      throw new Error('Service not found');
    }
    
    // Add the feedback
    service.feedback = feedback;
    
    console.log('Feedback added to service:', serviceId, feedback);
    toast.success('Feedback adicionado com sucesso');
    return service;
  } catch (error) {
    console.error('Error adding feedback to service:', error);
    toast.error('Falha ao adicionar feedback');
    throw error;
  }
};

// Get statistics data
export const getStatistics = async (): Promise<{
  stats: StatData;
  monthlyData: ChartData[];
  weeklyData: ChartData[];
  serviceTypeData: ChartData[];
  regionData: ChartData[];
}> => {
  try {
    // Simulate API call delay
    await delay(1000);
    return {
      stats: mockStats,
      monthlyData: mockMonthlyData,
      weeklyData: mockWeeklyData,
      serviceTypeData: mockServiceTypeData,
      regionData: mockRegionData
    };
  } catch (error) {
    console.error('Error fetching statistics:', error);
    toast.error('Falha ao carregar estatísticas');
    return {
      stats: { total: 0, completed: 0, pending: 0, cancelled: 0 },
      monthlyData: [],
      weeklyData: [],
      serviceTypeData: [],
      regionData: []
    };
  }
};

// Update mock services - this is just for demo purposes
// In a real app, you would make an actual API call
export const updateMockServices = (updatedServices: Service[]): void => {
  // Update the mock services array with new data
  // This would be replaced with a real API call in production
  Object.assign(mockServices, updatedServices);
};

// Add new mock service - this is just for demo purposes
export const addMockService = (newService: Service): void => {
  mockServices.push(newService);
};

// Delete mock service - this is just for demo purposes
export const deleteMockService = (id: string): void => {
  const index = mockServices.findIndex(service => service.id === id);
  if (index !== -1) {
    mockServices.splice(index, 1);
  }
};
