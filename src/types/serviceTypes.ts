
export interface TeamMember {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  avatar?: string;
  signature?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select';
  value: string | number | boolean;
  options?: string[];
}

export interface ReportData {
  // General properties
  client?: string;
  address?: string;
  city?: string;
  servicePhase?: 'inspection' | 'installation';
  customFields?: CustomField[];
  technicalComments?: string;
  clientSignature?: string;
  clientName?: string;

  // Inspection specific
  inspectionDate?: string;
  voltage?: string;
  supplyType?: string;
  installationDistance?: string;
  installationObstacles?: string;
  existingPanel?: boolean;
  panelType?: string;
  panelAmps?: string;
  voltageBetweenPhases?: string;
  voltageBetweenPhaseAndNeutral?: string;
  hasThreePhase?: boolean;
  wallboxBrand?: string;
  wallboxPower?: string;
  powerSupplyType?: string;
  needsInfrastructure?: boolean;
  needsScaffolding?: boolean;
  needsTechnicalHole?: boolean;
  needsMasonry?: boolean;
  groundingSystem?: string;
  artNumber?: string;

  // Installation specific
  installationDate?: string;
  modelNumber?: string;
  serialNumberNew?: string;
  chargerLoad?: string;
  cableGauge?: string;
  chargerCircuitBreaker?: string;
  chargerStatus?: string;
  compliesWithNBR17019?: boolean;
  homologatedInstallation?: boolean;
  validWarranty?: boolean;
  requiredAdjustment?: boolean;
  adjustmentDescription?: string;
}

export type ServiceStatus = 'pendente' | 'concluido' | 'cancelado';

export interface ServiceFeedback {
  clientRating?: number; // 1-5 stars
  clientComment?: string;
  technicianFeedback?: string;
}

export interface ServiceMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp: string;
  isRead: boolean;
}

export interface Service {
  id: string;
  title: string;
  description?: string;
  status: ServiceStatus;
  date?: string;
  dueDate?: string;
  location: string;
  address?: string;
  city?: string;
  client?: string;
  notes?: string;
  technician: TeamMember;
  reportData?: ReportData;
  photos?: string[];
  photoTitles?: string[];
  feedback?: ServiceFeedback;
  messages?: ServiceMessage[];
  serviceType?: 'inspection' | 'installation';
}
