
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

export const compressImage = async (
  file: File,
  options: CompressionOptions = {}
): Promise<File> => {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    maxSizeKB = 500
  } = options;

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    if (!ctx) {
      reject(new Error('Não foi possível criar contexto do canvas'));
      return;
    }

    img.onload = () => {
      try {
        // Calcular novas dimensões mantendo proporção
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = Math.min(width, maxWidth);
            height = width / aspectRatio;
          } else {
            height = Math.min(height, maxHeight);
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Desenhar imagem redimensionada
        ctx.drawImage(img, 0, 0, width, height);

        // Converter para blob com qualidade especificada
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Erro ao comprimir imagem'));
              return;
            }

            const compressedFile = new File(
              [blob],
              file.name,
              {
                type: file.type,
                lastModified: Date.now()
              }
            );

            // Verificar se precisa comprimir mais
            const sizeKB = compressedFile.size / 1024;
            
            if (sizeKB > maxSizeKB && quality > 0.1) {
              // Comprimir recursivamente com qualidade menor
              const newQuality = Math.max(0.1, quality - 0.1);
              compressImage(file, { ...options, quality: newQuality })
                .then(resolve)
                .catch(reject);
            } else {
              console.log(`[COMPRESSÃO] ${file.name}: ${(file.size / 1024).toFixed(1)}KB → ${sizeKB.toFixed(1)}KB`);
              resolve(compressedFile);
            }
          },
          file.type,
          quality
        );
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => reject(new Error('Erro ao carregar imagem'));
    img.src = URL.createObjectURL(file);
  });
};

export const compressMultipleImages = async (
  files: File[],
  options: CompressionOptions = {}
): Promise<File[]> => {
  const results: File[] = [];
  
  for (const file of files) {
    try {
      const compressed = await compressImage(file, options);
      results.push(compressed);
    } catch (error) {
      console.error(`Erro ao comprimir ${file.name}:`, error);
      // Manter arquivo original em caso de erro
      results.push(file);
    }
  }
  
  return results;
};

export const isImageFile = (file: File): boolean => {
  return file.type.startsWith('image/');
};
