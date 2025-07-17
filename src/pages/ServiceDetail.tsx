// Arquivo: src/pages/ServiceDetail.tsx (Versão de Teste)

import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client"; // Importa o supabase diretamente

const ServiceDetailTest: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [serviceData, setServiceData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchServiceDirectly = async () => {
      if (!id) return;

      console.log(`[TESTE DIRETO] Tentando buscar a demanda com id: ${id}`);

      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('[TESTE DIRETO] Erro do Supabase:', error);
        setError(`Erro do Supabase: ${error.message}`);
      } else {
        console.log('[TESTE DIRETO] Dados recebidos:', data);
        setServiceData(data);
      }
      setIsLoading(false);
    };

    fetchServiceDirectly();
  }, [id]);

  if (isLoading) {
    return <div>Carregando diretamente do Supabase...</div>;
  }

  if (error) {
    return (
      <div>
        <h1>Ocorreu um Erro na Busca</h1>
        <pre style={{ color: 'red', background: '#f0f0f0', padding: '10px' }}>
          {error}
        </pre>
      </div>
    );
  }

  return (
    <div>
      <h1>Página de Teste da Demanda</h1>
      <p>Se você está vendo isso, a busca funcionou!</p>
      <pre style={{ background: '#f0f0f0', padding: '10px' }}>
        {JSON.stringify(serviceData, null, 2)}
      </pre>
    </div>
  );
};

export default ServiceDetailTest;
