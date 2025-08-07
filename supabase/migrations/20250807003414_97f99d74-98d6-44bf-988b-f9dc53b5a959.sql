-- CORREÇÃO FINAL: Política RLS mais simples e funcional

-- Remover política atual problemática
DROP POLICY IF EXISTS "Usuários autenticados podem ver serviços de sua organização" ON public.services;

-- Criar política extremamente simples para teste
CREATE POLICY "Permitir visualização de serviços" 
ON public.services 
FOR SELECT 
USING (
  -- Permitir para usuários autenticados
  auth.uid() IS NOT NULL
);

-- Garantir que as políticas de service_technicians também funcionem
DROP POLICY IF EXISTS "Todos podem ver atribuições de técnicos" ON public.service_technicians;
CREATE POLICY "Visualizar atribuições de técnicos" 
ON public.service_technicians 
FOR SELECT 
USING (auth.uid() IS NOT NULL);