export {
  getServicesFromDatabase as getServices,
  getServicesFromDatabase,
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

// Create a getService function that returns a single service
export const getService = async (id: string) => {
  const { getServicesFromDatabase } = await import("./serviceCrud");
  const services = await getServicesFromDatabase();
  return services.find(service => service.id === id);
};