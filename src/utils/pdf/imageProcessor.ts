
// Processamento de imagens melhorado com cache em memória e conversão de formatos
const imageCache = new Map<string, string>();

// Converte formatos não suportados (WEBP, SVG) para JPEG/PNG
const convertImageFormat = async (blob: Blob): Promise<string | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        // Converter para JPEG com qualidade alta
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      } else {
        resolve(null);
      }
    };
    
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(blob);
  });
};

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
    let dataUrl: string | null = null;

    // Verificar se é um formato que precisa de conversão
    if (blob.type === 'image/webp' || blob.type === 'image/svg+xml' || !blob.type.startsWith('image/')) {
      console.log('[PDF] Convertendo formato de imagem:', blob.type);
      dataUrl = await convertImageFormat(blob);
    } else {
      // Formato suportado, usar FileReader
      dataUrl = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(null);
        reader.readAsDataURL(blob);
      });
    }

    if (dataUrl) {
      imageCache.set(imageUrl, dataUrl);
      console.log('[PDF] Imagem processada com sucesso');
    }
    
    return dataUrl;
  } catch (error) {
    console.error('[PDF] Erro ao processar imagem:', error);
    return null;
  }
};
