import { Service, ServiceStatus, ReportData } from "@/data/mockData";
import { v4 as uuidv4 } from "uuid";

// Variável local para armazenar os serviços em memória
let localServices: Service[] = JSON.parse(localStorage.getItem("services") || "[]");

// Inicializa com dados de exemplo se não houver dados no localStorage
if (localServices.length === 0) {
  import("@/data/mockData").then(({ services }) => {
    localServices = [...services];
    localStorage.setItem("services", JSON.stringify(localServices));
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
    localStorage.setItem("services", JSON.stringify(localServices));
    
    setTimeout(() => {
      resolve(newService);
    }, 300);
  });
};

// Atualiza um serviço existente
export const updateService = (id: string, updates: Partial<Service>): Promise<boolean> => {
  return new Promise((resolve) => {
    const index = localServices.findIndex((s) => s.id === id);
    
    if (index === -1) {
      resolve(false);
      return;
    }

    localServices[index] = {
      ...localServices[index],
      ...updates,
    };

    localStorage.setItem("services", JSON.stringify(localServices));
    
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
};

// Atualiza os dados do relatório de um serviço
export const updateReportData = (id: string, reportData: Partial<ReportData>): Promise<boolean> => {
  return new Promise((resolve) => {
    const index = localServices.findIndex((s) => s.id === id);
    
    if (index === -1) {
      resolve(false);
      return;
    }

    localServices[index].reportData = {
      ...localServices[index].reportData,
      ...reportData,
    };

    localStorage.setItem("services", JSON.stringify(localServices));
    
    setTimeout(() => {
      resolve(true);
    }, 300);
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

    localStorage.setItem("services", JSON.stringify(localServices));
    
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
};

// Adiciona uma foto a um serviço
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
        
        if (!localServices[index].photos) {
          localServices[index].photos = [];
        }
        
        localServices[index].photos.push(photoUrl);
        localStorage.setItem("services", JSON.stringify(localServices));
        
        setTimeout(() => {
          resolve(photoUrl);
        }, 300);
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => {
      reject("Erro ao ler o arquivo");
    };
    
    reader.readAsDataURL(photoFile);
  });
};

// Atualiza a lista de fotos de um serviço
export const updateServicePhotos = (id: string, photos: string[]): Promise<boolean> => {
  return new Promise((resolve) => {
    const index = localServices.findIndex((s) => s.id === id);
    
    if (index === -1) {
      resolve(false);
      return;
    }

    localServices[index].photos = photos;
    localStorage.setItem("services", JSON.stringify(localServices));
    
    setTimeout(() => {
      resolve(true);
    }, 300);
  });
};
