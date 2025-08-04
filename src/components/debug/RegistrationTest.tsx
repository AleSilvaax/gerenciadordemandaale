import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, AlertCircle, Database, User, Settings } from 'lucide-react';

interface TestResult {
  test: string;
  status: 'success' | 'error' | 'warning';
  message: string;
}

export const RegistrationTest: React.FC = () => {
  const [results, setResults] = useState<TestResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);

  const addResult = (test: string, status: 'success' | 'error' | 'warning', message: string) => {
    setResults(prev => [...prev, { test, status, message }]);
  };

  const runTests = async () => {
    setIsRunning(true);
    setResults([]);

    try {
      // Teste 1: Verificar organização padrão
      addResult('Verificando organização padrão', 'warning', 'Executando...');
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .select('*')
        .eq('id', '00000000-0000-0000-0000-000000000001')
        .single();

      if (orgError) {
        addResult('Organização padrão', 'error', `Erro: ${orgError.message}`);
      } else if (org) {
        addResult('Organização padrão', 'success', `Encontrada: ${org.name}`);
      } else {
        addResult('Organização padrão', 'error', 'Não encontrada');
      }

      // Teste 2: Verificar se consegue acessar profiles
      addResult('Verificando acesso à tabela profiles', 'warning', 'Executando...');
      const { error: profilesError } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (!profilesError) {
        addResult('Acesso à tabela profiles', 'success', 'Acesso funcionando');
      } else {
        addResult('Acesso à tabela profiles', 'error', `Erro: ${profilesError.message}`);
      }

      // Teste 3: Verificar se consegue acessar user_roles
      addResult('Verificando acesso à tabela user_roles', 'warning', 'Executando...');
      const { error: rolesError } = await supabase
        .from('user_roles')
        .select('id')
        .limit(1);

      if (!rolesError) {
        addResult('Acesso à tabela user_roles', 'success', 'Acesso funcionando');
      } else {
        addResult('Acesso à tabela user_roles', 'error', `Erro: ${rolesError.message}`);
      }

      // Teste 4: Verificar se consegue acessar organization_roles
      addResult('Verificando acesso à tabela organization_roles', 'warning', 'Executando...');
      const { error: orgRolesError } = await supabase
        .from('organization_roles')
        .select('id')
        .limit(1);

      if (!orgRolesError) {
        addResult('Acesso à tabela organization_roles', 'success', 'Acesso funcionando');
      } else {
        addResult('Acesso à tabela organization_roles', 'error', `Erro: ${orgRolesError.message}`);
      }

      // Teste 5: Verificar equipes (opcional)
      addResult('Verificando equipes', 'warning', 'Executando...');
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('count')
        .limit(1);

      if (!teamsError) {
        addResult('Equipes disponíveis', 'success', `${teams?.length || 0} equipes encontradas`);
      } else {
        addResult('Equipes disponíveis', 'warning', 'Erro ao verificar equipes');
      }

    } catch (error) {
      addResult('Teste geral', 'error', `Erro inesperado: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  const getIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'warning': return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Teste do Sistema de Registro
        </CardTitle>
        <CardDescription>
          Executa testes para verificar se o sistema de registro está funcionando corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runTests} 
          disabled={isRunning}
          className="w-full"
        >
          {isRunning ? (
            <>
              <AlertCircle className="h-4 w-4 mr-2 animate-spin" />
              Executando testes...
            </>
          ) : (
            <>
              <Database className="h-4 w-4 mr-2" />
              Executar Testes
            </>
          )}
        </Button>

        {results.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Resultados dos Testes:</h3>
            {results.map((result, index) => (
              <Alert key={index} variant={result.status === 'error' ? 'destructive' : 'default'}>
                <div className="flex items-center gap-2">
                  {getIcon(result.status)}
                  <div>
                    <strong>{result.test}:</strong> {result.message}
                  </div>
                </div>
              </Alert>
            ))}
          </div>
        )}

        {results.length > 0 && !isRunning && (
          <Alert>
            <User className="h-4 w-4" />
            <AlertDescription>
              <strong>Para testar o registro completo:</strong><br />
              1. Verifique se todos os testes passaram<br />
              2. Vá para a página de registro (/register)<br />
              3. Tente criar um novo usuário<br />
              4. Verifique os logs no console do navegador<br />
              5. Confirme se o usuário aparece no painel do Supabase
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};