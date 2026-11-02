import { describe, expect, it } from 'vitest';
import { cableLengths, cableWays, chargerSpec, chargerSpecSummary } from '../evComputations';

describe('especificação do carregador por potência', () => {
  it('7,4 kW gera 32A, disjuntor 40A 2P e IDR 40A 2P Classe A', () => {
    expect(chargerSpec('7,4 kW — Mono/Bifásico 32A')).toEqual({
      fases: '1 ou 2',
      corrente: '32A',
      bitolaBase: '6mm² / 10mm²',
      disjuntor: 'Disjuntor 40A 2P',
      idr: 'IDR 40A 2P Classe A',
    });
  });

  it('22 kW gera 3 fases, disjuntor 40A 3P e IDR 40A 4P Classe A', () => {
    expect(chargerSpec('22 kW — Trifásico 32A')).toEqual({
      fases: '3',
      corrente: '32A',
      bitolaBase: '10mm²',
      disjuntor: 'Disjuntor 40A 3P',
      idr: 'IDR 40A 4P Classe A',
    });
  });

  it('potência desconhecida não gera especificação', () => {
    expect(chargerSpec('5 kW')).toBeNull();
    expect(chargerSpecSummary({ potencia_carregador: undefined })).toBe('');
  });
});

describe('cabeamento por cor e função', () => {
  it('trifásico com neutro a 15 m: 45 m preto, 15 m azul, 15 m verde, 75 m total', () => {
    expect(cableLengths('Trifásico (3F + N + PE)', 15)).toEqual({
      preto: 45, azul: 15, verde: 15, total: 75,
    });
  });

  it('bifásico sem neutro não tem cabo azul', () => {
    expect(cableLengths('Bifásico (2F + PE)', 10)).toEqual({
      preto: 20, azul: 0, verde: 10, total: 30,
    });
  });

  it('monofásico a 12 m: 12 m de cada cabo', () => {
    expect(cableLengths('Monofásico (F + N + PE)', 12)).toEqual({
      preto: 12, azul: 12, verde: 12, total: 36,
    });
  });

  it('sem configuração ou distância inválida não calcula', () => {
    expect(cableLengths(undefined, 10)).toBeNull();
    expect(cableLengths('Monofásico (F + N + PE)', 0)).toBeNull();
    expect(cableWays('Ligação inventada')).toBeNull();
  });
});
