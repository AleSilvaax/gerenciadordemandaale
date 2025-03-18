
export type ServiceStatus = 'pendente' | 'concluido' | 'cancelado';

export interface TeamMember {
  id: string;
  name: string;
  avatar: string;
  role?: string;
}

export interface ReportData {
  client: string;
  address: string;
  city: string;
  executedBy: string;
  installationDate: string;
  modelNumber: string;
  serialNumberNew: string;
  serialNumberOld: string;
  homologatedName: string;
  compliesWithNBR17019: boolean;
  homologatedInstallation: boolean;
  requiredAdjustment: boolean;
  adjustmentDescription: string;
  validWarranty: boolean;
  circuitBreakerEntry: string;
  chargerCircuitBreaker: string;
  cableGauge: string;
  chargerStatus: string;
  technicalComments: string;
}

export interface Service {
  id: string;
  title: string;
  status: ServiceStatus;
  location: string;
  technicians: TeamMember[];
  reportData: ReportData;
  photos: string[];
  number?: string;
}
