import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { PhotoSlots } from '../PhotoSlots';

const mocks = vi.hoisted(() => ({ upload: vi.fn(), sync: vi.fn() }));
vi.mock('@/services/photoUpload', () => ({ uploadServicePhoto: mocks.upload, syncServicePhotosFields: mocks.sync }));
describe('Fotos de etapas', () => {
  it('mantém a foto anexada mesmo se o espelhamento de anexos falhar', async () => {
    mocks.upload.mockResolvedValue({ dbId: 'saved-photo', signedUrl: 'https://example.test/image', title: 'Quadro' });
    mocks.sync.mockRejectedValue(new Error('rede'));
    const onPhotosChange = vi.fn();
    const { container } = render(<PhotoSlots slots={[{ id: 'quadro', title: 'Quadro', instruction: '', required: true }]} photos={[]} serviceId="svc" onPhotosChange={onPhotosChange} />);
    const input = container.querySelector('input[type=file]');
    if (!input) throw new Error('Input ausente');
    fireEvent.change(input, { target: { files: [new File(['x'], 'camera.jpg', { type: 'image/jpeg' })] } });
    await waitFor(() => expect(onPhotosChange).toHaveBeenCalled());
    expect(onPhotosChange.mock.calls[0][0][0]).toMatchObject({ dbId: 'saved-photo', title: 'Quadro', url: 'https://example.test/image' });
    await waitFor(() => expect(screen.getByRole('button', { name: /Adicionar foto/ }).hasAttribute('disabled')).toBe(false));
  });
});