
// Processamento de imagens melhorado
export const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);
    
    if (imageUrl.startsWith('data:image')) {
      return imageUrl;
    }

    // Carregar imagem com headers apropriados
    const response = await fetch(imageUrl, {
      mode: 'cors',
      method: 'GET',
      headers: {
        'Accept': 'image/*,*/*'
      }
    });

    if (!response.ok) {
      console.warn('[PDF] Erro ao carregar imagem:', response.status);
      return null;
    }

    const blob = await response.blob();
    
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[PDF] Erro ao processar imagem:', error);
    return null;
  }
};
