
export type ServiceStatus = 'pendente' | 'concluido' | 'cancelado';
export type ServicePriority = 'baixa' | 'media' | 'alta' | 'urgente';
export type UserRole = 'tecnico' | 'administrador' | 'gestor';

export interface TeamMember {
  id: string;
  name: string;
  avatar?: string;
  role: UserRole;
  email?: string;
  phone?: string;
  signature?: string;
}

export interface CustomField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select';
  value: string | number | boolean;
  options?: string[];
}

export interface TechnicalField {
  id: string;
  name: string;
  type: 'text' | 'number' | 'textarea' | 'boolean' | 'select' | 'date' | 'checkbox';
  required: boolean;
  description?: string;
  options?: string[];
}

export interface ServiceTypeConfig {
  id: string;
  name: string;
  description?: string;
  estimatedHours?: number;
  defaultPriority?: ServicePriority;
  technicalFields?: TechnicalField[];
}

export interface Service {
  id: string;
  title: string;
  location: string;
  status: ServiceStatus;
  technician?: TeamMember;
  creationDate: string;
  dueDate?: string;
  priority?: ServicePriority;
  serviceType?: string;
  number?: string;
  description?: string;
  createdBy?: string;
  client?: string;
  address?: string;
  city?: string;
  notes?: string;
  estimatedHours?: number;
  customFields?: CustomField[];
  signatures?: any;
  feedback?: any;
  messages?: any[];
  photos?: string[];
  photoTitles?: string[];
  date?: string;
}

export interface ServiceFeedback {
  rating: number;
  comment: string;
  wouldRecommend: boolean;
  clientRating: number;
  clientComment?: string;
  technicianFeedback?: string;
  userId?: string;
  userName?: string;
  timestamp?: string;
}
