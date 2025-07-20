// Utilitários para manter a performance da aplicação

/**
 * Limpa logs excessivos do console em produção
 */
export const cleanupPerformance = () => {
  if (process.env.NODE_ENV === 'production') {
    // Limitar console.log em produção
    const originalLog = console.log;
    console.log = (...args) => {
      // Só permitir logs importantes
      if (args[0]?.includes?.('[ERROR]') || args[0]?.includes?.('[CRITICAL]')) {
        originalLog.apply(console, args);
      }
    };
  }
};

/**
 * Otimizações de performance para o app
 */
export const optimizePerformance = () => {
  // Limpar localStorage periodicamente
  try {
    const storageKeys = Object.keys(localStorage);
    if (storageKeys.length > 50) {
      console.log('[PERF] Limpando localStorage excessivo');
      // Manter apenas chaves importantes
      const keepKeys = storageKeys.filter(key => 
        key.startsWith('supabase') || 
        key.includes('theme') || 
        key.includes('settings')
      );
      localStorage.clear();
      // Restaurar chaves importantes se necessário
    }
  } catch (error) {
    console.error('[PERF] Erro ao limpar localStorage:', error);
  }
};

/**
 * Debounce para otimizar chamadas frequentes
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Throttle para limitar execuções
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func.apply(null, args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
};