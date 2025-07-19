
import { create } from 'zustand';
import { Service } from '@/types/serviceTypes';

interface ServiceStore {
  services: Service[];
  selectedService: Service | null;
  isLoading: boolean;
  error: string | null;
  setServices: (services: Service[]) => void;
  setSelectedService: (service: Service | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addService: (service: Service) => void;
  updateService: (serviceId: string, updates: Partial<Service>) => void;
  removeService: (serviceId: string) => void;
}

export const useServiceStore = create<ServiceStore>((set) => ({
  services: [],
  selectedService: null,
  isLoading: false,
  error: null,
  
  setServices: (services) => set({ services }),
  setSelectedService: (service) => set({ selectedService: service }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  
  addService: (service) => set((state) => ({
    services: [service, ...state.services]
  })),
  
  updateService: (serviceId, updates) => set((state) => ({
    services: state.services.map(service =>
      service.id === serviceId ? { ...service, ...updates } : service
    )
  })),
  
  removeService: (serviceId) => set((state) => ({
    services: state.services.filter(service => service.id !== serviceId)
  }))
}));
