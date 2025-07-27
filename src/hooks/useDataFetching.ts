// COLE ESTE CÓDIGO DENTRO DE: src/hooks/useDataFetching.ts

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';

// T é um tipo genérico (pode ser Service[], TeamMember[], etc.)
export const useDataFetching = <T>(
  fetchFunction: () => Promise<T>
) => {
  const { user } = useAuth();
  const [data, setData] = useState<T[]>([]); // Usa um nome genérico 'data'
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchData = useCallback(async () => {
    // Apenas mostra o "loading" grande na primeira vez.
    if (data.length === 0) {
      setIsLoading(true);
    }
    setError(null);

    try {
      const fetchedData = await fetchFunction();
      // Lógica de atualização segura: só atualiza o estado se a busca for bem-sucedida.
      setData(fetchedData as T[]);
    } catch (err) {
      console.error("Falha na busca de dados:", err);
      // Lógica de erro segura: NÃO limpa os dados antigos em caso de falha.
      setError(err instanceof Error ? err : new Error('Ocorreu um erro desconhecido'));
    } finally {
      setIsLoading(false);
    }
  }, [fetchFunction, data.length]);

  useEffect(() => {
    if (user) {
      fetchData(); // Busca inicial
    } else {
      // Se o usuário deslogar, limpa os dados para evitar mostrar informações antigas.
      setData([]);
    }
  }, [user, fetchData]);

  // Função para permitir o refresh manual
  const refresh = useCallback(() => {
    if (user) {
      fetchData();
    }
  }, [user, fetchData]);

  return {
    data, // Retorna os dados de forma genérica
    isLoading,
    error,
    refresh
  };
};
