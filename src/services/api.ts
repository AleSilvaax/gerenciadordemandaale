import { Service } from "@/types/serviceTypes";
import { ReportData, TeamMember } from "@/data/mockData";
import { v4 as uuidv4 } from "uuid";

// Define the ServiceStatus type that was missing
export type ServiceStatus = "pendente" | "concluido" | "cancelado";

// Helper function to handle localStorage storage limits
const safelyStoreData = (key: string, data: any): boolean => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    if (error instanceof DOMException && (
      // everything except Firefox
      error.name === 'QuotaExceededError' ||
      // Firefox
      error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
      
      console.warn('localStorage quota exceeded. Compressing data...');
      
      // For image-heavy data, we'll try to reduce the data size
      if (key === 'services') {
        // Create a copy with reduced photo arrays (keep at most 2 photos per service)
        const reducedData = data.map((service: Service) => {
          if (service.photos && service.photos.length > 2) {
            return {
              ...service,
              photos: service.photos.slice(0, 2)
            };
          }
          return service;
        });
        
        try {
          localStorage.setItem(key, JSON.stringify(reducedData));
          console.info('Successfully stored compressed data');
          return true;
        } catch (compressionError) {
          console.error('Failed to store even with compression', compressionError);
          return false;
        }
      }
    }
    
    console.error('Error storing data in localStorage:', error);
    return false;
  }
};

// Synchronize data between memory and localStorage
const syncServicesWithLocalStorage = () => {
  try {
    // First save any changes from memory to localStorage
    if (localServices.length > 0) {
      safelyStoreData("services", localServices);
    }
    
    // Then load from localStorage to ensure we have latest data
    const storedServices = localStorage.getItem("services");
    if (storedServices) {
      localServices = JSON.parse(storedServices);
    }
    
    return true;
  } catch (error) {
    console.error("Error syncing services with localStorage:", error);
    return false;
  }
};

// Local variables to store data in memory
let localServices: Service[] = [];
let localTeam: TeamMember[] = [];

// Try to load from localStorage, but handle errors
try {
  const storedServices = localStorage.getItem("services");
  if (storedServices) {
    localServices = JSON.parse(storedServices);
  }
} catch (error) {
  console.error("Error loading services from localStorage:", error);
  localServices = [];
}

// Try to load team members from localStorage
try {
  const storedTeam = localStorage.getItem("teamMembers");
  if (storedTeam) {
    localTeam = JSON.parse(storedTeam);
  }
} catch (error) {
  console.error("Error loading team members from localStorage:", error);
  localTeam = [];
}

// Initialize with example data if no data in localStorage
if (localServices.length === 0) {
  import("@/data/mockData").then(({ services }) => {
    localServices = [...services];
    safelyStoreData("services", localServices);
  });
}

// Initialize team members if none exist
if (localTeam.length === 0) {
  import("@/data/mockData").then(({ teamMembers }) => {
    localTeam = [...teamMembers];
    safelyStoreData("teamMembers", localTeam);
  });
}

// Return all services
export const getServices = (): Promise<Service[]> => {
  return new Promise((resolve) => {
    // Sync with localStorage before returning
    syncServicesWithLocalStorage();
    
    setTimeout(() => {
      resolve([...localServices]); // Return a copy to avoid reference issues
    }, 300); // Small delay to simulate API request
  });
};

// Get a service by ID - needed for ServiceDetail page
export const getService = (id: string): Promise<Service> => {
  return new Promise((resolve, reject) => {
    // Sync with localStorage before fetching
    syncServicesWithLocalStorage();
    
    setTimeout(() => {
      const service = localServices.find((s) => s.id === id);
      if (service) {
        // Return a deep copy to avoid reference issues
        resolve(JSON.parse(JSON.stringify(service)));
      } else {
        reject(new Error(`Service with id ${id} not found`));
      }
    }, 300);
  });
};

// Keep previous getServiceById for backward compatibility
export const getServiceById = (id: string): Promise<Service | null> => {
  return new Promise((resolve) => {
    // Sync with localStorage before fetching
    syncServicesWithLocalStorage();
    
    setTimeout(() => {
      const service = localServices.find((s) => s.id === id);
      // Return a deep copy to avoid reference issues
      resolve(service ? JSON.parse(JSON.stringify(service)) : null);
    }, 300);
  });
};

// Create a new service
export const createService = (service: Partial<Service>): Promise<Service> => {
  return new Promise((resolve) => {
    // Sync with localStorage before creating
    syncServicesWithLocalStorage();
    
    const newService: Service = {
      id: uuidv4().slice(0, 4), // Generate short ID similar to originals
      title: service.title || "Nova Demanda",
      status: service.status || "pendente",
      location: service.location || "",
      technician: service.technician || {
        id: "",
        name: "Sem técnico",
        avatar: ""
      },
      reportData: service.reportData || {},
      photos: service.photos || [],
    };

    localServices.push(newService);
    safelyStoreData("services", localServices);
    
    setTimeout(() => {
      // Return a deep copy to avoid reference issues
      resolve(JSON.parse(JSON.stringify(newService)));
    }, 300);
  });
};

// Update an existing service
export const updateService = (updatedService: Service): Promise<Service> => {
  return new Promise((resolve, reject) => {
    try {
      // Sync with localStorage before updating
      syncServicesWithLocalStorage();
      
      const index = localServices.findIndex((s) => s.id === updatedService.id);
      
      if (index === -1) {
        reject(new Error(`Service with id ${updatedService.id} not found`));
        return;
      }

      // Update in the array
      localServices[index] = JSON.parse(JSON.stringify(updatedService));

      safelyStoreData("services", localServices);
      
      setTimeout(() => {
        // Return a deep copy to avoid reference issues
        resolve(JSON.parse(JSON.stringify(localServices[index])));
      }, 300);
    } catch (error) {
      console.error("Error updating service:", error);
      reject(error);
    }
  });
};

