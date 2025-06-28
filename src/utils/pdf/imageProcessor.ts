import { PDF_DIMENSIONS } from './pdfConstants';

export interface ImageDimensions { width: number; height: number; }

const getImageAsBase64 = async (url: string): Promise<string | null> => {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Falha ao buscar imagem: ${response.statusText}`);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    return null;
  }
};

export const processImageForPDF = async (url: string): Promise<string | null> => {
  if (!url) return null;
  if (url.startsWith('data:image')) return url;
  if (url.startsWith('http')) return await getImageAsBase64(url);
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
