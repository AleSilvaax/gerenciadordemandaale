
import { create } from 'zustand';
import { Service } from '@/types/serviceTypes';
import { getServices } from '@/services/servicesDataService';

interface ServiceState {
  services: Service[];
  selectedService: Service | null;
  isLoading: boolean;
  error: string | null;
  filters: {
    status: string;
    priority: string;
    serviceType: string;
    searchTerm: string;
  };
}

interface ServiceActions {
  loadServices: () => Promise<void>;
  setServices: (services: Service[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setSelectedService: (service: Service | null) => void;
  updateService: (updatedService: Service) => void;
  setFilters: (filters: Partial<ServiceState['filters']>) => void;
  clearError: () => void;
}

export const useServiceStore = create<ServiceState & ServiceActions>((set, get) => ({
  // Estado inicial
  services: [],
  selectedService: null,
  isLoading: false,
  error: null,
  filters: {
    status: 'all',
    priority: 'all',
    serviceType: 'all',
    searchTerm: '',
  },

  // Ações
  loadServices: async () => {
    set({ isLoading: true, error: null });
    try {
      const services = await getServices();
      set({ services, isLoading: false });
    } catch (error) {
      set({ 
        error: error instanceof Error ? error.message : 'Erro ao carregar serviços',
        isLoading: false 
      });
    }
  },

  setServices: (services) => {
    set({ services });
  },

  setLoading: (isLoading) => {
    set({ isLoading });
  },

  setError: (error) => {
    set({ error });
  },

  setSelectedService: (service) => {
    set({ selectedService: service });
  },

  updateService: (updatedService) => {
    set((state) => ({
      services: state.services.map(service => 
        service.id === updatedService.id ? updatedService : service
      ),
      selectedService: state.selectedService?.id === updatedService.id 
        ? updatedService 
        : state.selectedService
    }));
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters }
    }));
  },

  clearError: () => {
    set({ error: null });
  },
}));
