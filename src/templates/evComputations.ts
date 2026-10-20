import type { ChecklistAnswers } from '@/types/checklist';

export interface ChargerSpec {
  fases: string;
  corrente: string;
  bitolaBase: string;
  disjuntor: string;
  idr: string;
}

const POWER_SPECS: Record<string, ChargerSpec> = {
  '3,7 kW — Mono 16A': { fases: '1', corrente: '16A', bitolaBase: '6mm²', disjuntor: 'Disjuntor 20A 2P', idr: 'IDR 25A 2P Classe A' },
  '7,4 kW — Mono/Bifásico 32A': { fases: '1 ou 2', corrente: '32A', bitolaBase: '6mm² / 10mm²', disjuntor: 'Disjuntor 40A 2P', idr: 'IDR 40A 2P Classe A' },
  '11 kW — Trifásico 16A': { fases: '3', corrente: '16A', bitolaBase: '6mm²', disjuntor: 'Disjuntor 20A 3P', idr: 'IDR 25A 4P Classe A' },
  '22 kW — Trifásico 32A': { fases: '3', corrente: '32A', bitolaBase: '10mm²', disjuntor: 'Disjuntor 40A 3P', idr: 'IDR 40A 4P Classe A' },
};

export const chargerSpec = (power: unknown): ChargerSpec | null =>
  typeof power === 'string' ? POWER_SPECS[power] ?? null : null;

export const chargerSpecSummary = (answers: ChecklistAnswers): string => {
  const spec = chargerSpec(answers.potencia_carregador);
  if (!spec) return '';
  return `Fases: ${spec.fases} | Corrente: ${spec.corrente} | Bitola base: ${spec.bitolaBase} | Disjuntor: ${spec.disjuntor} | IDR: ${spec.idr}`;
};

export interface CableWays { fases: number; neutros: number; terra: number }

const CONNECTION_WAYS: Record<string, CableWays> = {
  'Monofásico (F + N + PE)': { fases: 1, neutros: 1, terra: 1 },
  'Bifásico (2F + PE)': { fases: 2, neutros: 0, terra: 1 },
  'Bifásico (2F + N + PE)': { fases: 2, neutros: 1, terra: 1 },
  'Trifásico (3F + N + PE)': { fases: 3, neutros: 1, terra: 1 },
};

export const cableWays = (connection: unknown): CableWays | null =>
  typeof connection === 'string' ? CONNECTION_WAYS[connection] ?? null : null;

export interface CableLengths { preto: number; azul: number; verde: number; total: number }

export const cableLengths = (connection: unknown, distance: unknown): CableLengths | null => {
  const ways = cableWays(connection);
  const dist = Number(distance);
  if (!ways || !Number.isFinite(dist) || dist <= 0) return null;
  const preto = ways.fases * dist;
  const azul = ways.neutros * dist;
  const verde = ways.terra * dist;
  return { preto, azul, verde, total: preto + azul + verde };
};

export const cableComputation = (key: string, answers: ChecklistAnswers): number | '' => {
  const lengths = cableLengths(answers.config_ligacao, answers.distancia_quadro_carregador);
  if (!lengths) return '';
  if (key === 'cabo_preto') return lengths.preto;
  if (key === 'cabo_azul') return lengths.azul;
  if (key === 'cabo_verde') return lengths.verde;
  return '';
};
