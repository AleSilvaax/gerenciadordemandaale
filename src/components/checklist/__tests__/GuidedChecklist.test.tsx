import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { GuidedChecklist } from '../GuidedChecklist';
import { evChargerTemplate } from '@/templates/evChargerTemplate';

const baseProps = {
  template: evChargerTemplate,
  photos: [],
  serviceId: 'svc-1',
  onFieldsUpdate: vi.fn(),
  onPhotosChange: vi.fn(),
};

const saved = (entries: Array<[string, unknown]>) =>
  entries.map(([id, value]) => ({ id, value }));

describe('Checklist guiado — Vistoria EV', () => {
  it('mostra a etapa 1 de 6 com progresso e campos de endereço', () => {
    render(<GuidedChecklist {...baseProps} savedFields={[]} />);
    expect(screen.getByText('Etapa 1 de 6')).toBeTruthy();
    expect(screen.getByText('Dados Iniciais')).toBeTruthy();
    expect(screen.getByText('Km de ida (base até o cliente)')).toBeTruthy();
    expect(screen.getByText('Tipo de Imóvel')).toBeTruthy();
  });

  it('calcula especificação e metragem de cabos na etapa de dimensionamento', () => {
    render(
      <GuidedChecklist
        {...baseProps}
        savedFields={saved([
          ['distancia_quadro_carregador', 15],
          ['potencia_carregador', '22 kW — Trifásico 32A'],
          ['config_ligacao', 'Trifásico (3F + N + PE)'],
        ])}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Cabo e Dimensionamento/ }));
    expect(screen.getByText('ESPECIFICAÇÃO GERADA')).toBeTruthy();
    expect(screen.getByText('Disjuntor 40A 3P')).toBeTruthy();
    // 3 fases × 15 m = 45 m preto, 15 m azul, 15 m verde, 75 m total
    expect(screen.getByDisplayValue('45')).toBeTruthy();
    expect(screen.getAllByDisplayValue('15').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('75 m')).toBeTruthy();
  });

  it('exibe lista binária SIM/NÃO na etapa Adicionais', () => {
    render(<GuidedChecklist {...baseProps} savedFields={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /Adicionais/ }));
    expect(screen.getByText('Necessário furo técnico?')).toBeTruthy();
    expect(screen.getAllByRole('button', { name: 'SIM' })).toHaveLength(7);
    expect(screen.getAllByRole('button', { name: 'NÃO' })).toHaveLength(7);
  });

  it('renderiza os 8 slots de fotos com obrigatoriedade na aba Fotos', () => {
    render(<GuidedChecklist {...baseProps} savedFields={[]} />);
    fireEvent.click(screen.getByRole('button', { name: /^Fotos$/ }));
    expect(screen.getByText('Fachada do imóvel')).toBeTruthy();
    expect(screen.getByText('Tela do multímetro')).toBeTruthy();
    expect(screen.getAllByText('OBRIGATÓRIO')).toHaveLength(7);
    expect(screen.getAllByText('OPCIONAL')).toHaveLength(1);
  });

  it('salva as respostas com a etapa de origem em cada campo', async () => {
    const onFieldsUpdate = vi.fn();
    render(
      <GuidedChecklist
        {...baseProps}
        onFieldsUpdate={onFieldsUpdate}
        savedFields={saved([
          ['cep', '02078-010'],
          ['logradouro', 'Av Belchior de Ordas'],
          ['numero', '304'],
          ['cidade_uf', 'São Paulo/SP'],
          ['tipo_imovel', 'Casa'],
          ['tipo_rede', 'Trifásico (3F+N+T)'],
          ['distancia_quadro_carregador', 15],
          ['potencia_carregador', '22 kW — Trifásico 32A'],
          ['config_ligacao', 'Trifásico (3F + N + PE)'],
          ['adicionais', {
            furo_tecnico: 'SIM', documento_adicional: 'NÃO', medidor_dedicado: 'NÃO',
            totem_pedestal: 'NÃO', andaime_altura: 'NÃO', servico_alvenaria: 'NÃO',
            pintura_eletroduto: 'NÃO',
          }],
        ])}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: /Salvar/ }));
    await vi.waitFor(() => expect(onFieldsUpdate).toHaveBeenCalled());
    const payload = onFieldsUpdate.mock.calls[0][0] as Array<Record<string, unknown>>;
    const tipoImovel = payload.find(f => f.id === 'tipo_imovel');
    expect(tipoImovel?.step).toBe('Dados Iniciais');
    expect(tipoImovel?.value).toBe('Casa');
    const spec = payload.find(f => f.id === 'especificacao_gerada');
    expect(String(spec?.value)).toContain('Disjuntor 40A 3P');
  });
});
