
export const cleanupAuthState = () => {
  console.log("Limpando estado de autenticação...");
  
  // Remove tokens do Supabase do localStorage
  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
      localStorage.removeItem(key);
      console.log("Removido do localStorage:", key);
    }
  });
  
  // Remove do sessionStorage se existir
  if (typeof sessionStorage !== 'undefined') {
    Object.keys(sessionStorage).forEach((key) => {
      if (key.startsWith('supabase.auth.') || key.includes('sb-')) {
        sessionStorage.removeItem(key);
        console.log("Removido do sessionStorage:", key);
      }
    });
  }
  
  console.log("Limpeza do estado de autenticação concluída");
};
