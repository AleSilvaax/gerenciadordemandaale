import { PDF_DIMENSIONS } from './pdfConstants';

export interface ImageDimensions { width: number; height: number; }

const getImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    console.log('[imageProcessor] Buscando imagem:', url);
    
    const response = await fetch(url, {
      mode: 'cors',
      headers: {
        'Accept': 'image/*'
      }
    });
    
    if (!response.ok) {
      console.error('[imageProcessor] Erro na resposta:', response.status, response.statusText);
      throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
    }
    
    const blob = await response.blob();
    console.log('[imageProcessor] Blob obtido, tamanho:', blob.size, 'tipo:', blob.type);
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        console.log('[imageProcessor] Conversão para base64 concluída');
        resolve(reader.result as string);
      };
      reader.onerror = (error) => {
        console.error('[imageProcessor] Erro na conversão:', error);
        reject(error);
      };
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[imageProcessor] Erro ao buscar imagem:', error);
    return null;
  }
};

export const processImageForPDF = async (url: string): Promise<string | null> => {
  if (!url) {
    console.log('[imageProcessor] URL vazia fornecida');
    return null;
  }
  
  if (url.startsWith('data:image')) {
    console.log('[imageProcessor] Imagem já em base64');
    return url;
  }
  
  if (url.startsWith('http')) {
    console.log('[imageProcessor] Processando URL externa:', url);
    const base64 = await getImageAsBase64(url);
    if (!base64) {
      console.error('[imageProcessor] Falha ao converter para base64:', url);
    }
    return base64;
  }
  
  console.warn('[imageProcessor] Formato de URL não suportado:', url);
  return null;
};

export const calculateImageDimensions = (base64Url: string): ImageDimensions => {
    const img = new Image();
    img.src = base64Url;
    const originalWidth = img.naturalWidth || 800;
    const originalHeight = img.naturalHeight || 600;
    const maxWidth = PDF_DIMENSIONS.maxImageWidth;
    const maxHeight = PDF_DIMENSIONS.maxImageHeight;
    const aspectRatio = originalWidth / originalHeight;
    let finalWidth = maxWidth;
    let finalHeight = maxWidth / aspectRatio;
    if (finalHeight > maxHeight) {
      finalHeight = maxHeight;
      finalWidth = maxHeight * aspectRatio;
    }
    return { width: finalWidth, height: finalHeight };
};
