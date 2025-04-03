
import { TeamMember } from "@/data/mockData";
import { CustomField } from "@/components/ui-custom/CustomFieldManager";

export interface ReportData {
  client?: string;
  address?: string;
  city?: string;
  clientName?: string;
  clientSignature?: string;
  
  // Service phase
  servicePhase?: "inspection" | "installation";
  
  // Inspection fields
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
  
  // Installation fields
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
  
  // Technical comments
  technicalComments?: string;
  
  // Custom fields
  customFields?: CustomField[];
}

export interface Service {
  id: string;
  title: string;
  description: string;
  status: "pendente" | "concluido" | "cancelado";
  date: string;
  dueDate: string;
  priority: "low" | "medium" | "high";
  client: string;
  address: string;
  type: string;
  technician: TeamMember & {
    signature?: string;
  };
  notes?: string;
  photos?: string[];
  photoTitles?: string[];
  reportData?: ReportData;
}
