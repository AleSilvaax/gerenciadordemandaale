import type { ChecklistAnswers } from '@/types/checklist';
import { cableLengths, cableComputation, chargerSpecSummary } from './evComputations';

export interface ComputationDef {
  compute: (answers: ChecklistAnswers) => string | number;
  /** cor do indicador circular, quando aplicável */
  color?: string;
}

/**
 * Registro de cálculos automáticos disponíveis para templates de checklist.
 * Novos templates adicionam entradas aqui sem alterar o componente.
 */
export const computations: Record<string, ComputationDef> = {
  ev_spec: { compute: answers => chargerSpecSummary(answers) },
  cabo_preto: { compute: answers => cableComputation('cabo_preto', answers), color: '#1f2937' },
  cabo_azul: { compute: answers => cableComputation('cabo_azul', answers), color: '#2563eb' },
  cabo_verde: { compute: answers => cableComputation('cabo_verde', answers), color: '#16a34a' },
  cabo_total: {
    compute: answers => {
      const lengths = cableLengths(answers.config_ligacao, answers.distancia_quadro_carregador);
      if (!lengths) return '';
      const preto = Number(answers.cabo_preto) || lengths.preto;
      const azul = Number(answers.cabo_azul) || lengths.azul;
      const verde = Number(answers.cabo_verde) || lengths.verde;
      return preto + azul + verde;
    },
  },
};
