
export type ServiceStatus = "concluido" | "pendente" | "cancelado" | "em_andamento";
export type ServicePriority = "baixa" | "media" | "alta" | "urgente";
export type UserRole = "tecnico" | "administrador" | "gestor";

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role: UserRole;
  email?: string;
  phone?: string;
  signature?: string;
}

export interface ServiceMessage {
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  timestamp?: string;
}

export interface ServiceFeedback {
  clientRating: number;
  clientComment?: string;
  technicianFeedback?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select';
  value: string | number | boolean;
  options?: string[];
}

export interface Service {
  id: string;
  title: string;
  status: ServiceStatus;
  location: string;
  technician: TeamMember;
  priority?: ServicePriority;
  dueDate?: string;
  creationDate?: string;
  reportData?: ReportData;
  photos?: string[];
  signatures?: {
    client?: string;
    technician?: string;
  };
  
  date?: string;
  description?: string;
  client?: string;
  address?: string;
  city?: string;
  notes?: string;
  serviceType?: "inspection" | "installation" | "maintenance";
  estimatedHours?: number;
  photoTitles?: string[];
  messages?: ServiceMessage[];
  feedback?: ServiceFeedback;
  customFields?: CustomField[];
  team_id?: string;
}

export interface ServiceCardProps {
  service: Service;
  onDelete?: (id: string) => Promise<void>;
  compact?: boolean;
}

export interface ReportData {
  client?: string;
  address?: string;
  city?: string;
  executedBy?: string;
  servicePhase?: "inspection" | "installation";
  installationDate?: string;
  modelNumber?: string;
  serialNumberNew?: string;
  serialNumberOld?: string;
  homologatedName?: string;
  compliesWithNBR17019?: boolean;
  homologatedInstallation?: boolean;
  requiredAdjustment?: boolean;
  adjustmentDescription?: string;
  validWarranty?: boolean;
  circuitBreakerEntry?: string;
  chargerCircuitBreaker?: string;
  cableGauge?: string;
  chargerStatus?: string;
  technicalComments?: string;
  inspectionDate?: string;
  voltage?: string;
  supplyType?: string;
  installationDistance?: string;
  installationObstacles?: string;
  existingPanel?: boolean;
  panelType?: string;
  panelAmps?: string;
  groundingSystem?: string;
  chargerLoad?: string;
  
  wallboxBrand?: string;
  wallboxPower?: string;
  powerSupplyType?: string;
  phaseAmperage?: string;
  cableSection?: string;
  energyMeter?: boolean;
  needsInfrastructure?: boolean;
  artNumber?: string;
  projectNumber?: string;
  
  installationTime?: string;
  daysCount?: string;
  clientRepresentative?: string;
  greenCableLength?: string;
  blackCableLength?: string;
  ppCableLength?: string;
  
  breakerDetails?: string;
  drDetails?: string;
  dpsDetails?: string;
  conduitType?: string;
  hasGroundingSystem?: boolean;
  groundingDetails?: string;
  earthBarrierDetails?: string;
  neutralBarrierDetails?: string;
  
  voltageBetweenPhases?: string;
  voltageBetweenPhaseAndNeutral?: string;
  hasThreePhase?: boolean;
  hasMainBreaker?: boolean;
  hasDps?: boolean;
  
  distanceToPanelAndCharger?: string;
  conduitInstallationType?: string;
  chargerPositionAgreed?: boolean;
  externalInstallation?: boolean;
  needsScaffolding?: boolean;
  needsTechnicalHole?: boolean;
  needsMasonry?: boolean;
  needsWallPainting?: boolean;
  needsConduitPainting?: boolean;
  needsArtEmission?: boolean;
  needsAdditionalDocumentation?: boolean;
  hasWifiOrCellSignal?: boolean;
  workingHours?: string;
  
  mainBreakerPhoto?: string;
  electricalPanelPhoto?: string;
  infraAreaPhoto?: string;
  chargerLocationPhoto?: string;
  
  clientName?: string;
  clientSignature?: string;
}

export interface StatData {
  total: number;
  completed: number;
  pending: number;
  cancelled: number;
}

export interface ChartData {
  name: string;
  value: number;
}
