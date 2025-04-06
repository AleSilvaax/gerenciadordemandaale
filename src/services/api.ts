
import { Service, TeamMember, ServiceStatus, ServiceMessage, ServiceFeedback } from '@/types/serviceTypes';
import { services, teamMembers, stats } from '@/data/mockData';
import { toast } from "sonner";
import { 
  getServicesFromDatabase, 
  createServiceInDatabase, 
  updateServiceInDatabase, 
  deleteServiceFromDatabase,
  addServiceMessageToDatabase
} from './servicesDataService';

// Get all services
export const getServices = async (): Promise<Service[]> => {
  console.log("Getting all services...");
  
  try {
    // Try to get services from Supabase first
    const dbServices = await getServicesFromDatabase();
    
    // If we got services from the database, return those
    if (dbServices && dbServices.length > 0) {
      console.log("Returning services from database:", dbServices.length);
      return dbServices;
    }
    
    // Fall back to mock data if no database services
    console.log("No services in database, falling back to mock data");
    await new Promise(resolve => setTimeout(resolve, 800));
    return [...services];
  } catch (error) {
    console.error("Error getting services:", error);
    
    // Fall back to mock data on error
    console.log("Error getting database services, falling back to mock data");
    await new Promise(resolve => setTimeout(resolve, 800));
    return [...services];
  }
};

// Get a single service by ID
export const getService = async (id: string): Promise<Service | undefined> => {
  console.log("Getting service by ID:", id);
  
  try {
    // Try to get from database first
    const allServices = await getServices();
    return allServices.find(service => service.id === id);
  } catch (error) {
    console.error("Error getting service by ID:", error);
    
    // Fall back to mock data
    console.log("Error getting service from database, falling back to mock data");
    await new Promise(resolve => setTimeout(resolve, 500));
    return services.find(service => service.id === id);
  }
};

// Create a new service
export const createService = async (service: Omit<Service, "id">): Promise<Service> => {
  console.log("Creating new service:", service);
  
  try {
    // Try to create in database first
    const newDbService = await createServiceInDatabase(service);
    
    if (newDbService) {
      console.log("Service created in database:", newDbService);
      return newDbService;
    }
    
    // Fall back to mock data if database creation fails
    console.log("Database creation failed, falling back to mock");
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newService: Service = {
      id: `service-${Date.now()}`,
      ...service
    };
    
    services.push(newService);
    return newService;
  } catch (error) {
    console.error("Error creating service:", error);
    
    // Fall back to mock data
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newService: Service = {
      id: `service-${Date.now()}`,
      ...service
    };
    
    services.push(newService);
    return newService;
  }
};

// Update a service
export const updateService = async (service: Partial<Service> & { id: string }): Promise<Service> => {
  console.log("Updating service:", service.id);
  
  try {
    // Try to update in database first
    const updatedDbService = await updateServiceInDatabase(service);
    
    if (updatedDbService) {
      console.log("Service updated in database:", updatedDbService);
      return updatedDbService;
    }
    
    // Fall back to mock data if database update fails
    console.log("Database update failed, falling back to mock");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = services.findIndex(s => s.id === service.id);
    if (index !== -1) {
      services[index] = { ...services[index], ...service };
      return services[index];
    }
    throw new Error(`Service with id ${service.id} not found`);
  } catch (error) {
    console.error("Error updating service:", error);
    
    // Fall back to mock data
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const index = services.findIndex(s => s.id === service.id);
    if (index !== -1) {
      services[index] = { ...services[index], ...service };
      return services[index];
    }
    throw new Error(`Service with id ${service.id} not found`);
  }
};

// Delete a service
export const deleteService = async (id: string): Promise<boolean> => {
  console.log("Deleting service:", id);
  
  try {
    // Try to delete from database first
    const dbDeleteResult = await deleteServiceFromDatabase(id);
    
    if (dbDeleteResult) {
      console.log("Service deleted from database");
      return true;
    }
    
    // Fall back to mock data if database deletion fails
    console.log("Database deletion failed, falling back to mock");
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const initialLength = services.length;
    const filteredServices = services.filter(service => service.id !== id);
    
    // Update the array
    services.length = 0;
    services.push(...filteredServices);
    
    return initialLength > services.length;
  } catch (error) {
    console.error("Error deleting service:", error);
    
    // Fall back to mock data
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const initialLength = services.length;
    const filteredServices = services.filter(service => service.id !== id);
    
    // Update the array
    services.length = 0;
    services.push(...filteredServices);
    
    return initialLength > services.length;
  }
};

// Add message to a service
export const addServiceMessage = async (
  serviceId: string, 
  message: Omit<ServiceMessage, "timestamp">
): Promise<Service> => {
  console.log("Adding message to service:", serviceId);
  
  try {
    // Try to add message to database first
    // For now we'll continue with the mock implementation
    // and adapt once we have a database storage solution for messages
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const service = services.find(s => s.id === serviceId);
    if (!service) throw new Error(`Service with id ${serviceId} not found`);
    
    if (!service.messages) {
      service.messages = [];
    }
    
    service.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    return service;
  } catch (error) {
    console.error("Error adding message to service:", error);
    
    // Fall back to mock implementation
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const service = services.find(s => s.id === serviceId);
    if (!service) throw new Error(`Service with id ${serviceId} not found`);
    
    if (!service.messages) {
      service.messages = [];
    }
    
    service.messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    return service;
  }
};

// Add feedback to a service
export const addServiceFeedback = async (
  serviceId: string,
  feedback: ServiceFeedback
): Promise<Service> => {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const service = services.find(s => s.id === serviceId);
  if (!service) throw new Error(`Service with id ${serviceId} not found`);
  
  service.feedback = feedback;
  return service;
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
