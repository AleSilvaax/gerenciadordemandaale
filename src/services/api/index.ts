
// Re-export all API functions for backward compatibility
import {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  addServiceMessage,
  addServiceFeedback
} from './serviceApi';

import {
  getTeamMembers,
  updateTeamMember,
  addTeamMember,
  deleteTeamMember
} from './teamApi';

export {
  getServices,
  getService,
  createService,
  updateService,
  deleteService,
  addServiceMessage,
  addServiceFeedback,
  getTeamMembers,
  updateTeamMember,
  addTeamMember,
  deleteTeamMember
};