// Update report data for a service
export const updateReportData = (id: string, reportData: Partial<ReportData>): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Sync with localStorage before updating
      syncServicesWithLocalStorage();
      
      const index = localServices.findIndex((s) => s.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      // Deep copy to avoid reference issues
      const updatedService = JSON.parse(JSON.stringify(localServices[index]));
      
      updatedService.reportData = {
        ...updatedService.reportData,
        ...reportData,
      };
      
      localServices[index] = updatedService;

      const success = safelyStoreData("services", localServices);
      
      setTimeout(() => {
        resolve(success);
      }, 300);
    } catch (error) {
      console.error("Error updating report data:", error);
      resolve(false);
    }
  });
};

// Delete a service
export const deleteService = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const initialLength = localServices.length;
    localServices = localServices.filter((s) => s.id !== id);
    
    if (initialLength === localServices.length) {
      resolve(false);
      return;
    }

    const success = safelyStoreData("services", localServices);
    
    setTimeout(() => {
      resolve(success);
    }, 300);
  });
};

// Add a photo to a service - Improved version to support external uploads and better localStorage handling
export const addPhotoToService = (id: string, photoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    // Sync with localStorage before updating
    syncServicesWithLocalStorage();
    
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        if (!event.target || !event.target.result) {
          reject("Falha ao ler o arquivo");
          return;
        }
        
        const photoUrl = event.target.result.toString();
        const index = localServices.findIndex((s) => s.id === id);
        
        if (index === -1) {
          reject("Serviço não encontrado");
          return;
        }
        
        // Deep copy to avoid reference issues
        const updatedService = JSON.parse(JSON.stringify(localServices[index]));
        
        // Initialize photos array if it doesn't exist
        if (!updatedService.photos) {
          updatedService.photos = [];
        }
        
        // Check if the photo already exists to avoid duplications
        if (!updatedService.photos.includes(photoUrl)) {
          updatedService.photos.push(photoUrl);
          localServices[index] = updatedService;
          
          const success = safelyStoreData("services", localServices);
          
          if (!success) {
            // If can't save to localStorage, try removing older photos
            if (updatedService.photos.length > 1) {
              updatedService.photos = [
                ...updatedService.photos.slice(1),
                photoUrl
              ];
              localServices[index] = updatedService;
              safelyStoreData("services", localServices);
            }
          }
        }
        
        setTimeout(() => {
          resolve(photoUrl);
        }, 300);
      } catch (error) {
        console.error("Error processing photo:", error);
        reject(error);
      }
    };
    
    reader.onerror = (error) => {
      console.error("Error reading file:", error);
      reject("Erro ao ler o arquivo");
    };
    
    reader.readAsDataURL(photoFile);
  });
};

// Update photos for a service
export const updateServicePhotos = (id: string, photos: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      // Sync with localStorage before updating
      syncServicesWithLocalStorage();
      
      const index = localServices.findIndex((s) => s.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      // Deep copy to avoid reference issues
      const updatedService = JSON.parse(JSON.stringify(localServices[index]));
      updatedService.photos = [...photos];
      localServices[index] = updatedService;
      
      const success = safelyStoreData("services", localServices);
      
      setTimeout(() => {
        resolve(success);
      }, 300);
    } catch (error) {
      console.error("Error updating photos:", error);
      resolve(false);
    }
  });
};

// Get all team members
export const getTeamMembers = (): Promise<TeamMember[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localTeam);
    }, 300);
  });
};

// Update a team member
export const updateTeamMember = (id: string, updates: Partial<TeamMember>): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const index = localTeam.findIndex((m) => m.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      // Deep copy to avoid reference issues
      const updatedMember = {
        ...JSON.parse(JSON.stringify(localTeam[index])),
        ...updates
      };
      
      localTeam[index] = updatedMember;
      
      const success = safelyStoreData("teamMembers", localTeam);
      
      // Also update any services that reference this team member (for technicians)
      if (success) {
        localServices = localServices.map(service => {
          if (service.technician && service.technician.id === id) {
            return {
              ...service,
              technician: updatedMember
            };
          }
          return service;
        });
        
        safelyStoreData("services", localServices);
      }
      
      setTimeout(() => {
        resolve(success);
      }, 300);
    } catch (error) {
      console.error("Error updating team member:", error);
      resolve(false);
    }
  });
};

// Add a new team member
export const addTeamMember = (member: Partial<TeamMember>): Promise<TeamMember> => {
  return new Promise((resolve) => {
    const newMember: TeamMember = {
      id: uuidv4().slice(0, 4),
      name: member.name || "Novo Membro",
      avatar: member.avatar || "",
      role: member.role || "tecnico",
    };

    localTeam.push(newMember);
    safelyStoreData("teamMembers", localTeam);
    
    setTimeout(() => {
      resolve(newMember);
    }, 300);
  });
};

// Delete a team member
export const deleteTeamMember = (id: string): Promise<boolean> => {
  return new Promise((resolve) => {
    const initialLength = localTeam.length;
    localTeam = localTeam.filter((m) => m.id !== id);
    
    if (initialLength === localTeam.length) {
      resolve(false);
      return;
    }

    const success = safelyStoreData("teamMembers", localTeam);
    
    // Also update any services that reference this team member
    if (success) {
      localServices = localServices.map(service => {
        if (service.technician && service.technician.id === id) {
          return {
            ...service,
            technician: {
              id: "",
              name: "Sem técnico",
              avatar: ""
            }
          };
        }
        return service;
      });
      
      safelyStoreData("services", localServices);
    }
    
    setTimeout(() => {
      resolve(success);
    }, 300);
  });
};
