
// This file now just re-exports from smaller modules for backward compatibility
import { 
  getServicesFromDatabase,
  getServiceById,
  createServiceInDatabase,
  updateServiceInDatabase,
  deleteServiceFromDatabase
} from './database/serviceQueries';

import {
  addServiceMessageToDatabase
} from './database/messageService';

import {
  assignTechnician
} from './database/technicianService';

import {
  getServiceStats
} from './database/statsService';

// Re-export everything to maintain compatibility with existing code
export {
  getServicesFromDatabase,
  getServiceById,
  createServiceInDatabase,
  updateServiceInDatabase,
  deleteServiceFromDatabase,
  addServiceMessageToDatabase,
  assignTechnician,
  getServiceStats
};
