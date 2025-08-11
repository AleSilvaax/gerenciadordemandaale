
export const PDF_COLORS = {
  primary: [20, 67, 151],         // Azul vibrante mais escuro
  primaryLight: [59, 130, 246],   // Azul mais claro
  secondary: [45, 55, 72],        // Cinza moderno
  accent: [5, 150, 105],          // Verde esmeralda
  accentLight: [34, 197, 94],     // Verde claro
  text: [17, 24, 39],             // Texto mais escuro
  textLight: [75, 85, 99],        // Texto secundário
  lightGray: [248, 250, 252],     // Fundo muito claro
  mediumGray: [226, 232, 240],    // Fundo médio
  white: [255, 255, 255],         // Branco puro
  border: [203, 213, 225],        // Borda suave
  success: [34, 197, 94],         // Verde sucesso
  warning: [251, 191, 36],        // Amarelo aviso
  danger: [239, 68, 68]           // Vermelho perigo
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
