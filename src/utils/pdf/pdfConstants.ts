
export const PDF_COLORS = {
  primary: [41, 98, 184],      // Azul profissional
  secondary: [74, 85, 104],    // Cinza escuro
  accent: [16, 185, 129],      // Verde moderno
  text: [31, 41, 55],          // Texto principal
  lightGray: [243, 244, 246],  // Fundo claro
  white: [255, 255, 255],      // Branco
  border: [209, 213, 219]      // Borda
} as const;

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
