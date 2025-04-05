import { Service, TeamMember, ServiceStatus } from '@/types/serviceTypes';
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
