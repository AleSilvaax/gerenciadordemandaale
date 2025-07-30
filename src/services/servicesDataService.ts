// Arquivo: src/services/servicesDataService.ts (VERSÃO ATUALIZADA)

export {
  getServicesFromDatabase as getServices,
  getServiceByIdFromDatabase, // ✅ ADICIONADO AQUI
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

export { uploadServicePhoto } from "./photoService";
