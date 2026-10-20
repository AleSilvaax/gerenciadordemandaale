export type ChecklistFieldType =
  | 'text' | 'number' | 'textarea' | 'select'
  | 'pills' | 'cards' | 'binary_list' | 'timestamp' | 'computed';

export interface ChecklistOption {
  value: string;
  label: string;
  icon?: string;
}

export interface BinaryItem {
  id: string;
  title: string;
  subtitle?: string;
}

export interface ConditionalRule {
  field: string;
  in: string[];
}

export interface ChecklistFieldDef {
  id: string;
  label: string;
  type: ChecklistFieldType;
  required?: boolean;
  placeholder?: string;
  help?: string;
  options?: ChecklistOption[];
  items?: BinaryItem[];
  showIf?: ConditionalRule;
  /** chave no registro de cálculos automáticos */
  compute?: string;
}

export interface ChecklistStep {
  id: string;
  title: string;
  notice?: string;
  /** destaque quando a condição é atendida (ex: bloco de condomínio) */
  highlightIf?: ConditionalRule;
  fields: ChecklistFieldDef[];
}

export interface PhotoSlotDef {
  id: string;
  title: string;
  instruction: string;
  required: boolean;
}

export interface ChecklistTemplate {
  steps: ChecklistStep[];
  photoSlots: PhotoSlotDef[];
}

export type ChecklistAnswers = Record<string, unknown>;

export interface ComputationContext {
  answers: ChecklistAnswers;
}

/** Resposta salva em services.custom_fields (compatível com o formato atual) */
export interface GuidedFieldAnswer {
  id: string;
  label: string;
  type: string;
  value: unknown;
  step?: string;
}
