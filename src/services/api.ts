
import { Service, TeamMember, ServiceStatus, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { services, teamMembers, stats } from '@/data/mockData';
import { toast } from "sonner";

// Get all services
export const getServices = async (): Promise<Service[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  return [...services];
};

// Get a single service by ID
export const getService = async (id: string): Promise<Service | undefined> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return services.find(service => service.id === id);
};

// Create a new service
export const createService = async (service: Omit<Service, "id">): Promise<Service> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newService: Service = {
    id: `service-${Date.now()}`,
    ...service
  };
  
  services.push(newService);
  return newService;
};

// Update a service
export const updateService = async (id: string, data: Partial<Service>): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = services.findIndex(service => service.id === id);
  if (index !== -1) {
    services[index] = { ...services[index], ...data };
    return true;
  }
  return false;
};

// Delete a service
export const deleteService = async (id: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const initialLength = services.length;
  const filteredServices = services.filter(service => service.id !== id);
  
  // Update the array
  services.length = 0;
  services.push(...filteredServices);
  
  return initialLength > services.length;
};

// Add message to a service
export const addServiceMessage = async (
  serviceId: string, 
  message: Omit<ServiceMessage, "timestamp">
): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const service = services.find(s => s.id === serviceId);
  if (!service) return false;
  
  if (!service.messages) {
    service.messages = [];
  }
  
  service.messages.push({
    ...message,
    timestamp: new Date().toISOString()
  });
  
  return true;
};

// Add feedback to a service
export const addServiceFeedback = async (
  serviceId: string,
  feedback: ServiceFeedback
): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const service = services.find(s => s.id === serviceId);
  if (!service) return false;
  
  service.feedback = feedback;
  return true;
};

// Get team members
export const getTeamMembers = async (): Promise<TeamMember[]> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  return [...teamMembers];
};

// Update team member
export const updateTeamMember = async (id: string, data: Partial<TeamMember>): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const index = teamMembers.findIndex(member => member.id === id);
  if (index !== -1) {
    teamMembers[index] = { ...teamMembers[index], ...data };
    return true;
  }
  return false;
};

// Add new team member
export const addTeamMember = async (member: Omit<TeamMember, "id">): Promise<TeamMember> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const newMember: TeamMember = {
    id: `member-${Date.now()}`,
    ...member
  };
  
  teamMembers.push(newMember);
  return newMember;
};

// Delete team member
export const deleteTeamMember = async (id: string): Promise<boolean> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  const initialLength = teamMembers.length;
  const filteredMembers = teamMembers.filter(member => member.id !== id);
  
  // Update the array
  teamMembers.length = 0;
  teamMembers.push(...filteredMembers);
  
  return initialLength > teamMembers.length;
};
