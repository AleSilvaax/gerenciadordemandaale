
export const safeText = (text: string): string => {
  if (!text) return '';
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove diacríticos
    .replace(/[^\w\s\-.,()\/]/g, '') // Remove caracteres especiais
    .trim();
};
