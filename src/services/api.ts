import { Service, ServiceStatus, ReportData } from "@/data/mockData";
import { v4 as uuidv4 } from "uuid";

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

// Variável local para armazenar os serviços em memória
let localServices: Service[] = [];

// Try to load from localStorage, but handle errors
try {
  localServices = JSON.parse(localStorage.getItem("services") || "[]");
} catch (error) {
  console.error("Error loading services from localStorage:", error);
  localServices = [];
}

// Inicializa com dados de exemplo se não houver dados no localStorage
if (localServices.length === 0) {
  import("@/data/mockData").then(({ services }) => {
    localServices = [...services];
    safelyStoreData("services", localServices);
  });
}

// Retorna todos os serviços
export const getServices = (): Promise<Service[]> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(localServices);
    }, 300); // Pequeno atraso para simular requisição de API
  });
};

// Busca um serviço pelo ID
export const getServiceById = (id: string): Promise<Service | null> => {
  return new Promise((resolve) => {
    setTimeout(() => {
      const service = localServices.find((s) => s.id === id) || null;
      resolve(service);
    }, 300);
  });
};

// Cria um novo serviço
export const createService = (service: Partial<Service>): Promise<Service> => {
  return new Promise((resolve) => {
    const newService: Service = {
      id: uuidv4().slice(0, 4), // Gerar ID curto similar aos originais
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
      resolve(newService);
    }, 300);
  });
};

// Atualiza um serviço existente
export const updateService = (id: string, updates: Partial<Service>): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const index = localServices.findIndex((s) => s.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      // Deep clone the service to avoid reference issues
      localServices[index] = {
        ...localServices[index],
        ...updates,
      };

      const success = safelyStoreData("services", localServices);
      
      setTimeout(() => {
        resolve(success);
      }, 300);
    } catch (error) {
      console.error("Error updating service:", error);
      resolve(false);
    }
  });
};

// Atualiza os dados do relatório de um serviço
export const updateReportData = (id: string, reportData: Partial<ReportData>): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const index = localServices.findIndex((s) => s.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      localServices[index].reportData = {
        ...localServices[index].reportData,
        ...reportData,
      };

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

// Deleta um serviço
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

// Adiciona uma foto a um serviço - Versão melhorada para suportar uploads externos
export const addPhotoToService = (id: string, photoFile: File): Promise<string> => {
  return new Promise((resolve, reject) => {
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
        
        // Inicializar array de fotos se não existir
        if (!localServices[index].photos) {
          localServices[index].photos = [];
        }
        
        // Verificar se a foto já existe para evitar duplicações
        if (!localServices[index].photos.includes(photoUrl)) {
          localServices[index].photos.push(photoUrl);
          const success = safelyStoreData("services", localServices);
          
          if (!success) {
            // Se não conseguir salvar no localStorage, tente remover fotos mais antigas
            if (localServices[index].photos.length > 1) {
              localServices[index].photos = [
                ...localServices[index].photos.slice(1),
                photoUrl
              ];
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

// Atualiza a lista de fotos de um serviço
export const updateServicePhotos = (id: string, photos: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    try {
      const index = localServices.findIndex((s) => s.id === id);
      
      if (index === -1) {
        resolve(false);
        return;
      }

      localServices[index].photos = [...photos];
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
