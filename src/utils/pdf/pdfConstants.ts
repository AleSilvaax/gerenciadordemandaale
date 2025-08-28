
export const PDF_COLORS = {
  // Revo Corporate Colors
  black: [0, 0, 0],               // Preto total #000000
  white: [255, 255, 255],         // Branco #FFFFFF
  darkGray: [38, 36, 38],         // Cinza escuro #262426 (fundos e bordas)
  revoYellow: [244, 255, 0],      // Amarelo Revo #F4FF00 (destaques)
  
  // Legacy colors for compatibility
  primary: [0, 0, 0],             // Black as primary
  primaryLight: [38, 36, 38],     // Dark gray
  secondary: [38, 36, 38],        // Dark gray for secondary text
  accent: [244, 255, 0],          // Revo Yellow for accents
  accentLight: [244, 255, 0],     // Revo Yellow
  text: [0, 0, 0],                // Black text
  textLight: [38, 36, 38],        // Dark gray for secondary text
  lightGray: [248, 248, 248],     // Very light gray background
  mediumGray: [200, 200, 200],    // Medium gray
  border: [38, 36, 38],           // Dark gray borders
  success: [244, 255, 0],         // Revo Yellow for success
  warning: [244, 255, 0],         // Revo Yellow for warnings
  danger: [0, 0, 0]               // Black for danger
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
