import { beforeEach, describe, expect, it, vi } from 'vitest';
import { uploadServicePhoto } from '../photoUpload';

const mocks = vi.hoisted(() => ({ upload: vi.fn(), remove: vi.fn(), sign: vi.fn(), insert: vi.fn(), single: vi.fn() }));
vi.mock('@/integrations/supabase/client', () => ({ supabase: {
  storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove, createSignedUrl: mocks.sign }) },
  from: () => ({ insert: mocks.insert }),
} }));

describe('Persistência de fotos da demanda', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.upload.mockResolvedValue({ data: { path: 'svc/photo.jpg' }, error: null });
    mocks.insert.mockReturnValue({ select: () => ({ single: mocks.single }) });
    mocks.single.mockResolvedValue({ data: { id: 'photo-1' }, error: null });
    mocks.sign.mockResolvedValue({ data: { signedUrl: 'https://example.test/photo' }, error: null });
    mocks.remove.mockResolvedValue({ error: null });
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:local-preview' });
  });
  it('persiste o caminho e título antes de gerar a visualização', async () => {
    const photo = await uploadServicePhoto('svc', new File(['x'], 'camera.jpg', { type: 'image/jpeg' }), 'Quadro — aberto');
    expect(mocks.insert).toHaveBeenCalledWith({ service_id: 'svc', photo_url: 'svc/photo.jpg', title: 'Quadro — aberto' });
    expect(mocks.single.mock.invocationCallOrder[0]).toBeLessThan(mocks.sign.mock.invocationCallOrder[0]);
    expect(photo.dbId).toBe('photo-1');
  });
  it('não perde a foto salva quando a URL temporária falha', async () => {
    mocks.sign.mockResolvedValue({ data: null, error: { message: 'offline' } });
    const photo = await uploadServicePhoto('svc', new File(['x'], 'camera.jpg'));
    expect(photo).toMatchObject({ path: 'svc/photo.jpg', dbId: 'photo-1', signedUrl: 'blob:local-preview' });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it('remove o objeto órfão se o registro da foto falhar', async () => {
    mocks.single.mockResolvedValue({ data: null, error: { message: 'negado' } });
    await expect(uploadServicePhoto('svc', new File(['x'], 'camera.jpg'))).rejects.toThrow('negado');
    expect(mocks.remove).toHaveBeenCalledWith(['svc/photo.jpg']);
    expect(mocks.sign).not.toHaveBeenCalled();
  });
});