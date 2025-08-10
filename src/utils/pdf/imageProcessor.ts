
// Processamento de imagens melhorado com cache em memória
const imageCache = new Map<string, string>();

export const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);

    if (!imageUrl) return null;

    // Data URL já utilizável
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    // Cache
    const cached = imageCache.get(imageUrl);
    if (cached) return cached;

    const response = await fetch(imageUrl, {
      mode: 'cors',
      method: 'GET',
      headers: { Accept: 'image/*,*/*' },
    });

    if (!response.ok) {
      console.warn('[PDF] Erro ao carregar imagem:', response.status, imageUrl);
      return null;
    }

    const blob = await response.blob();

    const dataUrl: string | null = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });

    if (dataUrl) imageCache.set(imageUrl, dataUrl);
    return dataUrl;
  } catch (error) {
    console.error('[PDF] Erro ao processar imagem:', error);
    return null;
  }
};
