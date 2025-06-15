
import { PDF_DIMENSIONS } from './pdfConstants';

export interface ImageDimensions {
  width: number;
  height: number;
}

export const calculateImageDimensions = (base64Url: string): ImageDimensions => {
  try {
    // Criar uma imagem temporária para obter dimensões reais
    const img = new Image();
    img.src = base64Url;
    
    const originalWidth = img.naturalWidth || 800;
    const originalHeight = img.naturalHeight || 600;
    
    // Definir tamanho máximo para fotos (preservando proporção)
    const maxWidth = PDF_DIMENSIONS.maxImageWidth;
    const maxHeight = PDF_DIMENSIONS.maxImageHeight;
    
    // Calcular proporção
    const aspectRatio = originalWidth / originalHeight;
    
    let finalWidth = maxWidth;
    let finalHeight = maxWidth / aspectRatio;
    
    // Se a altura exceder o máximo, ajustar pela altura
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

export const processImageForPDF = (base64Url: string): string | null => {
  try {
    // Verificar se é uma string válida de base64
    if (!base64Url || !base64Url.startsWith('data:image')) {
      console.warn('URL de imagem inválida:', base64Url?.substring(0, 50));
      return null;
    }

    // Extrair apenas a parte base64
    const base64Data = base64Url.split(',')[1];
    if (!base64Data) {
      console.warn('Dados base64 não encontrados');
      return null;
    }

    // Verificar o tipo de imagem
    const imageType = base64Url.substring(5, base64Url.indexOf(';'));
    console.log('Processando imagem tipo:', imageType, 'tamanho:', base64Data.length);

    return base64Url;
  } catch (error) {
    console.error('Erro ao processar imagem:', error);
    return null;
  }
};
