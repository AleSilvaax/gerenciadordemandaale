
export const PDF_COLORS = {
  // Revo Corporate Palette
  black: [0, 0, 0],               // Preto total #000000
  white: [255, 255, 255],         // Branco #FFFFFF
  darkGray: [38, 36, 38],         // Cinza escuro #262426
  revoYellow: [244, 255, 0],      // Amarelo Revo #F4FF00
  
  // Legacy colors for compatibility
  primary: [0, 0, 0],             // Preto como primário
  primaryLight: [38, 36, 38],     // Cinza escuro
  secondary: [38, 36, 38],        // Cinza escuro
  accent: [244, 255, 0],          // Amarelo Revo
  accentLight: [244, 255, 0],     // Amarelo Revo
  text: [255, 255, 255],          // Texto branco
  textLight: [200, 200, 200],     // Texto cinza claro
  lightGray: [60, 60, 60],        // Cinza claro
  mediumGray: [38, 36, 38],       // Cinza médio
  border: [100, 100, 100],        // Borda cinza
  success: [244, 255, 0],         // Amarelo Revo
  warning: [244, 255, 0],         // Amarelo Revo
  danger: [255, 100, 100]         // Vermelho claro
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
