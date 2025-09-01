
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

// Redimensiona imagens muito grandes para melhor performance
const resizeImage = async (dataUrl: string, maxWidth: number = 1600): Promise<string | null> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Se a imagem já é pequena, retornar como está
      if (img.naturalWidth <= maxWidth) {
        resolve(dataUrl);
        return;
      }
      
      // Calcular nova dimensão mantendo proporção
      const ratio = maxWidth / img.naturalWidth;
      canvas.width = maxWidth;
      canvas.height = img.naturalHeight * ratio;
      
      if (ctx) {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        resolve(dataUrl);
      }
    };
    
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
};

export const processImage = async (imageUrl: string): Promise<string | null> => {
  try {
    console.log('[PDF] Processando imagem:', imageUrl);

    if (!imageUrl) return null;

    // Data URL já utilizável
    if (imageUrl.startsWith('data:image')) {
      return await resizeImage(imageUrl);
    }

    // Cache
    const cached = imageCache.get(imageUrl);
    if (cached) return cached;

    // Converter URLs do Supabase privadas para signed URLs se necessário
    let finalUrl = imageUrl;
    if (imageUrl.includes('/storage/v1/object/public/service-photos/') && !imageUrl.includes('token=')) {
      try {
        const { convertToSignedUrl } = await import('@/utils/signedUrlHelper');
        finalUrl = await convertToSignedUrl(imageUrl);
        console.log('[PDF] URL convertida para signed URL');
      } catch (e) {
        console.warn('[PDF] Erro ao converter para signed URL:', e);
      }
    }

    // Fazer fetch com timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout

    const response = await fetch(finalUrl, {
      mode: 'cors',
      method: 'GET',
      headers: { Accept: 'image/*,*/*' },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.warn('[PDF] Erro ao carregar imagem:', response.status, finalUrl);
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

    // Redimensionar se necessário
    if (dataUrl) {
      dataUrl = await resizeImage(dataUrl);
    }

    if (dataUrl) {
      imageCache.set(imageUrl, dataUrl);
      console.log('[PDF] Imagem processada com sucesso');
    }
    
    return dataUrl;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.warn('[PDF] Timeout ao carregar imagem:', imageUrl);
    } else {
      console.error('[PDF] Erro ao processar imagem:', error);
    }
    return null;
  }
};
