
import { Service, TeamMember, StatData, ChartData } from '@/types/serviceTypes';
import { services as mockServices, stats as mockStats, monthlyData as mockMonthlyData, weeklyData as mockWeeklyData, serviceTypeData as mockServiceTypeData, regionData as mockRegionData } from '@/data/mockData';
import { toast } from 'sonner';

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

// Update service
export const updateService = async (updatedService: Service): Promise<boolean> => {
  try {
    // Simulate API call delay
    await delay(1000);
    console.log('Service updated:', updatedService);
    toast.success('Demanda atualizada com sucesso');
    return true;
  } catch (error) {
    console.error('Error updating service:', error);
    toast.error('Falha ao atualizar demanda');
    return false;
  }
};

// Create new service
export const createService = async (newService: Partial<Service>): Promise<Service | null> => {
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
      photos: newService.photos || [],
      reportData: newService.reportData || {},
      signatures: newService.signatures || {}
    };
    
    console.log('Service created:', createdService);
    toast.success('Demanda criada com sucesso');
    return createdService;
  } catch (error) {
    console.error('Error creating service:', error);
    toast.error('Falha ao criar demanda');
    return null;
  }
};

// Delete service
export const deleteService = async (id: string): Promise<boolean> => {
  try {
    // Simulate API call delay
    await delay(800);
    console.log('Service deleted:', id);
    toast.success('Demanda excluída com sucesso');
    return true;
  } catch (error) {
    console.error('Error deleting service:', error);
    toast.error('Falha ao excluir demanda');
    return false;
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
