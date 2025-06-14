
export {
  getServicesFromDatabase as getServices,
  createServiceInDatabase as createService,
  updateServiceInDatabase as updateService,
  deleteServiceFromDatabase as deleteService
} from "./serviceCrud";

export {
  getTeamMembers,
  addTeamMember,
  updateTeamMember,
  deleteTeamMember
} from "./teamMembersService";

// Fix: Re-export everything (including getServiceTypesFromDatabase) from 'serviceTypesService'
export {
  getServiceTypesFromDatabase,
  createServiceType,
  updateServiceType,
  deleteServiceType,
  createTechnicalField,
  updateTechnicalField,
  deleteTechnicalField
} from "./serviceTypesService";

export {
  addServiceMessage,
  addServiceFeedback
} from "./serviceMessaging";

// Export any legacy helpers here if needed, or migrate their usage to the split modules above.

