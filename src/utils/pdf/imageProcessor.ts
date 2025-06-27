// Arquivo: src/utils/pdf/imageProcessor.ts

import { PDF_DIMENSIONS } from './pdfConstants';

export interface ImageDimensions {
  width: number;
  height: number;
}

// NOVA FUNÇÃO: Busca uma imagem de uma URL e a converte para base64
const getImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
    }
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error(`Erro ao converter imagem da URL: ${url}`, error);
    return null;
  }
};

// FUNÇÃO ATUALIZADA: Agora ela é "async" e inteligente
export const processImageForPDF = async (url: string): Promise<string | null> => {
  if (!url) return null;

  // Caso 1: Se já for uma imagem em base64 (como as assinaturas), usa diretamente.
  if (url.startsWith('data:image')) {
    return url;
  }

  // Caso 2: Se for uma URL da internet, busca e converte.
  if (url.startsWith('http')) {
    return await getImageAsBase64(url);
  }
  
  // Se não for nenhum dos casos, avisa e retorna nulo.
  console.warn('URL de imagem com formato não suportado:', url.substring(0, 50));
  return null;
};


export const calculateImageDimensions = (base64Url: string): ImageDimensions => {
  try {
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
  } catch (error) {
    console.warn('Erro ao calcular dimensões da imagem, usando padrão:', error);
    return { width: PDF_DIMENSIONS.maxImageWidth, height: PDF_DIMENSIONS.maxImageHeight };
  }
};
