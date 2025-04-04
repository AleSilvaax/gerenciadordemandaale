
import { v4 as uuidv4 } from 'uuid';
import { Service, TeamMember, ServiceStatus, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { services as initialServices } from '@/data/mockData';
import { toast } from 'sonner';

// Simulate a local database
let services = [...initialServices];

// Initial team members with emails for login
let teamMembers: TeamMember[] = [
  {
    id: '1',
    name: 'João Silva',
    email: 'joao@exemplo.com',
    phone: '(11) 99999-1234',
    role: 'tecnico',
    avatar: '/lovable-uploads/373df2cb-1338-42cc-aebf-c1ce0a83b032.png',
  },
  {
    id: '2',
    name: 'Maria Oliveira',
    email: 'maria@exemplo.com',
    phone: '(11) 98888-5678',
    role: 'administrador',
    avatar: '/lovable-uploads/2e312c47-0298-4854-8d13-f07ec36e7176.png',
  },
  {
    id: '3',
    name: 'Carlos Rodrigues',
    email: 'carlos@exemplo.com',
    phone: '(11) 97777-9012',
    role: 'gestor',
    avatar: '/lovable-uploads/bd3b11fc-9a17-4507-b28b-d47cf1678ad8.png',
  }
];

// Helper to find service by ID
const findServiceById = (id: string): Service | undefined => {
  return services.find(service => service.id === id);
};

// Helper to simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// GET all services
export const getServices = async (): Promise<Service[]> => {
  await delay(800); // Simulate API delay
  return [...services];
};

// GET a single service by ID
export const getService = async (id: string): Promise<Service> => {
  await delay(500); // Simulate API delay
  const service = findServiceById(id);
  
  if (!service) {
    throw new Error(`Service with ID ${id} not found`);
  }
  
  return {...service};
};

// CREATE a new service
export const createService = async (serviceData: Omit<Service, 'id'>): Promise<Service> => {
  await delay(1000); // Simulate API delay
  
  const newService: Service = {
    id: `SRV-${uuidv4().substring(0, 8)}`,
    ...serviceData,
    date: serviceData.date || new Date().toISOString(),
  };
  
  services.push(newService as any); // Type assertion to handle the incompatibility temporarily
  return newService;
};

// UPDATE a service
export const updateService = async (updatedService: Service): Promise<Service> => {
  await delay(800); // Simulate API delay
  
  const index = services.findIndex(service => service.id === updatedService.id);
  
  if (index === -1) {
    throw new Error(`Service with ID ${updatedService.id} not found`);
  }
  
  services[index] = {
    ...services[index],
    ...updatedService
  } as any; // Type assertion to handle the incompatibility
  
  return {...services[index]};
};

// DELETE a service
export const deleteService = async (id: string): Promise<void> => {
  await delay(800); // Simulate API delay
  
  const serviceExists = findServiceById(id);
  
  if (!serviceExists) {
    throw new Error(`Service with ID ${id} not found`);
  }
  
  services = services.filter(service => service.id !== id);
};

// GET all team members
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  await delay(500); // Simulate API delay
  return [...teamMembers];
};

// CREATE a team member
export const addTeamMember = async (memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
  await delay(1000); // Simulate API delay
  
  // Ensure avatar is provided
  if (!memberData.avatar) {
    memberData.avatar = '/lovable-uploads/placeholder.svg';
  }
  
  const newMember: TeamMember = {
    id: uuidv4(),
    ...memberData,
  };
  
  teamMembers.push(newMember);
  return newMember;
};

// UPDATE a team member
export const updateTeamMember = async (id: string, updatedData: Partial<TeamMember>): Promise<boolean> => {
  await delay(800); // Simulate API delay
  
  const index = teamMembers.findIndex(member => member.id === id);
  
  if (index === -1) {
    throw new Error(`Team member with ID ${id} not found`);
  }
  
  teamMembers[index] = {
    ...teamMembers[index],
    ...updatedData
  };
  
  return true;
};

// DELETE a team member
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  await delay(800); // Simulate API delay
  
  const memberExists = teamMembers.find(member => member.id === id);
  
  if (!memberExists) {
    throw new Error(`Team member with ID ${id} not found`);
  }
  
  // Check if member is assigned to any services
  const assignedServices = services.filter(service => service.technician.id === id);
  
  if (assignedServices.length > 0) {
    throw new Error(`Cannot delete team member with ID ${id} because they are assigned to ${assignedServices.length} service(s)`);
  }
  
  teamMembers = teamMembers.filter(member => member.id !== id);
  return true;
};

// Add messages to a service
export const addServiceMessage = async (serviceId: string, message: Omit<ServiceMessage, 'id' | 'timestamp' | 'isRead'>): Promise<Service> => {
  const service = await getService(serviceId);
  
  const newMessage: ServiceMessage = {
    id: uuidv4(),
    ...message,
    timestamp: new Date().toISOString(),
    isRead: false
  };
  
  const updatedService = {
    ...service,
    messages: [...(service.messages || []), newMessage]
  };
  
  return updateService(updatedService);
};

// Add feedback to a service
export const addServiceFeedback = async (serviceId: string, feedback: ServiceFeedback): Promise<Service> => {
  const service = await getService(serviceId);
  
  const updatedService = {
    ...service,
    feedback
  };
  
  return updateService(updatedService);
};

// Export type
export type { ServiceStatus };
