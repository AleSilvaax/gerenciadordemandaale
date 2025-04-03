
import { v4 as uuidv4 } from 'uuid';
import { Service, TeamMember, ServiceStatus } from '@/types/serviceTypes';
import { mockServices, mockTeamMembers } from '@/data/mockData';
import { toast } from '@/hooks/use-toast';

// Simulate a local database
let services = [...mockServices];
let teamMembers = [...mockTeamMembers];

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
  
  services.push(newService);
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
  };
  
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
export const createTeamMember = async (memberData: Omit<TeamMember, 'id'>): Promise<TeamMember> => {
  await delay(1000); // Simulate API delay
  
  const newMember: TeamMember = {
    id: uuidv4(),
    ...memberData
  };
  
  teamMembers.push(newMember);
  return newMember;
};

// UPDATE a team member
export const updateTeamMember = async (updatedMember: TeamMember): Promise<TeamMember> => {
  await delay(800); // Simulate API delay
  
  const index = teamMembers.findIndex(member => member.id === updatedMember.id);
  
  if (index === -1) {
    throw new Error(`Team member with ID ${updatedMember.id} not found`);
  }
  
  teamMembers[index] = {
    ...teamMembers[index],
    ...updatedMember
  };
  
  return {...teamMembers[index]};
};

// DELETE a team member
export const deleteTeamMember = async (id: string): Promise<void> => {
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
};

// Export ServiceStatus type
export { ServiceStatus };
