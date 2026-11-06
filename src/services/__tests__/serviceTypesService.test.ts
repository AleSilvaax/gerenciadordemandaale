import { beforeEach, describe, expect, it, vi } from 'vitest';
import { getServiceTypesFromDatabase, createGuidedServiceType } from '../serviceTypesService';

const mocks = vi.hoisted(() => ({ eq: vi.fn(), insert: vi.fn(), maybeSingle: vi.fn(), order: vi.fn(), from: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  auth: { getUser: async () => ({ data: { user: { id: 'user-1' } } }) }, from: mocks.from,
} }));
describe('Tipos por organização', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const chain = { select: () => chain, eq: mocks.eq, order: mocks.order, limit: () => chain, maybeSingle: mocks.maybeSingle, insert: mocks.insert,
      single: async () => ({ data: { organization_id: 'org-own' }, error: null }) };
    mocks.eq.mockReturnValue(chain);
    mocks.from.mockReturnValue(chain);
    mocks.order.mockResolvedValue({ data: [], error: null });
  });
  it('filtra os tipos pela empresa do usuário e não inventa cadastros', async () => {
    expect(await getServiceTypesFromDatabase()).toEqual([]);
    expect(mocks.eq).toHaveBeenCalledWith('organization_id', 'org-own');
  });
  it('abre o modelo existente sem inserir outro duplicado', async () => {
    mocks.maybeSingle.mockResolvedValue({ data: { id: 'existing', name: 'EV' }, error: null });
    expect(await createGuidedServiceType('EV', '', [], [])).toMatchObject({ id: 'existing' });
    expect(mocks.eq).toHaveBeenCalledWith('organization_id', 'org-own');
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});