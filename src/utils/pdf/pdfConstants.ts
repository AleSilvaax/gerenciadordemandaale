
export const PDF_COLORS = {
  primary: [41, 98, 184] as const,      // Azul profissional
  secondary: [74, 85, 104] as const,    // Cinza escuro
  accent: [16, 185, 129] as const,      // Verde moderno
  text: [31, 41, 55] as const,          // Texto principal
  lightGray: [243, 244, 246] as const,  // Fundo claro
  white: [255, 255, 255] as const,      // Branco
  border: [209, 213, 219] as const      // Borda
};

export const PDF_DIMENSIONS = {
  pageWidth: 210,
  pageHeight: 297,
  margin: 20,
  headerHeight: 20,
  sectionHeight: 12,
  maxImageWidth: 120,
  maxImageHeight: 90,
  signatureWidth: 80,
  signatureHeight: 25
} as const;

export const PDF_FONTS = {
  normal: "helvetica",
  bold: "bold"
} as const;
